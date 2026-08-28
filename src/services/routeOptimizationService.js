const config = require("../config/operationsResearch");
const repository = require("../repositories");
const { ROUTES } = require("../../simulator/route-generator");
const {
  WeightedRouteScoringStrategy,
} = require("./weightedRouteScoringStrategy");
const scoringStrategy = new WeightedRouteScoringStrategy();
const operationalRoutesByTransport = new Map();
let operationalSeed = 0;
function cloneRoutes(routes) {
  return routes.map((route) => ({
    ...route,
    points: route.points.map((point) => ({ ...point })),
  }));
}
function generateOperationalRoutes(seed = 0) {
  const routes = cloneRoutes(ROUTES),
    profile = Math.abs(Math.floor(Number(seed) || 0)) % 3,
    byId = Object.fromEntries(routes.map((route) => [route.id, route]));
  if (profile === 0) {
    Object.assign(byId.ROTA_A, {
      tempoEstimado: 43,
      risco: 0.28,
      custo: 54,
      transito: "LEVE",
      sinal: 88,
      confiabilidade: 0.93,
      disponivel: true,
    });
    Object.assign(byId.ROTA_B, {
      tempoEstimado: 54,
      risco: 0.52,
      custo: 69,
      transito: "INTENSO",
      sinal: 71,
      confiabilidade: 0.79,
      disponivel: true,
    });
    Object.assign(byId.ROTA_C, {
      tempoEstimado: 60,
      risco: 0.58,
      custo: 56,
      transito: "INTENSO",
      sinal: 42,
      confiabilidade: 0.67,
      disponivel: true,
    });
  } else if (profile === 1) {
    Object.assign(byId.ROTA_A, {
      tempoEstimado: 52,
      risco: 0.49,
      custo: 60,
      transito: "MODERADO",
      sinal: 79,
      confiabilidade: 0.84,
      disponivel: true,
    });
    Object.assign(byId.ROTA_B, {
      tempoEstimado: 41,
      risco: 0.23,
      custo: 59,
      transito: "LEVE",
      sinal: 93,
      confiabilidade: 0.96,
      disponivel: true,
    });
    Object.assign(byId.ROTA_C, {
      tempoEstimado: 63,
      risco: 0.68,
      custo: 63,
      transito: "INTENSO",
      sinal: 41,
      confiabilidade: 0.62,
      disponivel: true,
    });
  } else {
    Object.assign(byId.ROTA_A, {
      tempoEstimado: 58,
      risco: 0.63,
      custo: 66,
      transito: "INTENSO",
      sinal: 76,
      confiabilidade: 0.8,
      disponivel: true,
    });
    Object.assign(byId.ROTA_B, {
      tempoEstimado: 54,
      risco: 0.57,
      custo: 73,
      transito: "MODERADO",
      sinal: 73,
      confiabilidade: 0.78,
      disponivel: true,
    });
    Object.assign(byId.ROTA_C, {
      tempoEstimado: 40,
      risco: 0.24,
      custo: 45,
      transito: "LEVE",
      sinal: 79,
      confiabilidade: 0.94,
      disponivel: true,
    });
  }
  return { seed: profile, routes };
}
function refreshConditions(transporteId, seed) {
  const effectiveSeed = seed === undefined ? operationalSeed++ : seed,
    conditions = generateOperationalRoutes(effectiveSeed);
  operationalRoutesByTransport.set(Number(transporteId), conditions);
  return { ...conditions, routes: cloneRoutes(conditions.routes) };
}
function getCandidates(transporteId) {
  const id = Number(transporteId);
  if (!operationalRoutesByTransport.has(id)) refreshConditions(id);
  const conditions = operationalRoutesByTransport.get(id);
  return {
    seed: conditions.seed,
    routes: cloneRoutes(conditions.routes),
    weights: config.weights,
    constraints: config.constraints,
    demonstrative: true,
  };
}
function normalize(values, value) {
  const min = Math.min(...values),
    max = Math.max(...values);
  return max === min ? 0 : (value - min) / (max - min);
}
function validateWeights(weights) {
  const keys = ["tempo", "risco", "distancia", "custo"];
  const total = keys.reduce((sum, key) => sum + Number(weights[key] || 0), 0);
  if (Math.abs(total - 1) > 0.0001)
    throw Object.assign(new Error("A soma dos pesos deve ser 1."), {
      status: 400,
    });
  return Object.fromEntries(keys.map((key) => [key, Number(weights[key])]));
}
function evaluateRoutes(routes = ROUTES, options = {}) {
  if (!routes.length)
    throw Object.assign(new Error("Nenhuma rota candidata foi informada."), {
      status: 400,
    });
  const weights = validateWeights(options.weights || config.weights),
    constraints = { ...config.constraints, ...options.constraints },
    columns = {
      tempo: routes.map((r) => r.tempoEstimado),
      risco: routes.map((r) => r.risco),
      distancia: routes.map((r) => r.distancia),
      custo: routes.map((r) => r.custo),
    };
  const evaluated = routes.map((route) => {
      const normalized = {
          tempo: normalize(columns.tempo, route.tempoEstimado),
          risco: normalize(columns.risco, route.risco),
          distancia: normalize(columns.distancia, route.distancia),
          custo: normalize(columns.custo, route.custo),
        },
        { partials, score } = scoringStrategy.calculate(normalized, weights),
        violations = [];
      if (!route.disponivel) violations.push("Rota indisponível");
      if (route.tempoEstimado > constraints.tempoMaximoMin)
        violations.push("Tempo máximo excedido");
      if (route.risco > constraints.riscoMaximo)
        violations.push("Risco máximo excedido");
      if (route.distancia > constraints.distanciaMaximaKm)
        violations.push("Distância máxima excedida");
      if (route.sinal < constraints.sinalMinimo)
        violations.push("Comunicação insuficiente");
      return {
        ...route,
        normalized,
        partials,
        score,
        viavel: violations.length === 0,
        violations,
      };
    }),
    viable = evaluated
      .filter((route) => route.viavel)
      .sort((a, b) => a.score - b.score || a.id.localeCompare(b.id));
  if (!viable.length)
    throw Object.assign(
      new Error("Nenhuma alternativa atende às restrições obrigatórias."),
      { status: 422, details: evaluated },
    );
  const selected = viable[0],
    ranked = evaluated.map((route) => {
      const position = viable.findIndex((item) => item.id === route.id);
      return {
        ...route,
        selecionada: route.id === selected.id,
        ranking: position >= 0 ? position + 1 : null,
      };
    });
  return {
    weights,
    constraints,
    routes: ranked,
    selectedRouteId: selected.id,
    selectedRoute: selected,
    objective: "Min Z = wt·T + wr·R + wd·D + wc·C",
  };
}
async function optimize(transporteId, options = {}) {
  const transport = await repository.getTransporte(transporteId);
  if (!transport)
    throw Object.assign(new Error("Transporte não encontrado."), {
      status: 404,
    });
  const candidates = options.routes || getCandidates(transporteId).routes,
    result = evaluateRoutes(candidates, options);
  await repository.saveOptimization(Number(transporteId), result);
  await repository.createEvento({
    transporteId: Number(transporteId),
    tipoEvento: "ROTA_OTIMIZADA",
    descricao: `${result.selectedRoute.nome} recomendada com score ${result.selectedRoute.score.toFixed(3)}.`,
  });
  return result;
}
async function getLatest(transporteId) {
  const stored = await repository.getLatestOptimization(Number(transporteId));
  if (!stored) return null;
  const viable = [...stored.routes]
    .filter((route) => Boolean(route.viavel))
    .sort(
      (a, b) =>
        Number(a.score) - Number(b.score) ||
        (a.rota || a.id).localeCompare(b.rota || b.id),
    );
  stored.routes = stored.routes.map((route) => {
    const id = route.rota || route.id,
      metadata = ROUTES.find((item) => item.id === id) || {},
      details = route.detalhes_calculo || {};
    return {
      ...metadata,
      ...route,
      id,
      nome: route.nome_rota || route.nome || metadata.nome,
      tempoEstimado:
        route.tempo_estimado ?? route.tempoEstimado ?? metadata.tempoEstimado,
      normalized: details.normalized || route.normalized,
      partials: details.partials || route.partials,
      violations: details.violations || route.violations,
      ranking:
        viable.findIndex((item) => (item.rota || item.id) === id) + 1 || null,
    };
  });
  return stored;
}
module.exports = {
  normalize,
  validateWeights,
  evaluateRoutes,
  optimize,
  getLatest,
  getCandidates,
  refreshConditions,
  generateOperationalRoutes,
};
