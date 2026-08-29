const { getOrganProfile, profiles } = require("../config/organProfiles");
const modalConfig = require("../config/modalTransport");
const { FallbackLocationProvider } = require("./locationProvider");
const { strategies } = require("./modalPlannerStrategies");
const { scenarios } = require("../config/demoLocations");
const baseConditions = {
  trafficIncrease: 0,
  delayMinutes: 0,
  airCostIncrease: 0,
  roadDistanceFactor: 1.18,
  originHasHelipad: false,
  destinationHasHelipad: false,
  groundAccessOriginAvailable: true,
  groundAccessDestinationAvailable: true,
  modalAvailability: {
    GROUND: true,
    HELICOPTER: true,
    AIRPLANE: true,
    MULTIMODAL: true,
  },
  infrastructureAvailability: {
    AIRPORT_ORIGIN: true,
    AIRPORT_DESTINATION: true,
    HELIPORT_ORIGIN: true,
    HELIPORT_DESTINATION: true,
  },
};
function clone(v) {
  return JSON.parse(JSON.stringify(v));
}
function conditionFrom(input = {}) {
  const c = clone(baseConditions),
    whatIf = input.whatIf || {};
  Object.assign(c, input.conditions || {});
  if (whatIf.traffic30) c.trafficIncrease += 0.3;
  if (whatIf.delay40) c.delayMinutes += 40;
  if (whatIf.helicopterUnavailable) c.modalAvailability.HELICOPTER = false;
  if (whatIf.airportUnavailable) {
    c.infrastructureAvailability.AIRPORT_ORIGIN = false;
    c.infrastructureAvailability.AIRPORT_DESTINATION = false;
  }
  if (whatIf.airCost20) c.airCostIncrease += 0.2;
  if (whatIf.consumed30) c.extraConsumedMinutes += 30;
  return c;
}
function totals(segments) {
  return {
    distanceKm: segments.reduce((n, s) => n + s.distanceKm, 0),
    timeMin: segments.reduce((n, s) => n + s.timeMin, 0),
    cost: segments.reduce((n, s) => n + s.cost, 0),
  };
}
function evaluatePlan(plan, profile, consumed, conditions) {
  const t = totals(plan.segments);
  t.timeMin = Number((t.timeMin + conditions.delayMinutes).toFixed(2));
  const margin = profile.ischemia.officialMaxMinutes - consumed - t.timeMin;
  const violations = [];
  const modalCode =
    plan.modalCode ||
    Object.entries(modalConfig).find(([, x]) => x.name === plan.modal)?.[0];
  if (!conditions.modalAvailability[modalCode])
    violations.push("Modal indisponível");
  for (const infra of plan.requiredInfrastructure || [])
    if (!conditions.infrastructureAvailability[infra])
      violations.push(`Infraestrutura indisponível: ${infra}`);
  if (margin < 0) violations.push("Excede a janela de isquemia adotada");
  else if (margin < profile.ischemia.operationalSafetyMarginMinutes)
    violations.push("Margem abaixo do mínimo operacional");
  const operationalViolation = violations.some(
    (item) =>
      item.startsWith("Modal indisponível") ||
      item.startsWith("Infraestrutura indisponível"),
  );
  const status =
    operationalViolation || margin < 0
      ? "INVIAVEL"
      : margin < profile.ischemia.operationalSafetyMarginMinutes
        ? "MARGEM_CRITICA"
        : "FACTIVEL";
  return {
    ...plan,
    ...t,
    consumedMinutes: consumed,
    marginMinutes: Number(margin.toFixed(2)),
    status,
    viavel: status === "FACTIVEL",
    eligible: status === "FACTIVEL",
    motivo: violations.length
      ? violations.join("; ")
      : "Atende às restrições do modelo",
  };
}
async function calculate(input = {}, deps = {}) {
  const profile = getOrganProfile(input.organCode);
  if (!profile)
    throw Object.assign(new Error("Órgão sólido não reconhecido."), {
      status: 400,
    });
  const conditions = conditionFrom(input);
  const consumed = Math.max(
    0,
    Number(input.consumedMinutes || 0) +
      Number(conditions.extraConsumedMinutes || 0),
  );
  const provider = deps.locationProvider || new FallbackLocationProvider();
  const origin =
    input.origin?.latitude !== undefined
      ? input.origin
      : await provider.geocode(input.origin?.query, "origin");
  const destination =
    input.destination?.latitude !== undefined
      ? input.destination
      : await provider.geocode(input.destination?.query, "destination");
  if (!origin || !destination)
    throw Object.assign(
      new Error("Informe origem e destino para calcular os planos."),
      { status: 400 },
    );
  const planned = (
    await Promise.all(
      strategies().map((strategy) =>
        strategy.plan({
          origin,
          destination,
          locationProvider: provider,
          conditions,
        }),
      ),
    )
  ).flat();
  const alternatives = planned
    .map((plan) => {
      const points = Object.fromEntries(
        [origin, destination, ...(plan.facilities || [])].map((x) => [
          x.name,
          x,
        ]),
      );
      plan.segments = plan.segments.map((segment) => ({
        ...segment,
        origin:
          segment.origin ||
          segment.geometry?.[0] ||
          points[segment.from] ||
          null,
        destination:
          segment.destination ||
          segment.geometry?.at(-1) ||
          points[segment.to] ||
          null,
      }));
      return evaluatePlan(plan, profile, consumed, conditions);
    })
    .sort((a, b) => a.cost - b.cost || a.id.localeCompare(b.id));
  const modalWinners = Object.values(
    alternatives.reduce((groups, alternative) => {
      const key = alternative.modal;
      (groups[key] ??= []).push(alternative);
      return groups;
    }, {}),
  ).map(
    (group) =>
      [...group].sort(
        (a, b) =>
          Number(b.eligible) - Number(a.eligible) ||
          a.cost - b.cost ||
          b.marginMinutes - a.marginMinutes ||
          a.timeMin - b.timeMin ||
          a.risk - b.risk,
      )[0],
  );
  const feasible = modalWinners
    .filter((a) => a.eligible)
    .sort(
      (a, b) =>
        a.cost - b.cost ||
        b.marginMinutes - a.marginMinutes ||
        a.timeMin - b.timeMin ||
        a.risk - b.risk,
    );
  const selected = feasible[0] || null;
  const reoptimizationRecommended = Boolean(
    input.telemetry &&
    (input.telemetry.temperatureOutOfRange ||
      input.telemetry.delay ||
      input.telemetry.congestion ||
      input.telemetry.modalUnavailable ||
      input.telemetry.marginLoss),
  );
  return {
    model: "LIFEBOX_LOGISTICS_V1",
    disclaimer:
      "Modelo acadêmico de apoio à decisão logística. Não é ferramenta clínica nem confirma viabilidade do enxerto.",
    profile,
    origin,
    destination,
    conditions,
    consumedMinutes: consumed,
    alternatives: alternatives.map((a) => ({
      ...a,
      modalWinner: modalWinners.some((winner) => winner.id === a.id),
      ranking: feasible.findIndex((x) => x.id === a.id) + 1 || null,
      selected: a.id === selected?.id,
    })),
    selected,
    objective:
      "MIN C_total = soma dos custos dos segmentos + acionamento + preparação + transferências",
    constraints: [
      "T_consumido + T_transporte ≤ T_max_órgão",
      "M = T_max − T_consumido − T_transporte",
      "M ≥ margem_mínima",
      "modal e infraestrutura disponíveis",
      "preservação dentro da faixa adotada",
    ],
    reoptimizationRecommended,
    status: selected ? "SOLUTION_FOUND" : "NO_FEASIBLE_SOLUTION",
  };
}
function getProfiles() {
  return profiles.map(clone);
}
function getDemoScenarios() {
  return scenarios.map(clone);
}
module.exports = {
  calculate,
  getProfiles,
  getDemoScenarios,
  conditionFrom,
  evaluatePlan,
  baseConditions,
};
