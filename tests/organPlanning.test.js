const test = require("node:test");
const assert = require("node:assert/strict");
const planning = require("../src/services/organPlanningService");
const fixedLocations = {
  origin: { name: "Hospital A", latitude: -23.55, longitude: -46.63 },
  destination: { name: "Hospital B", latitude: -21.17, longitude: -47.8 },
};
async function plan(overrides = {}) {
  return planning.calculate({
    organCode: "HEART",
    consumedMinutes: 45,
    ...fixedLocations,
    ...overrides,
  });
}
test("PO logística: coração rejeita plano acima de 4 horas", async () => {
  const r = await plan({ conditions: { roadDistanceFactor: 8 } });
  assert.equal(
    r.alternatives.find((a) => a.modal === "Terrestre").status,
    "INVIAVEL",
  );
});
test("PO logística: rim pode aceitar o mesmo plano terrestre", async () => {
  const r = await planning.calculate({
    organCode: "KIDNEY",
    consumedMinutes: 45,
    ...fixedLocations,
    conditions: { roadDistanceFactor: 4 },
  });
  assert.equal(
    r.alternatives.find((a) => a.modal === "Terrestre").status,
    "FACTIVEL",
  );
});
test("PO logística: menor custo vence entre planos factíveis", async () => {
  const r = await plan();
  assert.equal(
    r.selected.cost,
    Math.min(...r.alternatives.filter((a) => a.eligible).map((a) => a.cost)),
  );
});
test("PO logística: o mais rápido não vence automaticamente", async () => {
  const r = await plan({ consumedMinutes: 0 });
  const fast = [...r.alternatives].sort((a, b) => a.timeMin - b.timeMin)[0];
  assert.notEqual(r.selected.id, fast.id);
});
test("PO logística: avião inclui deslocamento até aeroporto", async () => {
  const r = await plan();
  assert.ok(
    r.alternatives
      .find((a) => a.id === "PLAN_MULTIMODAL_T_A_T")
      .segments.some(
        (s) =>
          s.modal === "TERRESTRE" &&
          s.phase === "acesso ao aeroporto de origem",
      ),
  );
});
test("PO logística: avião inclui aeroporto até hospital destino", async () => {
  const r = await plan();
  assert.ok(
    r.alternatives
      .find((a) => a.id === "PLAN_MULTIMODAL_T_A_T")
      .segments.some(
        (s) =>
          s.modal === "TERRESTRE" &&
          s.phase === "saída do aeroporto de destino",
      ),
  );
});
test("PO logística: helicóptero inclui transferências quando necessárias", async () => {
  const r = await plan();
  assert.ok(
    r.alternatives
      .find((a) => a.id === "PLAN_HELICOPTER")
      .segments.filter((s) => s.modal === "TERRESTRE").length >= 2,
  );
});
test("PO logística: heliponto hospitalar reduz transferência", async () => {
  const r = await plan({
    conditions: { originHasHelipad: true, destinationHasHelipad: true },
  });
  assert.equal(
    r.alternatives
      .find((a) => a.id === "PLAN_HELICOPTER")
      .segments.filter((s) => s.modal === "TERRESTRE").length,
    0,
  );
});
test("PO logística: margem negativa é inviável", async () => {
  const r = await plan({ consumedMinutes: 239 });
  assert.equal(
    r.alternatives.find((a) => a.modal === "Terrestre").status,
    "INVIAVEL",
  );
});
test("PO logística: margem abaixo do mínimo é crítica e não elegível", async () => {
  const r = await plan({ consumedMinutes: 75 });
  const a = r.alternatives.find((a) => a.id === "PLAN_MULTIMODAL_T_A_T");
  assert.equal(a.status, "MARGEM_CRITICA");
  assert.equal(a.eligible, false);
});
test("PO logística: modal indisponível é eliminado", async () => {
  const r = await plan({
    conditions: {
      modalAvailability: {
        GROUND: true,
        HELICOPTER: false,
        AIRPLANE: true,
        MULTIMODAL: true,
      },
    },
  });
  assert.equal(
    r.alternatives.find((a) => a.id === "PLAN_HELICOPTER").status,
    "INVIAVEL",
  );
});
test("PO logística: aeroporto indisponível elimina plano aéreo", async () => {
  const r = await plan({ whatIf: { airportUnavailable: true } });
  assert.equal(
    r.alternatives.find((a) => a.id === "PLAN_MULTIMODAL_T_A_T").status,
    "INVIAVEL",
  );
});
test("PO logística: nenhum plano factível retorna sem solução", async () => {
  const r = await plan({
    consumedMinutes: 239,
    conditions: {
      modalAvailability: {
        GROUND: false,
        HELICOPTER: false,
        AIRPLANE: false,
        MULTIMODAL: false,
      },
    },
  });
  assert.equal(r.status, "NO_FEASIBLE_SOLUTION");
  assert.equal(r.selected, null);
});
test("PO logística: mudança de órgão altera a solução", async () => {
  const heart = await plan({ consumedMinutes: 220 });
  const kidney = await planning.calculate({
    organCode: "KIDNEY",
    consumedMinutes: 220,
    ...fixedLocations,
  });
  assert.notEqual(heart.status, kidney.status);
});
test("PO logística: aumento de trânsito pode alterar viabilidade", async () => {
  const normal = await plan({ consumedMinutes: 100 });
  const traffic = await plan({
    consumedMinutes: 100,
    whatIf: { traffic30: true },
  });
  assert.ok(
    traffic.alternatives.find((a) => a.modal === "Terrestre").timeMin >
      normal.alternatives.find((a) => a.modal === "Terrestre").timeMin,
  );
});
test("PO logística: atraso dispara reotimização recomendada quando informado", async () => {
  const r = await plan({ telemetry: { delay: true } });
  assert.equal(r.reoptimizationRecommended, true);
});
test("PO logística: custos são soma dos segmentos", async () => {
  const r = await plan();
  const a = r.alternatives.find((a) => a.id === "PLAN_MULTIMODAL_T_A_T");
  assert.equal(
    a.cost,
    Number(a.segments.reduce((n, s) => n + s.cost, 0).toFixed(2)),
  );
});
test("PO logística: tempos somam segmentos e atraso", async () => {
  const r = await plan({ whatIf: { delay40: true } });
  const a = r.alternatives.find((a) => a.id === "PLAN_MULTIMODAL_T_A_T");
  assert.equal(
    a.timeMin,
    Number((a.segments.reduce((n, s) => n + s.timeMin, 0) + 40).toFixed(2)),
  );
});
const {
  scenarios: demoScenarios,
  airports: demoAirports,
} = require("../src/config/demoLocations");
test("cenários logísticos determinísticos selecionam o resultado configurado", async () => {
  for (const item of demoScenarios) {
    const result = await planning.calculate({
      organCode: item.organCode,
      consumedMinutes: item.consumedMinutes,
      origin: item.origin,
      destination: item.destination,
      conditions: item.conditions,
    });
    assert.equal(result.selected?.id || null, item.expectedPlanId);
  }
});
test("cenário aéreo usa aeroportos reais SBSP e SBBR configurados", () => {
  assert.equal(demoAirports.SBSP.type, "REAL");
  assert.equal(demoAirports.SBBR.type, "REAL");
  assert.equal(
    demoScenarios.find((x) => x.id === "AIR_LONG").conditions.facilities
      .AIRPORT_ORIGIN.icao,
    "SBSP",
  );
});
const execution = require("../src/services/executionPlanService");
test("rastreabilidade logística progride por segmentos e mantém modal atual", async () => {
  const r = await plan({ consumedMinutes: 0 });
  const active = r.alternatives.find((x) => x.id === "PLAN_MULTIMODAL_T_A_T");
  execution.freeze(999, active, r);
  let status = execution.get(999);
  assert.equal(status.currentSegment.modal, "TERRESTRE");
  status = execution.advance(999, 40);
  assert.equal(status.currentSegment.modal, "AVIÃO");
  status = execution.advance(999, 100);
  assert.equal(status.currentSegment.modal, "TERRESTRE");
  assert.ok(status.totalProgress > 0);
  assert.ok(status.remainingKm < status.totalDistanceKm);
});
test("plano ativo permanece estável até confirmação explícita de reotimização", async () => {
  const r = await plan({ consumedMinutes: 0 });
  const active = r.alternatives.find((x) => x.id === "PLAN_MULTIMODAL_T_A_T");
  execution.freeze(998, active, r);
  const before = execution.get(998).planId;
  const alternative = r.alternatives.find((x) => x.id === "PLAN_HELICOPTER");
  assert.notEqual(alternative.id, before);
  assert.equal(execution.get(998).planId, before);
});
test("relógio simulado aplica escala, isquemia e margem", async () => {
  const r = await plan({ consumedMinutes: 45 });
  const active = r.alternatives.find((x) => x.id === "PLAN_MULTIMODAL_T_A_T");
  execution.freeze(777, active, r);
  const after = execution.advance(777, 1);
  assert.equal(after.transportElapsedMinutes, 1);
  assert.equal(after.ischemiaTotalMinutes, 46);
  assert.equal(
    after.remainingMarginMinutes,
    r.profile.ischemia.officialMaxMinutes - 46,
  );
});
test("pausa externa não avança e reinício do plano zera relógio", async () => {
  const r = await plan({ consumedMinutes: 45 });
  const active = r.alternatives.find((x) => x.id === "PLAN_MULTIMODAL_T_A_T");
  execution.freeze(776, active, r);
  execution.advance(776, 2);
  const paused = execution.get(776);
  assert.equal(
    execution.get(776).simulationElapsedSeconds,
    paused.simulationElapsedSeconds,
  );
  execution.freeze(776, active, r);
  assert.equal(execution.get(776).transportElapsedMinutes, 0);
});
test("progresso logístico acompanha minutos simulados", async () => {
  const r = await plan({ consumedMinutes: 0 });
  const active = r.alternatives.find((x) => x.id === "PLAN_MULTIMODAL_T_A_T");
  execution.freeze(775, active, r);
  const before = execution.get(775).totalProgress;
  const after = execution.advance(775, 10);
  assert.ok(after.totalProgress > before);
});
const {
  GroundRoutingProvider,
} = require("../src/services/groundRoutingProvider");
test("groundRoutingProvider retorna múltiplos caminhos para São Paulo e Campinas", async () => {
  const routes = await new GroundRoutingProvider().routes(
    { latitude: -23.55, longitude: -46.63 },
    { latitude: -22.91, longitude: -47.06 },
  );
  assert.equal(routes.length, 2);
  assert.ok(routes.every((route) => route.classification === "SIMULATED"));
});
test("menor custo terrestre factível vence e expõe geometria", async () => {
  const r = await planning.calculate({
    organCode: "KIDNEY",
    consumedMinutes: 45,
    origin: { name: "São Paulo", latitude: -23.55, longitude: -46.63 },
    destination: { name: "Campinas", latitude: -22.91, longitude: -47.06 },
  });
  const ground = r.alternatives.filter(
    (x) => x.modal === "Terrestre" && x.eligible,
  );
  assert.equal(ground[0].groundRoute.via, "Rodovia Anhanguera");
  assert.ok(ground[0].segments[0].geometry.length > 2);
});
test("trânsito altera os tempos dos caminhos terrestres", async () => {
  const p = {
    organCode: "KIDNEY",
    consumedMinutes: 45,
    origin: { name: "São Paulo", latitude: -23.55, longitude: -46.63 },
    destination: { name: "Campinas", latitude: -22.91, longitude: -47.06 },
  };
  const a = await planning.calculate(p),
    b = await planning.calculate({
      ...p,
      conditions: { trafficIncrease: 0.3 },
    });
  assert.ok(
    b.alternatives.find((x) => x.id === "PLAN_GROUND_ANHANGUERA").timeMin >
      a.alternatives.find((x) => x.id === "PLAN_GROUND_ANHANGUERA").timeMin,
  );
});
test("indisponibilidade da Anhanguera recomenda a Bandeirantes", async () => {
  const result = await planning.calculate({
    organCode: "KIDNEY",
    consumedMinutes: 45,
    origin: { name: "São Paulo", latitude: -23.55, longitude: -46.63 },
    destination: { name: "Campinas", latitude: -22.91, longitude: -47.06 },
    conditions: { groundRouteUnavailable: "GROUND_ANHANGUERA" },
  });
  assert.equal(
    result.alternatives.some((plan) => plan.id === "PLAN_GROUND_ANHANGUERA"),
    false,
  );
  assert.equal(result.selected.id, "PLAN_GROUND_BANDEIRANTES");
});
test("snapshot da execução atualiza posição e caminho percorrido", async () => {
  const r = await plan({ consumedMinutes: 45 });
  const active = r.alternatives.find(
    (item) => item.id === "PLAN_MULTIMODAL_T_A_T",
  );
  execution.freeze(774, active, r);
  const before = execution.get(774);
  const after = execution.advance(774, 10);
  assert.notDeepEqual(after.currentPosition, before.currentPosition);
  assert.ok(after.traveledPath.length >= 2);
  assert.ok(after.traveledKm > before.traveledKm);
  assert.ok(after.remainingKm < before.remainingKm);
});
test("isquemia e margem usam o mesmo snapshot acelerado", async () => {
  const r = await plan({ consumedMinutes: 45 });
  const active = r.alternatives.find(
    (item) => item.id === "PLAN_MULTIMODAL_T_A_T",
  );
  execution.freeze(773, active, r);
  const after = execution.advance(773, 3);
  assert.equal(after.ischemiaTotalMinutes, 48);
  assert.equal(
    after.remainingMarginMinutes,
    r.profile.ischemia.officialMaxMinutes - 48,
  );
});
test("plano com avião é sempre multimodal e possui acesso, voo e saída", async () => {
  const r = await plan();
  const airPlans = r.alternatives.filter((item) =>
    item.segments.some((segment) => segment.modal === "AVIÃO"),
  );
  assert.ok(airPlans.length > 0);
  for (const item of airPlans) {
    const modes = item.segments
      .filter((segment) => segment.distanceKm > 0)
      .map((segment) => segment.modal);
    assert.equal(modes.length, 3);
    assert.equal(modes[1], "AVIÃO");
    assert.ok(["TERRESTRE", "HELICÓPTERO"].includes(modes[0]));
    assert.ok(["TERRESTRE", "HELICÓPTERO"].includes(modes[2]));
    assert.ok(!/^Avião$/.test(item.modal));
  }
});
test("combinações multimodais com helicóptero só surgem com helipontos viáveis", async () => {
  const r = await plan({
    conditions: { originHasHelipad: true, destinationHasHelipad: true },
  });
  const plans = r.alternatives.filter((item) =>
    item.id.startsWith("PLAN_MULTIMODAL_"),
  );
  assert.deepEqual(plans.map((item) => item.id).sort(), [
    "PLAN_MULTIMODAL_H_A_H",
    "PLAN_MULTIMODAL_H_A_T",
    "PLAN_MULTIMODAL_T_A_H",
    "PLAN_MULTIMODAL_T_A_T",
  ]);
});
test("coração mantém máximo de isquemia de 240 minutos no plano", async () => {
  const r = await plan({ consumedMinutes: 45 });
  assert.equal(r.profile.ischemia.officialMaxMinutes, 240);
  assert.equal(r.consumedMinutes, 45);
});
test("seletor não possui cenário São Paulo-Rio e mantém aéreo multimodal", () => {
  assert.equal(
    demoScenarios.some((item) => /rio/i.test(item.name)),
    false,
  );
  assert.ok(
    demoScenarios.some(
      (item) =>
        item.name === "Longa distância interestadual — Plano aéreo multimodal",
    ),
  );
});
test("cenário crítico multimodal seleciona helicóptero mais avião por restrição operacional", async () => {
  const item = demoScenarios.find(
    (scenario) => scenario.id === "CRITICAL_MULTIMODAL",
  );
  const r = await planning.calculate({
    organCode: item.organCode,
    consumedMinutes: item.consumedMinutes,
    origin: item.origin,
    destination: item.destination,
    conditions: item.conditions,
  });
  assert.equal(r.selected.id, "PLAN_MULTIMODAL_H_A_T");
  assert.deepEqual(
    r.selected.segments
      .filter((segment) => segment.distanceKm > 0)
      .map((segment) => segment.modal),
    ["HELICÓPTERO", "AVIÃO", "TERRESTRE"],
  );
});
test("cenário crítico multimodal usa cidades padronizadas nos campos principais", () => {
  const item = demoScenarios.find(
    (scenario) => scenario.id === "CRITICAL_MULTIMODAL",
  );
  assert.equal(item.origin.name, "São Paulo - SP");
  assert.equal(item.destination.name, "Brasília - DF");
});
test("reotimização preserva posição, histórico, tempo e isquemia da execução", async () => {
  const first = await plan({ consumedMinutes: 45 });
  const active = first.alternatives.find(
    (item) => item.id === "PLAN_MULTIMODAL_T_A_T",
  );
  execution.freeze(772, active, first);
  execution.advance(772, 25);
  const before = execution.get(772);
  const next = await planning.calculate({
    organCode: "HEART",
    consumedMinutes: before.ischemiaTotalMinutes,
    origin: { name: "Posição atual da LifeBox", ...before.currentPosition },
    destination: fixedLocations.destination,
    conditions: { originHasHelipad: true, destinationHasHelipad: true },
  });
  const applied = execution.replace(772, next.selected, next);
  assert.deepEqual(applied.currentPosition, before.currentPosition);
  assert.equal(applied.transportElapsedMinutes, before.transportElapsedMinutes);
  assert.equal(applied.ischemiaTotalMinutes, before.ischemiaTotalMinutes);
  assert.equal(applied.historicalDistanceKm, before.traveledKm);
  assert.ok(applied.traveledPath.length >= before.traveledPath.length);
  assert.notEqual(applied.planId, before.planId);
});
test("reotimização não muda execução até a aplicação explícita", async () => {
  const r = await plan({ consumedMinutes: 0 });
  const active = r.alternatives.find(
    (item) => item.id === "PLAN_MULTIMODAL_T_A_T",
  );
  execution.freeze(771, active, r);
  const before = execution.get(771);
  const recommendation = await planning.calculate({
    organCode: "HEART",
    consumedMinutes: before.ischemiaTotalMinutes,
    origin: { name: "Posição atual da LifeBox", ...before.currentPosition },
    destination: fixedLocations.destination,
  });
  assert.ok(recommendation.selected);
  assert.equal(execution.get(771).planId, before.planId);
});
