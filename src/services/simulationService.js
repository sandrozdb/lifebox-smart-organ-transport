const { randomUUID } = require("crypto");
const config = require("../config");
const repository = require("../repositories");
const telemetry = require("./telemetryService");
const transportService = require("./transportService");
const optimizationService = require("./routeOptimizationService");
const planningService = require("./organPlanningService");
const executionPlan = require("./executionPlanService");
const { generate } = require("../../simulator/sensor-generator");
const { SCENARIOS } = require("../../simulator/scenarios");
const { httpError } = require("../utils/httpError");
const iotState = require("./iotStateService");

const RECOMMENDATION_TTL_MS = 5 * 60 * 1000;
const recommendations = new Map();
const initialTelemetry = Object.freeze({
  temperatura: 4,
  umidade: 58,
  impacto: 0.1,
  bateria: 100,
  sinal: 100,
  aceleracao: 0.25,
  aceleracao_x: 0.25,
  aceleracao_y: 0,
  aceleracao_z: 1,
});
let timer = null;
let state = freshState(1);

function freshState(transporteId) {
  return {
    running: false,
    transporteId: Number(transporteId),
    tick: 0,
    scenarioTick: 0,
    scenario: "normal",
    progress: 0,
    battery: 100,
    routeId: null,
    digitalSignal: { alertOutput: false, ledOn: false, buzzerOn: false },
    executionId: null,
  };
}

function ensureActiveExecution(transporteId) {
  const execution = ensureExecution(transporteId);
  if (!state.running)
    throw httpError(
      409,
      "EXECUTION_NOT_RUNNING",
      "O transporte precisa estar em execução.",
    );
  return execution;
}

function ensureExecution(transporteId) {
  const id = Number(transporteId);
  if (state.transporteId !== id) {
    throw httpError(
      409,
      "EXECUTION_MISMATCH",
      "A execução logística não pertence ao transporte informado.",
    );
  }
  const snapshot = executionPlan.get(id);
  if (!snapshot)
    throw httpError(
      409,
      "EXECUTION_PLAN_NOT_FOUND",
      "Execução logística ativa não encontrada.",
    );
  return { id, snapshot };
}

function planningInput(snapshot, conditions = {}) {
  return {
    organCode: snapshot.organProfile?.code,
    consumedMinutes: snapshot.ischemiaTotalMinutes,
    origin: { name: "Posição atual da LifeBox", ...snapshot.currentPosition },
    destination: snapshot.destination,
    conditions,
  };
}

async function tick() {
  if (!state.running || iotState.snapshot().mode !== iotState.MODES.DEMO)
    return;
  state.scenarioTick += 1;
  try {
    const now = Date.now();
    const elapsedRealSeconds = (now - (state.lastTickAt || now)) / 1000;
    state.lastTickAt = now;
    state.logistics = executionPlan.advance(
      state.transporteId,
      elapsedRealSeconds,
    );
    const payload = generate(state);
    const result = await telemetry.receive(payload);
    state.digitalSignal = result.digitalSignal;
    if (state.scenario === "sinal" && state.scenarioTick === 7) {
      await repository.createEvento({
        transporteId: state.transporteId,
        executionId: state.executionId,
        tipoEvento: "COMUNICACAO_RESTABELECIDA",
        descricao: "Comunicação simulada restabelecida.",
        latitude: payload.latitude,
        longitude: payload.longitude,
      });
    }
    if (state.progress >= 1) {
      const finalSnapshot = executionPlan.finish(state.transporteId);
      await stop();
      await transportService.finish(state.transporteId, finalSnapshot);
    }
  } catch (error) {
    console.error("Falha no simulador:", error.message);
  }
}

