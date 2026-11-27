const test = require("node:test");
const assert = require("node:assert/strict");

process.env.DB_DRIVER = "memory";
const planning = require("../src/services/organPlanningService");
const execution = require("../src/services/executionPlanService");
const simulation = require("../src/services/simulationService");
const repository = require("../src/repositories");

const origin = { name: "São Paulo", latitude: -23.5505, longitude: -46.6333 };
const destination = { name: "Brasília", latitude: -15.7939, longitude: -47.8828 };

async function feasiblePlan() {
  return planning.calculate({
    organCode: "HEART",
    consumedMinutes: 45,
    origin,
    destination,
  });
}

test("Mapa para na pausa, mas isquemia e margem continuam contando", async () => {
  const id = 987610;
  const result = await feasiblePlan();
  assert.ok(result.selected, "Rota acadêmica factível necessária");
  try {
    execution.freeze(id, result.selected, result);
    const before = execution.advance(id, 5);
    assert.ok(before.totalProgress > 0);

    // Pausa há ~1s: o modelo é acelerado pelo SIMULATION_TIME_SCALE.
    execution.pause(id, Date.now() - 1000);
    const waiting = execution.get(id);
    assert.equal(waiting.totalProgress, before.totalProgress);
    assert.equal(waiting.traveledKm, before.traveledKm);
    assert.deepEqual(waiting.currentPosition, before.currentPosition);
    assert.ok(waiting.ischemiaTotalMinutes > before.ischemiaTotalMinutes);
    assert.ok(waiting.remainingMarginMinutes < before.remainingMarginMinutes);

    // Chamadas repetidas de pause são idempotentes: não reiniciam o relógio.
    execution.pause(id);
    const later = execution.get(id);
    assert.ok(later.ischemiaTotalMinutes >= waiting.ischemiaTotalMinutes);
    assert.equal(later.totalProgress, before.totalProgress);

    const resumed = execution.resume(id);
    assert.ok(resumed.ischemiaTotalMinutes >= later.ischemiaTotalMinutes - 0.01);
    assert.equal(resumed.totalProgress, before.totalProgress);
    const advanced = execution.advance(id, 5);
    assert.ok(advanced.totalProgress > before.totalProgress);

    const finished = execution.finish(id);
    const after = execution.get(id);
    assert.equal(after.ischemiaTotalMinutes, finished.ischemiaTotalMinutes);
    assert.equal(after.totalProgress, 1);
  } finally {
    execution.reset(id);
  }
});

test("Reotimização segura pausa rota automaticamente, não a isquemia", async () => {
  const transport = await repository.createTransporte({
    codigo_transporte: "CLOCK-" + Date.now(),
    identificador_caixa: "TESTE-REOTIMIZACAO",
    tipo_orgao: "Coração",
    hospital_origem: "São Paulo",
    hospital_destino: "Brasília",
    latitude_origem: origin.latitude,
    longitude_origem: origin.longitude,
    latitude_destino: destination.latitude,
    longitude_destino: destination.longitude,
  });
  const result = await feasiblePlan();
  const conditions = {
    originHasHelipad: true,
    groundAccessOriginAvailable: false,
    infrastructureAvailability: {
      AIRPORT_ORIGIN: true,
      AIRPORT_DESTINATION: true,
      HELIPORT_ORIGIN: true,
      HELIPORT_DEST: true,
      HELIPORT_DESTINATION: true,
    },
  };
  try {
    await simulation.start(
      transport.id,
      "LOGISTICS_PLAN",
      result.selected,
      result,
      "IOT",
    );
    const before = simulation.status().logistics;
    const recommendation = await simulation.recommendReoptimization(
      transport.id, "Trecho terrestre indisponível", conditions,
    );
    assert.ok(recommendation.recommendationId);
    assert.equal(simulation.status().running, false);
    assert.equal(
      simulation.status().awaitingRecommendationId,
      recommendation.recommendationId,
    );
    const paused = simulation.status().logistics;
    await new Promise((resolve) => setTimeout(resolve, 60));
    const waiting = simulation.status().logistics;
    assert.equal(waiting.totalProgress, paused.totalProgress);
    assert.deepEqual(waiting.currentPosition, paused.currentPosition);
    assert.ok(waiting.ischemiaTotalMinutes > paused.ischemiaTotalMinutes);
    assert.ok(waiting.remainingMarginMinutes < paused.remainingMarginMinutes);
    assert.ok(waiting.ischemiaTotalMinutes >= before.ischemiaTotalMinutes);

    const applied = await simulation.applyReoptimization(
      transport.id, recommendation.recommendationId,
    );
    assert.equal(applied.running, true);
    assert.equal(applied.awaitingRecommendationId, null);
    assert.ok(
      applied.logistics.ischemiaTotalMinutes >= waiting.ischemiaTotalMinutes,
    );
    assert.equal(
      applied.logistics.totalProgress,
      paused.totalProgress,
      "Reotimizacao nao deve mover a caixa durante a decisao",
    );
  } finally {
    await simulation.reset(transport.id);
  }
});
