const repository = require("../repositories");
const config = require("../config");
const numeric = (value, fallback = 0) =>
  Number.isFinite(Number(value)) ? Number(value) : fallback;
const round = (value, places = 1) => Number(Number(value || 0).toFixed(places));
const executionIdFor = (id) =>
  `exec-${id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const readingTime = (reading) =>
  new Date(
    String(reading.registrado_em || reading.timestamp).replace(" ", "T"),
  ).getTime();
function weightedWithinRange(readings, elapsedMinutes) {
  if (!readings.length) return 0;
  const sorted = [...readings].sort((a, b) => readingTime(a) - readingTime(b));
  const rawWeights = sorted.map((reading, index) =>
    index
      ? Math.max(0, readingTime(reading) - readingTime(sorted[index - 1]))
      : 0,
  );
  const rawTotal = rawWeights.reduce((sum, value) => sum + value, 0);
  const target = Math.max(0, elapsedMinutes * 60000);
  const weights =
    rawTotal > 0
      ? rawWeights.map((value) => (value / rawTotal) * target)
      : sorted.map(() => target / sorted.length);
  const inside = sorted.reduce(
    (sum, reading, index) =>
      sum +
      (numeric(reading.temperatura) >= 2 && numeric(reading.temperatura) <= 8
        ? weights[index]
        : 0),
    0,
  );
  return target ? (inside / target) * 100 : 0;
}
function summarizeExecution({ transport, readings, alerts, events, snapshot }) {
  const ordered = [...readings].reverse();
  const temps = ordered.map((row) => numeric(row.temperatura));
  const humidity = ordered.map((row) => numeric(row.umidade));
  const duration = numeric(snapshot?.transportElapsedMinutes);
  const plan = snapshot
    ? {
        id: snapshot.planId,
        nome: snapshot.planName,
        modal: snapshot.modal,
        distancia_total_km: round(snapshot.totalDistanceKm, 2),
        distancia_percorrida_km: round(snapshot.traveledKm, 2),
        distancia_restante_km: round(snapshot.remainingKm, 2),
      }
    : null;
  const byType = alerts.reduce((acc, alert) => {
    acc[alert.tipo] = (acc[alert.tipo] || 0) + 1;
    return acc;
  }, {});
  const reopts = events.filter(
    (event) => event.tipo_evento === "REOTIMIZACAO_APLICADA",
  );
  return {
    execution_id: transport.execucao_atual_id,
    duracao_minutos: round(duration, 2),
    total_leituras: ordered.length,
    temperatura_min: temps.length ? Math.min(...temps) : null,
    temperatura_max: temps.length ? Math.max(...temps) : null,
    temperatura_media: temps.length
      ? round(temps.reduce((sum, value) => sum + value, 0) / temps.length, 2)
      : null,
    umidade_min: humidity.length ? Math.min(...humidity) : null,
    umidade_max: humidity.length ? Math.max(...humidity) : null,
    umidade_media: humidity.length
      ? round(
          humidity.reduce((sum, value) => sum + value, 0) / humidity.length,
          2,
        )
      : null,
    impactos_criticos: alerts.filter(
      (alert) => alert.tipo === "IMPACTO" && alert.severidade === "CRITICO",
    ).length,
    numero_alertas: Object.keys(byType).length,
    alertas_por_tipo: byType,
    percentual_tempo_limites: round(weightedWithinRange(ordered, duration), 1),
    bateria_final: ordered.length ? numeric(ordered.at(-1).bateria) : null,
    isquemia_inicial_minutos: numeric(snapshot?.initialConsumedMinutes),
    isquemia_final_minutos: round(numeric(snapshot?.ischemiaTotalMinutes), 2),
    margem_final_minutos: round(numeric(snapshot?.remainingMarginMinutes), 2),
    isquemia_maxima_minutos: numeric(snapshot?.maximumIschemiaMinutes),
    plano_inicial: snapshot?.initialPlan || plan,
    plano_final: plan,
    quantidade_reotimizacoes: reopts.length,
    reotimizacoes: reopts.map((event) => event.descricao),
    origem:
      snapshot?.origin ||
      (transport
        ? {
            nome: transport.hospital_origem,
            latitude: transport.latitude_origem,
            longitude: transport.longitude_origem,
          }
        : null),
    destino:
      snapshot?.destination ||
      (transport
        ? {
            nome: transport.hospital_destino,
            latitude: transport.latitude_destino,
            longitude: transport.longitude_destino,
          }
        : null),
  };
}
async function start(id, executionId) {
  const transport = await repository.getTransporte(id);
  if (!transport)
    throw Object.assign(new Error("Transporte não encontrado."), {
      status: 404,
    });
  const currentExecutionId = executionId || executionIdFor(id);
  const started = await repository.updateTransporte(id, {
    status: "EM_ANDAMENTO",
    inicio_transporte: new Date(),
    fim_transporte: null,
    execucao_atual_id: currentExecutionId,
  });
  await repository.createEvento({
    transporteId: id,
    executionId: currentExecutionId,
    tipoEvento: "TRANSPORTE_INICIADO",
    descricao: "Transporte demonstrativo iniciado.",
    latitude: transport.latitude_origem,
    longitude: transport.longitude_origem,
  });
  return started;
}
async function finish(id, snapshot) {
  const transport = await repository.getTransporte(id);
  if (!transport)
    throw Object.assign(new Error("Transporte não encontrado."), {
      status: 404,
    });
  const executionId = transport.execucao_atual_id;
  const readings = await repository.getLeituras(id, 100000, executionId),
    alerts = await repository.getAlertas(id, executionId),
    events = await repository.getEventos(id, executionId);
  const summary = summarizeExecution({
    transport,
    readings,
    alerts,
    events,
    snapshot,
  });
  await repository.saveExecutionSummary(id, executionId, summary);
  const finished = await repository.updateTransporte(id, {
    status: "CONCLUIDO",
    fim_transporte: new Date(),
  });
  await repository.createEvento({
    transporteId: id,
    executionId,
    tipoEvento: "TRANSPORTE_CONCLUIDO",
    descricao:
      "Transporte demonstrativo concluído. Condições monitoradas e ocorrências registradas.",
    latitude: transport.latitude_destino,
    longitude: transport.longitude_destino,
  });
  return finished;
}
async function tracking(id) {
  const transport = await repository.getTransporte(id);
  if (!transport)
    throw Object.assign(new Error("Transporte não encontrado."), {
      status: 404,
    });
  const execution = require("./executionPlanService").get(id);
  if (execution)
    return {
      origin: execution.origin,
      destination: execution.destination,
      current: execution.currentPosition,
      route: execution.totalPath,
      routeName: execution.planName,
      modal: execution.modal,
      segments: execution.segments,
      currentSegment: execution.currentSegment,
      segmentIndex: execution.currentSegmentIndex,
      totalSegments: execution.segments.length,
      progress: execution.totalProgress * 100,
      totalKm: execution.totalDistanceKm,
      traveledKm: execution.traveledKm,
      remainingKm: execution.remainingKm,
      path: execution.traveledPath,
      simulationElapsedSeconds: execution.simulationElapsedSeconds,
      transportElapsedMinutes: execution.transportElapsedMinutes,
      ischemiaTotalMinutes: execution.ischemiaTotalMinutes,
      remainingMarginMinutes: execution.remainingMarginMinutes,
      initialConsumedMinutes: execution.initialConsumedMinutes,
      maximumIschemiaMinutes: execution.maximumIschemiaMinutes,
      operationalSafetyMarginMinutes: execution.operationalSafetyMarginMinutes,
    };
  return {
    origin: {
      latitude: transport.latitude_origem,
      longitude: transport.longitude_origem,
      name: transport.hospital_origem,
    },
    destination: {
      latitude: transport.latitude_destino,
      longitude: transport.longitude_destino,
      name: transport.hospital_destino,
    },
    current: null,
    route: [],
    routeName: "Aguardando plano logístico",
    segments: [],
    progress: 0,
    totalKm: 0,
    traveledKm: 0,
    remainingKm: 0,
    path: [],
  };
}
async function summary(id) {
  const transport = await repository.getTransporte(id);
  if (!transport)
    throw Object.assign(new Error("Transporte não encontrado."), {
      status: 404,
    });
  const saved = transport.execucao_atual_id
    ? await repository.getExecutionSummary(id, transport.execucao_atual_id)
    : null;
  return {
    transport,
    status_final: transport.status,
    ...(saved || { duracao_minutos: 0, total_leituras: 0, numero_alertas: 0 }),
  };
}
module.exports = { start, finish, tracking, summary, summarizeExecution };