async function start(transporteId = 1, rotaId, plan, result) {
  // Mantém compatibilidade com clientes antigos que iniciam o simulador
  // diretamente, sem passar primeiro pelo seletor do dashboard.
  iotState.setMode(iotState.MODES.DEMO);
  state.transporteId = Number(transporteId);
  if (!(await repository.getTransporte(state.transporteId)))
    throw httpError(404, "TRANSPORT_NOT_FOUND", "Transporte não encontrado.");
  if (!rotaId)
    throw httpError(
      409,
      "PLAN_REQUIRED",
      "Calcule a rota ótima antes de iniciar o transporte.",
    );
  if (plan && result)
    state.logistics = executionPlan.freeze(state.transporteId, plan, result);
  state.routeId = String(rotaId);
  const started = await transportService.start(state.transporteId);
  state.executionId = started.execucao_atual_id;
  state.lastTickAt = Date.now();
  state.running = true;
  if (!timer) timer = setInterval(tick, config.simulatorIntervalMs);
  return status();
}

async function recommendReoptimization(transporteId, reason, conditions = {}) {
  const { id, snapshot } = ensureActiveExecution(transporteId);
  const result = await planningService.calculate(
    planningInput(snapshot, conditions),
  );
  if (!result.selected)
    throw httpError(
      409,
      "NO_FEASIBLE_RECOMMENDATION",
      "Nenhum novo plano factível está disponível.",
    );
  if (result.selected.id === snapshot.planId)
    throw httpError(
      409,
      "PLAN_UNCHANGED",
      "A condição informada não altera o plano ativo.",
    );
  const recommendationId = randomUUID();
  recommendations.set(recommendationId, {
    recommendationId,
    transporteId: id,
    executionId: state.executionId,
    currentPlanId: snapshot.planId,
    reason: reason || "Condição operacional atualizada",
    conditions: JSON.parse(JSON.stringify(conditions)),
    createdAt: Date.now(),
    used: false,
    result,
  });
  state.running = false;
  state.lastTickAt = null;
  state.logistics = snapshot;
  state.awaitingRecommendationId = recommendationId;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  await repository.createEvento({
    transporteId: id,
    executionId: state.executionId,
    tipoEvento: "REOTIMIZACAO_AGUARDANDO_ROTA",
    descricao: `Rota pausada para escolha de alternativa. Motivo: ${reason || "Condição operacional atualizada"}.`,
    latitude: snapshot.currentPosition.latitude,
    longitude: snapshot.currentPosition.longitude,
  });
  return {
    recommendationId,
    status: "RECOMENDADA",
    currentPlan: {
      id: snapshot.planId,
      modal: snapshot.modal,
      name: snapshot.planName,
      timeMin: snapshot.remainingPlanMinutes,
      cost: snapshot.remainingPlanCost,
      marginMinutes: snapshot.remainingMarginMinutes,
    },
    plan: result.selected,
    result,
    reason,
    expiresInSeconds: RECOMMENDATION_TTL_MS / 1000,
  };
}

async function applyReoptimization(transporteId, recommendationId) {
  const { id, snapshot } = ensureExecution(transporteId);
  const recommendation = recommendations.get(recommendationId);
  if (!recommendation || recommendation.transporteId !== id)
    throw httpError(
      404,
      "RECOMMENDATION_NOT_FOUND",
      "Recomendação de reotimização não encontrada.",
    );
  if (recommendation.used)
    throw httpError(
      409,
      "RECOMMENDATION_ALREADY_APPLIED",
      "A recomendação já foi aplicada.",
    );
  if (Date.now() - recommendation.createdAt > RECOMMENDATION_TTL_MS)
    throw httpError(
      409,
      "RECOMMENDATION_STALE",
      "A recomendação expirou e deve ser recalculada.",
    );
  if (
    recommendation.executionId !== state.executionId ||
    recommendation.currentPlanId !== snapshot.planId
  ) {
    throw httpError(
      409,
      "RECOMMENDATION_STALE",
      "O estado da execução mudou; recalcule a recomendação.",
    );
  }
  const recalculated = await planningService.calculate(
    planningInput(snapshot, recommendation.conditions),
  );
  if (
    !recalculated.selected ||
    recalculated.selected.id !== recommendation.result.selected.id
  ) {
    throw httpError(
      409,
      "RECOMMENDATION_STALE",
      "A recomendação não é mais factível.",
    );
  }
  const plan = recalculated.selected;
  const next = executionPlan.replace(id, plan, recalculated);
  recommendation.used = true;
  state.awaitingRecommendationId = null;
  state.logistics = next;
  state.routeId = "LOGISTICS_PLAN";
  state.running = true;
  state.lastTickAt = Date.now();
  if (!timer) timer = setInterval(tick, config.simulatorIntervalMs);
  await repository.createEvento({
    transporteId: id,
    executionId: state.executionId,
    tipoEvento: "REOTIMIZACAO_APLICADA",
    descricao: `Plano ${snapshot.planName} substituído por ${plan.name}. Motivo: ${recommendation.reason}. Progresso anterior: ${(snapshot.totalProgress * 100).toFixed(0)}%. Isquemia no momento: ${snapshot.ischemiaTotalMinutes.toFixed(0)} min.`,
    latitude: snapshot.currentPosition.latitude,
    longitude: snapshot.currentPosition.longitude,
  });
  return { ...status(), appliedRecommendationId: recommendationId };
}

async function stop() {
  state.running = false;
  state.lastTickAt = null;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  return status();
}

async function resume(transporteId = state.transporteId) {
  ensureExecution(transporteId);
  if (state.awaitingRecommendationId)
    throw httpError(
      409,
      "REOPTIMIZATION_DECISION_REQUIRED",
      "Aplique o novo plano antes de retomar o deslocamento.",
    );
  state.running = true;
  state.lastTickAt = Date.now();
  if (!timer) timer = setInterval(tick, config.simulatorIntervalMs);
  return status();
}

async function reset(transporteId = state.transporteId) {
  await stop();
  executionPlan.reset(transporteId);
  recommendations.clear();
  state = freshState(transporteId);
  optimizationService.refreshConditions(state.transporteId);
  await repository.updateTransporte(state.transporteId, {
    status: "PREPARADO",
    inicio_transporte: null,
    fim_transporte: null,
  });
  return status();
}

async function scenario(name, transporteId) {
  if (!SCENARIOS[name])
    throw httpError(422, "INVALID_SCENARIO", "Cenário inválido.");
  iotState.setMode(iotState.MODES.DEMO);
  iotState.setScenario(name);
  if (transporteId !== undefined) {
    const id = Number(transporteId);
    if (!(await repository.getTransporte(id)))
      throw httpError(404, "TRANSPORT_NOT_FOUND", "Transporte não encontrado.");
    state.transporteId = id;
  }
  state.scenario = name;
  state.scenarioTick = 0;
  if (name === "normal") {
    state.battery = 100;
    for (const alert of await repository.getAlertas(
      state.transporteId,
      state.executionId,
    ))
      if (!alert.resolvido) await repository.resolveAlerta(alert.id);
    await repository.createEvento({
      transporteId: state.transporteId,
      executionId: state.executionId,
      tipoEvento: "CONDICOES_NORMALIZADAS",
      descricao: "Cenário normal reativado.",
    });
  }
  if (name === "bateria") state.battery = 40;
  if (name === "atraso")
    await repository.createEvento({
      transporteId: state.transporteId,
      executionId: state.executionId,
      tipoEvento: "ATRASO_SIMULADO",
      descricao: "Velocidade reduzida para demonstração de atraso.",
    });
  if (name === "sinal")
    await repository.createEvento({
      transporteId: state.transporteId,
      executionId: state.executionId,
      tipoEvento: "COMUNICACAO_INTERROMPIDA",
      descricao: "Perda temporária de sinal simulada.",
    });
  if (name === "concluir") {
    state.progress = 1;
    const finalSnapshot = executionPlan.finish(state.transporteId);
    state.logistics = finalSnapshot;
    await stop();
    await transportService.finish(state.transporteId, finalSnapshot);
  } else if (state.running) await tick();
  return status();
}

function status() {
  return {
    ...state,
    logistics: executionPlan.get(state.transporteId),
    initialTelemetry,
    availableScenarios: Object.entries(SCENARIOS).map(([id, value]) => ({
      id,
      label: value.label,
    })),
  };
}

module.exports = {
  start,
  resume,
  stop,
  reset,
  scenario,
  recommendReoptimization,
  applyReoptimization,
  status,
  tick,
  _recommendations: recommendations,
};
