process.env.DB_DRIVER = "memory";
process.env.ALERT_COOLDOWN_SECONDS = "30";
const test = require("node:test");
const fs = require("node:fs");
const assert = require("node:assert/strict");
const app = require("../src/app");
const repository = require("../src/repositories");
const { ensureDemo } = require("../src/services/bootstrapService");
const telemetry = require("../src/services/telemetryService");
const transportService = require("../src/services/transportService");
const { evaluate } = require("../src/services/ruleEngine");
const { trackingProgress } = require("../src/utils/geo");
const routeOptimization = require("../src/services/routeOptimizationService");
const physics = require("../src/services/physicsService");
const { ROUTES } = require("../simulator/route-generator");
let server, base, transport;
test.before(async () => {
  repository.reset();
  transport = await ensureDemo();
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());
const payload = (overrides) => ({
  transporteId: transport.id,
  deviceId: "LIFEBOX-001",
  temperatura: 5,
  umidade: 58,
  aceleracao: 0.2,
  impacto: 0.1,
  latitude: -23.561684,
  longitude: -46.655981,
  velocidade: 35,
  bateria: 90,
  sinal: 85,
  timestamp: new Date().toISOString(),
  ...overrides,
});
test("API health responde", async () => {
  const r = await fetch(`${base}/api/health`);
  assert.equal(r.status, 200);
  assert.equal((await r.json()).status, "ok");
});
test("cria e consulta transporte", async () => {
  const body = {
    codigo_transporte: "TEST-002",
    identificador_caixa: "BOX-2",
    tipo_orgao: "Dado simulado",
    hospital_origem: "Origem fictícia",
    hospital_destino: "Destino fictício",
    latitude_origem: -23.5,
    longitude_origem: -46.6,
    latitude_destino: -23.6,
    longitude_destino: -46.7,
  };
  const r = await fetch(`${base}/api/transportes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  assert.equal(r.status, 201);
  const created = await r.json();
  assert.equal(
    (await (await fetch(`${base}/api/transportes/${created.id}`)).json())
      .codigo_transporte,
    "TEST-002",
  );
});
test("recebe telemetria normal", async () => {
  const result = await telemetry.receive(payload({}));
  assert.equal(result.status, "EM_ANDAMENTO");
  assert.equal((await repository.getLeituras(transport.id)).length, 1);
});
test("motor cria alerta crítico com deduplicação", async () => {
  const first = await telemetry.receive(payload({ temperatura: 12 }));
  const second = await telemetry.receive(payload({ temperatura: 12.5 }));
  assert.equal(first.alerts[0].tipo, "TEMPERATURA");
  assert.equal(first.alerts[0].severidade, "CRITICO");
  assert.equal(second.alerts.length, 0);
  assert.ok(
    (await repository.getEventos(transport.id)).some(
      (event) => event.tipo_evento === "ALERTA_TEMPERATURA",
    ),
  );
});
test("motor identifica impacto", () =>
  assert.equal(evaluate(payload({ impacto: 4 }))[0].tipo, "IMPACTO"));
test("calcula progresso de rota", () => {
  const route = [
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: 1 },
    ],
    readings = [
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: 0.5 },
    ];
  const result = trackingProgress(route, readings);
  assert.ok(result.progress > 40 && result.progress < 60);
});
test("finalização gera resumo", async () => {
  await transportService.start(transport.id);
  await transportService.finish(transport.id);
  const summary = await transportService.summary(transport.id);
  assert.equal(summary.status_final, "CONCLUIDO");
  assert.equal(summary.total_leituras, 0);
});
test("normalização min-max e valores iguais", () => {
  assert.equal(routeOptimization.normalize([10, 20, 30], 20), 0.5);
  assert.equal(routeOptimization.normalize([5, 5], 5), 0);
});
test("aplica pesos e escolhe menor score viável", () => {
  const result = routeOptimization.evaluateRoutes(ROUTES);
  assert.equal(result.selectedRouteId, "ROTA_B");
  assert.equal(result.routes.find((x) => x.id === "ROTA_C").viavel, false);
  assert.ok(
    result.selectedRoute.score <
      result.routes.find((x) => x.id === "ROTA_A").score,
  );
});
test("elimina rota indisponível", () => {
  const routes = ROUTES.map((route, index) => ({
    ...route,
    disponivel: index !== 1,
  }));
  assert.notEqual(
    routeOptimization.evaluateRoutes(routes).selectedRouteId,
    "ROTA_B",
  );
});
test("desempata rotas pelo identificador", () => {
  const base = {
    distancia: 10,
    tempoEstimado: 10,
    risco: 0.2,
    custo: 10,
    transito: "LEVE",
    confiabilidade: 0.9,
    sinal: 90,
    disponivel: true,
    points: [],
  };
  const result = routeOptimization.evaluateRoutes([
    { ...base, id: "ROTA_B", nome: "B" },
    { ...base, id: "ROTA_A", nome: "A" },
  ]);
  assert.equal(result.selectedRouteId, "ROTA_A");
});
test("informa ausência de alternativa válida", () =>
  assert.throws(
    () =>
      routeOptimization.evaluateRoutes(
        ROUTES.map((route) => ({ ...route, disponivel: false })),
      ),
    /Nenhuma alternativa/,
  ));
test("calcula ΔT e taxa térmica", () => {
  assert.ok(Math.abs(physics.thermalVariation(4, 4.8) - 0.8) < 1e-9);
  assert.equal(physics.thermalRate(0.8, 20), 0.04);
});
test("calcula calor didático Q=mcΔT", () =>
  assert.equal(physics.heatEnergy(5, 3500, 0.8), 14000));
test("calcula magnitude de aceleração", () =>
  assert.equal(physics.accelerationMagnitude(3, 4, 0), 5));
test("calcula potência e energia elétrica", () => {
  assert.equal(physics.electricPower(5, 0.4), 2);
  assert.equal(physics.electricEnergy(2, 3), 6);
});
test("endpoints de otimização e física respondem", async () => {
  const optimization = await fetch(
    `${base}/api/otimizacao/${transport.id}/calcular`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    },
  );
  assert.equal(optimization.status, 200);
  assert.ok((await optimization.json()).selectedRouteId);
  const analysis = await fetch(`${base}/api/fisica/${transport.id}`);
  assert.equal(analysis.status, 200);
  assert.equal((await analysis.json()).available, true);
});
const { evaluateDigitalAlert } = require("../src/services/digitalAlertLogic");
const { AlertNotifier } = require("../src/observers/alertNotifier");
const {
  WeightedRouteScoringStrategy,
} = require("../src/services/weightedRouteScoringStrategy");
test("lógica digital só aciona alerta com transporte ativo e condição crítica", () => {
  assert.equal(
    evaluateDigitalAlert({
      transportActive: true,
      temperatureCritical: false,
      impactCritical: false,
    }).alertOutput,
    false,
  );
  const output = evaluateDigitalAlert({
    transportActive: true,
    temperatureCritical: true,
    impactCritical: false,
  });
  assert.equal(output.alertOutput, true);
  assert.equal(output.ledOn, true);
  assert.equal(output.buzzerOn, true);
  const impactOutput = evaluateDigitalAlert({
    transportActive: true,
    temperatureCritical: false,
    impactCritical: true,
  });
  assert.equal(impactOutput.alertOutput, true);
  assert.equal(impactOutput.ledOn, true);
  assert.equal(impactOutput.buzzerOn, true);
  const normalImpact = evaluateDigitalAlert({
    transportActive: true,
    temperatureCritical: false,
    impactCritical: false,
  });
  assert.equal(normalImpact.alertOutput, false);
  assert.equal(normalImpact.ledOn, false);
  assert.equal(normalImpact.buzzerOn, false);
  assert.equal(
    evaluateDigitalAlert({
      transportActive: false,
      temperatureCritical: true,
      impactCritical: true,
    }).alertOutput,
    false,
  );
});
test("observer recebe a notificação de alerta", async () => {
  const notifier = new AlertNotifier();
  let received = null;
  notifier.subscribe({
    update: async (event) => {
      received = event;
    },
  });
  await notifier.notify({ type: "alertCreated" });
  assert.deepEqual(received, { type: "alertCreated" });
});
test("strategy ponderada calcula parcelas e score", () => {
  const result = new WeightedRouteScoringStrategy().calculate(
    { tempo: 0.5, risco: 0.2, distancia: 1, custo: 0 },
    { tempo: 0.4, risco: 0.3, distancia: 0.2, custo: 0.1 },
  );
  assert.deepEqual(result.partials, {
    tempo: 0.2,
    risco: 0.06,
    distancia: 0.2,
    custo: 0,
  });
  assert.ok(Math.abs(result.score - 0.46) < 1e-9);
});
test("calcula autonomia didática da bateria", () =>
  assert.equal(physics.batteryAutonomyHours(20, 50, 2), 5));
const simulation = require("../src/services/simulationService");
const executionPlan = require("../src/services/executionPlanService");
const organPlanning = require("../src/services/organPlanningService");
test("cenários de demonstração atualizam leituras, alertas e timeline", async () => {
  const demo = await repository.createTransporte({
    codigo_transporte: "CENARIOS-001",
    identificador_caixa: "BOX-CENARIOS",
    tipo_orgao: "Dado simulado",
    hospital_origem: "Origem fictícia",
    hospital_destino: "Destino fictício",
    latitude_origem: -23.561684,
    longitude_origem: -46.655981,
    latitude_destino: -23.551684,
    longitude_destino: -46.645981,
  });
  const postScenario = async (cenario) => {
    const response = await fetch(`${base}/api/simulacao/cenario`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cenario, transporteId: demo.id }),
    });
    assert.equal(response.status, 200);
    const current = await response.json();
    assert.equal(current.scenario, cenario);
    assert.equal(current.transporteId, demo.id);
  };
  try {
    const start = await fetch(`${base}/api/simulacao/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transporteId: demo.id, rotaId: "ROTA_B" }),
    });
    assert.equal(start.status, 200);
    await postScenario("temperatura");
    for (let i = 0; i < 6; i++) await simulation.tick();
    let readings = await repository.getLeituras(demo.id);
    assert.ok(readings.some((reading) => reading.temperatura > 10));
    assert.ok(
      (await repository.getAlertas(demo.id)).some(
        (alert) => alert.tipo === "TEMPERATURA",
      ),
    );
    assert.equal(simulation.status().digitalSignal.alertOutput, true);
    await postScenario("impacto");
    readings = await repository.getLeituras(demo.id);
    assert.ok(readings.some((reading) => reading.impacto >= 3.5));
    assert.ok(
      (await repository.getAlertas(demo.id)).some(
        (alert) => alert.tipo === "IMPACTO",
      ),
    );
    assert.deepEqual(simulation.status().digitalSignal, {
      transportActive: true,
      temperatureCritical: false,
      impactCritical: true,
      criticalCondition: true,
      alertOutput: true,
      ledOn: true,
      buzzerOn: true,
    });
    await postScenario("umidade");
    for (let i = 0; i < 5; i++) await simulation.tick();
    readings = await repository.getLeituras(demo.id);
    assert.ok(readings.some((reading) => reading.umidade > 85));
    assert.ok(
      (await repository.getAlertas(demo.id)).some(
        (alert) => alert.tipo === "UMIDADE",
      ),
    );
    await postScenario("bateria");
    for (let i = 0; i < 5; i++) await simulation.tick();
    readings = await repository.getLeituras(demo.id);
    assert.ok(readings.some((reading) => reading.bateria <= 10));
    assert.ok(
      (await repository.getAlertas(demo.id)).some(
        (alert) => alert.tipo === "BATERIA",
      ),
    );
    await postScenario("sinal");
    for (let i = 0; i < 6; i++) await simulation.tick();
    readings = await repository.getLeituras(demo.id);
    assert.ok(readings.some((reading) => reading.sinal === 0));
    assert.ok(readings.some((reading) => reading.sinal >= 80));
    assert.ok(
      (await repository.getAlertas(demo.id)).some(
        (alert) => alert.tipo === "SINAL",
      ),
    );
    assert.ok(
      (await repository.getEventos(demo.id)).some(
        (event) => event.tipo_evento === "COMUNICACAO_RESTABELECIDA",
      ),
    );
    await postScenario("atraso");
    readings = await repository.getLeituras(demo.id);
    assert.ok(readings[0].velocidade < 12);
    assert.ok(
      (await repository.getAlertas(demo.id)).some(
        (alert) => alert.tipo === "ATRASO",
      ),
    );
    assert.ok(
      (await repository.getEventos(demo.id)).some(
        (event) => event.tipo_evento === "ALERTA_ATRASO",
      ),
    );
    await postScenario("normal");
    readings = await repository.getLeituras(demo.id);
    assert.ok(readings[0].temperatura >= 2 && readings[0].temperatura <= 8);
    assert.ok(readings[0].umidade >= 45 && readings[0].umidade <= 70);
    assert.ok(readings[0].sinal > 30);
    assert.equal(simulation.status().digitalSignal.alertOutput, false);
    assert.ok(
      (await repository.getAlertas(demo.id)).every((alert) => alert.resolvido),
    );
  } finally {
    await simulation.stop();
  }
});
test("rota só é liberada após cálculo explícito", async () => {
  const demo = await repository.createTransporte({
    codigo_transporte: "ROTA-EXPLICITA-001",
    identificador_caixa: "BOX-ROTA",
    tipo_orgao: "Dado simulado",
    hospital_origem: "Origem fictícia",
    hospital_destino: "Destino fictício",
    latitude_origem: -23.561684,
    longitude_origem: -46.655981,
    latitude_destino: -23.551684,
    longitude_destino: -46.645981,
  });
  try {
    const candidates = await fetch(
      `${base}/api/otimizacao/candidatas/${demo.id}`,
    );
    const candidateData = await candidates.json();
    assert.ok(
      candidateData.routes.every((route) => route.selecionada === undefined),
    );
    await assert.rejects(
      () => simulation.start(demo.id),
      (error) => error.status === 409,
    );
    const calculated = await fetch(
      `${base}/api/otimizacao/${demo.id}/calcular`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      },
    );
    const decision = await calculated.json();
    assert.ok(decision.selectedRouteId);
    const started = await fetch(`${base}/api/simulacao/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transporteId: demo.id,
        rotaId: decision.selectedRouteId,
      }),
    });
    assert.equal(started.status, 200);
  } finally {
    await simulation.stop();
  }
});
test("reinício invalida rota e gera novas condições operacionais", async () => {
  const demo = await repository.createTransporte({
    codigo_transporte: "REINICIO-ROTA-001",
    identificador_caixa: "BOX-REINICIO",
    tipo_orgao: "Dado simulado",
    hospital_origem: "Origem fictícia",
    hospital_destino: "Destino fictício",
    latitude_origem: -23.561684,
    longitude_origem: -46.655981,
    latitude_destino: -23.551684,
    longitude_destino: -46.645981,
  });
  try {
    const before = await (
      await fetch(`${base}/api/otimizacao/candidatas/${demo.id}`)
    ).json();
    const decision = await (
      await fetch(`${base}/api/otimizacao/${demo.id}/calcular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      })
    ).json();
    await fetch(`${base}/api/simulacao/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transporteId: demo.id,
        rotaId: decision.selectedRouteId,
      }),
    });
    const reset = await (
      await fetch(`${base}/api/simulacao/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transporteId: demo.id }),
      })
    ).json();
    assert.equal(reset.routeId, null);
    assert.equal(reset.progress, 0);
    assert.equal(reset.digitalSignal.alertOutput, false);
    assert.deepEqual(reset.initialTelemetry, {
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
    assert.equal((await repository.getTransporte(demo.id)).status, "PREPARADO");
    const after = await (
      await fetch(`${base}/api/otimizacao/candidatas/${demo.id}`)
    ).json();
    assert.notEqual(after.seed, before.seed);
    assert.notDeepEqual(after.routes, before.routes);
    await assert.rejects(
      () => simulation.start(demo.id),
      (error) => error.status === 409,
    );
    const recalculated = await (
      await fetch(`${base}/api/otimizacao/${demo.id}/calcular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      })
    ).json();
    const started = await simulation.start(
      demo.id,
      recalculated.selectedRouteId,
    );
    assert.equal(started.routeId, recalculated.selectedRouteId);
  } finally {
    await simulation.stop();
  }
});
test("condições operacionais determinísticas permitem vencedoras diferentes", () => {
  const a = routeOptimization.generateOperationalRoutes(0),
    b = routeOptimization.generateOperationalRoutes(1),
    c = routeOptimization.generateOperationalRoutes(2);
  assert.deepEqual(routeOptimization.generateOperationalRoutes(2), c);
  assert.equal(
    routeOptimization.evaluateRoutes(a.routes).selectedRouteId,
    "ROTA_A",
  );
  assert.equal(
    routeOptimization.evaluateRoutes(b.routes).selectedRouteId,
    "ROTA_B",
  );
  assert.equal(
    routeOptimization.evaluateRoutes(c.routes).selectedRouteId,
    "ROTA_C",
  );
});
test("análise física acompanha telemetria, consumo e picos da execução", async () => {
  const demo = await repository.createTransporte({
    codigo_transporte: "FISICA-DINAMICA-001",
    identificador_caixa: "BOX-FISICA",
    tipo_orgao: "Dado simulado",
    hospital_origem: "Origem fictícia",
    hospital_destino: "Destino fictício",
    latitude_origem: -23.561684,
    longitude_origem: -46.655981,
    latitude_destino: -23.551684,
    longitude_destino: -46.645981,
  });
  await transportService.start(demo.id);
  const baseTime = Date.now() + 1000;
  const reading = (minutes, overrides = {}) =>
    repository.createLeitura({
      transporteId: demo.id,
      deviceId: "LIFEBOX-001",
      temperatura: 5,
      umidade: 58,
      aceleracao: 0.2,
      aceleracaoX: 0.2,
      aceleracaoY: 0,
      aceleracaoZ: 1,
      impacto: 0.1,
      latitude: -23.56,
      longitude: -46.65,
      velocidade: 35,
      bateria: 100,
      sinal: 90,
      timestamp: new Date(baseTime + minutes * 60000).toISOString(),
      ...overrides,
    });
  await reading(0);
  await reading(10, { temperatura: 11, bateria: 50 });
  const thermal = await physics.analyze(demo.id);
  assert.equal(thermal.thermal.deltaT, 6);
  assert.equal(thermal.thermal.rateCPerMinute, 0.6);
  assert.equal(thermal.thermal.heatJoules, 105000);
  assert.ok(thermal.electrical.energyWh > 0);
  assert.equal(thermal.electrical.remainingEnergyWh, 10);
  const criticalAutonomy = thermal.electrical.estimatedAutonomyHours;
  assert.ok(
    thermal.electrical.current >
      physics.estimatedCurrent({ temperatura: 5, impacto: 0.1, sinal: 90 }),
  );
  await reading(20, {
    temperatura: 5,
    impacto: 4.2,
    aceleracao: 4.8,
    aceleracaoX: 4.8,
    aceleracaoY: 0.3,
    aceleracaoZ: 1,
    bateria: 40,
  });
  const impact = await physics.analyze(demo.id);
  assert.ok(impact.acceleration.resultant > 4.8);
  assert.ok(impact.acceleration.peak >= impact.acceleration.resultant);
  assert.equal(impact.electrical.remainingEnergyWh, 8);
  assert.ok(impact.electrical.estimatedAutonomyHours < criticalAutonomy);
  assert.ok(impact.electrical.energyWh > thermal.electrical.energyWh);
});
test("dashboard não mantém renderização da PO antiga com seletores removidos", () => {
  const dashboard = fs.readFileSync(
    require.resolve("../public/js/dashboard.js"),
    "utf8",
  );
  assert.equal(dashboard.includes("renderOptimization"), false);
  assert.equal(dashboard.includes("optimization-weights"), false);
  assert.equal(dashboard.includes("route-table"), false);
});
test("apresentação do tempo evita formato ambíguo e mantém isquemia compacta", () => {
  const dashboard = fs.readFileSync(
      require.resolve("../public/js/dashboard.js"),
      "utf8",
    ),
    styles = fs.readFileSync(
      require.resolve("../public/css/styles.css"),
      "utf8",
    );
  assert.match(dashboard, /hours.*padStart\(2, ["']0["']\).*min/s);
  assert.ok(dashboard.includes("`${rest} min`"));
  assert.ok(dashboard.includes("`${ischemia} / ${maximum} min`"));
  assert.match(
    styles,
    /grid-template-columns:\s*repeat\(7,\s*minmax\(0,\s*1fr\)\)/,
  );
  assert.match(styles, /white-space:\s*nowrap/);
});
test("reotimização traduz códigos internos para texto legível", () => {
  const planningUi = fs.readFileSync(
    require.resolve("../public/js/planning.js"),
    "utf8",
  );
  assert.match(planningUi, /delay40:\s*["']Atraso logístico de 40 min["']/);
  assert.match(
    planningUi,
    /consumed30:\s*["']Acréscimo de 30 min no tempo de isquemia["']/,
  );
  assert.ok(
    planningUi.includes("Motivo da reotimização: ${reasonLabel(reason)}"),
  );
});
test("condições logísticas informam plano mantido e atualizam o mapa aplicado", () => {
  const planningUi = fs.readFileSync(
    require.resolve("../public/js/planning.js"),
    "utf8",
  );
  assert.ok(planningUi.includes('"PLAN_UNCHANGED"'));
  assert.ok(planningUi.includes("CONDIÇÃO LOGÍSTICA CONSIDERADA"));
  assert.ok(planningUi.includes("Novo plano aplicado. Deslocamento retomado."));
  assert.ok(planningUi.includes("reoptimization-comparison"));
  assert.ok(planningUi.includes("render(recommendation.result)"));
  assert.ok(planningUi.includes("lifeBoxSnapExecutionTracking"));
  assert.ok(planningUi.includes("Reinicie o transporte antes de trocar"));
  assert.ok(
    planningUi.includes("{ GROUND: false, HELICOPTER: true, AIRPLANE: true }"),
  );
});
test("endpoint aplica recomendação revalidada sem reiniciar execução", async () => {
  const demo = await repository.createTransporte({
    codigo_transporte: "REOPT-001",
    identificador_caixa: "BOX-REOPT",
    tipo_orgao: "Dado simulado",
    hospital_origem: "Origem",
    hospital_destino: "Destino",
    latitude_origem: -23.55,
    longitude_origem: -46.63,
    latitude_destino: -21.17,
    longitude_destino: -47.8,
  });
  const first = await organPlanning.calculate({
    organCode: "HEART",
    consumedMinutes: 45,
    origin: { name: "Origem", latitude: -23.55, longitude: -46.63 },
    destination: { name: "Destino", latitude: -21.17, longitude: -47.8 },
  });
  try {
    await simulation.start(demo.id, "LOGISTICS_PLAN", first.selected, first);
    await simulation.stop();
    assert.equal(simulation.status().running, false);
    await simulation.resume(demo.id);
    assert.equal(simulation.status().running, true);
    executionPlan.advance(demo.id, 4);
    const before = executionPlan.get(demo.id);
    const recommendation = await simulation.recommendReoptimization(
      demo.id,
      "Acesso alterado",
      {
        originHasHelipad: true,
        groundAccessOriginAvailable: false,
        infrastructureAvailability: {
          AIRPORT_ORIGIN: true,
          AIRPORT_DESTINATION: true,
          HELIPORT_ORIGIN: true,
          HELIPORT_DESTINATION: true,
        },
      },
    );
    assert.equal(simulation.status().running, false);
    assert.deepEqual(
      simulation.status().logistics.currentPosition,
      before.currentPosition,
    );
    const response = await fetch(`${base}/api/simulacao/reotimizar/aplicar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transporteId: demo.id,
        recommendationId: recommendation.recommendationId,
        plan: { id: "MANIPULADO" },
        result: { selected: { id: "MANIPULADO" } },
      }),
    });
    assert.equal(response.status, 200);
    const applied = await response.json();
    assert.notEqual(applied.logistics.planId, "MANIPULADO");
    assert.equal(applied.running, true);
    assert.equal(
      applied.logistics.transportElapsedMinutes,
      before.transportElapsedMinutes,
    );
    assert.deepEqual(applied.logistics.currentPosition, before.currentPosition);
    assert.ok(
      (await repository.getEventos(demo.id)).some(
        (event) => event.tipo_evento === "REOTIMIZACAO_APLICADA",
      ),
    );
  } finally {
    await simulation.stop();
  }
});
test("resumo final considera apenas a execução atual e usa tempo simulado", async () => {
  const demo = await repository.createTransporte({
    codigo_transporte: "RESUMO-EXEC-001",
    identificador_caixa: "BOX-RESUMO",
    tipo_orgao: "Dado simulado",
    hospital_origem: "Hospital A",
    hospital_destino: "Hospital B",
    latitude_origem: -23.5,
    longitude_origem: -46.6,
    latitude_destino: -21.2,
    longitude_destino: -47.8,
  });
  const first = await transportService.start(demo.id);
  const base = Date.now();
  for (const [index, temperatura] of [4, 5, 11].entries())
    await repository.createLeitura({
      ...payload({
        transporteId: demo.id,
        temperatura,
        umidade: 60 - index,
        bateria: 90 - index * 5,
        timestamp: new Date(base + index * 1000).toISOString(),
      }),
      executionId: first.execucao_atual_id,
    });
  await repository.createAlerta({
    transporteId: demo.id,
    executionId: first.execucao_atual_id,
    tipo: "IMPACTO",
    severidade: "CRITICO",
    mensagem: "Impacto crítico",
    valor: 4,
  });
  await repository.createAlerta({
    transporteId: demo.id,
    executionId: first.execucao_atual_id,
    tipo: "TEMPERATURA",
    severidade: "CRITICO",
    mensagem: "Temperatura crítica",
    valor: 11,
  });
  const snapshot = {
    transportElapsedMinutes: 37,
    initialConsumedMinutes: 120,
    ischemiaTotalMinutes: 157,
    remainingMarginMinutes: 83,
    maximumIschemiaMinutes: 240,
    planId: "PLAN_TEST",
    planName: "Plano de teste",
    modal: "TERRESTRE",
    totalDistanceKm: 100,
    traveledKm: 100,
    remainingKm: 0,
    origin: { name: "Hospital A" },
    destination: { name: "Hospital B" },
  };
  await transportService.finish(demo.id, snapshot);
  const firstSummary = await transportService.summary(demo.id);
  assert.equal(firstSummary.duracao_minutos, 37);
  assert.equal(firstSummary.total_leituras, 3);
  assert.equal(firstSummary.impactos_criticos, 1);
  assert.equal(firstSummary.numero_alertas, 2);
  assert.equal(firstSummary.isquemia_final_minutos, 157);
  assert.equal(firstSummary.bateria_final, 80);
  assert.ok(Number.isFinite(firstSummary.impacto_medio));
  assert.ok(Number.isFinite(firstSummary.impacto_max));
  assert.ok(Number.isFinite(firstSummary.sinal_medio));
  const second = await transportService.start(demo.id);
  await repository.createLeitura({
    ...payload({
      transporteId: demo.id,
      temperatura: 4,
      umidade: 58,
      bateria: 99,
      timestamp: new Date(base + 5000).toISOString(),
    }),
    executionId: second.execucao_atual_id,
  });
  await transportService.finish(demo.id, {
    ...snapshot,
    transportElapsedMinutes: 2,
    ischemiaTotalMinutes: 122,
    remainingMarginMinutes: 118,
  });
  const secondSummary = await transportService.summary(demo.id);
  assert.equal(secondSummary.duracao_minutos, 2);
  assert.equal(secondSummary.total_leituras, 1);
  assert.equal(secondSummary.impactos_criticos, 0);
  assert.equal(secondSummary.numero_alertas, 0);
  assert.equal(secondSummary.bateria_final, 99);
});

test("finalização manual preserva o tempo simulado já transcorrido", () => {
  const result = {
    origin: { name: "A", latitude: 0, longitude: 0 },
    destination: { name: "B", latitude: 0, longitude: 1 },
    consumedMinutes: 120,
    profile: {
      ischemia: { officialMaxMinutes: 240, operationalSafetyMarginMinutes: 30 },
    },
  };
  const plan = {
    id: "MANUAL",
    name: "Manual",
    modal: "TERRESTRE",
    segments: [
      {
        from: "A",
        to: "B",
        modal: "TERRESTRE",
        distanceKm: 60,
        timeMin: 60,
        origin: result.origin,
        destination: result.destination,
      },
    ],
  };
  executionPlan.freeze(991, plan, result);
  executionPlan.advance(991, 30);
  const before = executionPlan.get(991);
  const final = executionPlan.finish(991);
  assert.equal(final.transportElapsedMinutes, before.transportElapsedMinutes);
  assert.equal(final.ischemiaTotalMinutes, before.ischemiaTotalMinutes);
  executionPlan.reset(991);
});
test("QA expõe a última execução real de npm test", async () => {
  const response = await fetch(`${base}/api/qualidade`);
  const status = await response.json();
  assert.equal(response.status, 200);
  assert.ok(["PENDENTE", "APROVADA", "REPROVADA"].includes(status.status));
  if (status.status === "APROVADA") assert.ok(status.passed >= 70);
});
test("física da execução usa relógio simulado e faixa do órgão ativo", async () => {
  const demo = await repository.createTransporte({
    codigo_transporte: "FISICA-EXEC-001",
    identificador_caixa: "BOX-FISICA-EXEC",
    tipo_orgao: "Dado simulado",
    hospital_origem: "Origem",
    hospital_destino: "Destino",
    latitude_origem: 0,
    longitude_origem: 0,
    latitude_destino: 0,
    longitude_destino: 1,
  });
  const planResult = {
    origin: { name: "Origem", latitude: 0, longitude: 0 },
    destination: { name: "Destino", latitude: 0, longitude: 1 },
    consumedMinutes: 20,
    profile: {
      code: "HEART",
      name: "Coração",
      ischemia: { officialMaxMinutes: 240, operationalSafetyMarginMinutes: 30 },
      preservation: { referenceRangeC: [4, 8] },
    },
  };
  const plan = {
    id: "FISICA-EXEC",
    name: "Plano teste",
    modal: "TERRESTRE",
    segments: [
      {
        from: "Origem",
        to: "Destino",
        modal: "TERRESTRE",
        distanceKm: 10,
        timeMin: 60,
        origin: planResult.origin,
        destination: planResult.destination,
      },
    ],
  };
  executionPlan.freeze(demo.id, plan, planResult);
  executionPlan.advance(demo.id, 2);
  const active = executionPlan.get(demo.id);
  const started = await transportService.start(demo.id);
  await repository.createLeitura({
    ...payload({ transporteId: demo.id, temperatura: 4, bateria: 90 }),
    executionId: started.execucao_atual_id,
  });
  await repository.createLeitura({
    ...payload({ transporteId: demo.id, temperatura: 9, bateria: 80 }),
    executionId: started.execucao_atual_id,
  });
  const analysis = await physics.analyze(demo.id);
  assert.equal(analysis.thermal.elapsedMinutes, active.transportElapsedMinutes);
  assert.equal(analysis.thermal.status, "FORA DA FAIXA");
  assert.deepEqual(analysis.organ.referenceRangeC, [4, 8]);
  executionPlan.reset(demo.id);
});

test("painéis técnicos possuem seletores presentes no dashboard", () => {
  const html = fs.readFileSync(require.resolve("../public/index.html"), "utf8"),
    dashboard = fs.readFileSync(
      require.resolve("../public/js/dashboard.js"),
      "utf8",
    );
  for (const id of [
    "digital-transport-active",
    "digital-temperature-critical",
    "digital-impact-critical",
    "digital-alert-output",
    "physics-grid",
    "qa-test-count",
    "qa-last-validation",
  ])
    assert.ok(html.includes(`id="${id}"`));
  for (const selector of [
    "#digital-transport-active",
    "#digital-temperature-critical",
    "#digital-impact-critical",
    "#digital-alert-output",
    "#qa-test-count",
    "#qa-last-validation",
  ])
    assert.ok(dashboard.includes(selector));
});
test("rastreamento visual percorre a geometria sem duplicar a linha", () => {
  const dashboard = fs.readFileSync(
    require.resolve("../public/js/dashboard.js"),
    "utf8",
  );
  assert.ok(dashboard.includes("function animateTrackingMarker"));
  assert.ok(dashboard.includes("function pointAlongRoute"));
  assert.ok(dashboard.includes("requestAnimationFrame(frame)"));
  assert.ok(dashboard.includes("const animationRoute"));
  assert.ok(dashboard.includes("opacity: 0"));
  assert.ok(dashboard.includes("layers.path?.setLatLngs([])"));
  assert.ok(dashboard.includes('className: "airport-code-tooltip"'));
  assert.ok(dashboard.includes("permanent: false"));
  assert.ok(dashboard.includes('segment.modal === "OPERACIONAL"'));
  assert.ok(dashboard.includes("L.divIcon"));
  assert.ok(dashboard.includes('viewBox="0 0 24 34"'));
  assert.ok(dashboard.includes("function createFacilityMarker"));
  assert.ok(!dashboard.includes('"Aeroporto" : "Infraestrutura"'));
});
test("seletores da PO abrem a lista sem mover a página", () => {
  const planning = fs.readFileSync(
    require.resolve("../public/js/planning.js"),
    "utf8",
  );
  assert.ok(planning.includes("function enhanceLocationSelect"));
  assert.ok(planning.includes('menu.setAttribute("role", "listbox")'));
  assert.ok(!planning.includes('wrapper.scrollIntoView({ block: "start" })'));
  assert.ok(planning.includes("menu.scrollTop = Math.max"));
  assert.ok(planning.includes("preventScroll: true"));
  assert.ok(planning.includes('new Event("change", { bubbles: true })'));
  assert.ok(
    planning.includes('enhanceLocationSelect($("#planning-scenario"))'),
  );
  assert.ok(planning.includes('enhanceLocationSelect($("#planning-organ"))'));
  assert.ok(!planning.includes("science-caveat"));
});

const {
  generate,
  normalTemperature,
  criticalTemperature,
} = require("../simulator/sensor-generator");
const { getOrganProfile } = require("../src/config/organProfiles");
test("cenário normal respeita a faixa de cada perfil de órgão sem alerta térmico", () => {
  for (const code of [
    "HEART",
    "LUNG",
    "KIDNEY",
    "LIVER",
    "PANCREAS",
    "INTESTINE",
  ]) {
    const profile = getOrganProfile(code),
      [min, max] = profile.preservation.referenceRangeC;
    for (let index = 0; index < 30; index++) {
      const temperature = normalTemperature(profile);
      assert.ok(
        temperature >= min && temperature <= max,
        `${code} fora da faixa`,
      );
      assert.equal(
        evaluate(
          { ...payload({ temperatura: temperature }), cenario: "normal" },
          profile,
        ).some((issue) => issue.tipo === "TEMPERATURA"),
        false,
      );
    }
  }
});
test("cenário de temperatura crítica fica fora da faixa do órgão ativo", () => {
  for (const code of [
    "HEART",
    "LUNG",
    "KIDNEY",
    "LIVER",
    "PANCREAS",
    "INTESTINE",
  ]) {
    const profile = getOrganProfile(code),
      [min, max] = profile.preservation.referenceRangeC,
      temperature = criticalTemperature(profile, 1);
    assert.ok(temperature < min || temperature > max);
    assert.ok(
      evaluate(
        { ...payload({ temperatura: temperature }), cenario: "temperatura" },
        profile,
      ).some(
        (issue) =>
          issue.tipo === "TEMPERATURA" && issue.severidade === "CRITICO",
      ),
    );
  }
});
test("gerador normal recebe o perfil ativo da execução", () => {
  const profile = getOrganProfile("KIDNEY"),
    state = {
      tick: 0,
      scenarioTick: 0,
      scenario: "normal",
      progress: 0,
      battery: 100,
      transporteId: 1,
      executionId: "test",
      logistics: {
        totalProgress: 0,
        organProfile: profile,
        currentPosition: { latitude: 0, longitude: 0 },
      },
    };
  const reading = generate(state);
  assert.ok(reading.temperatura >= 0 && reading.temperatura <= 4);
  assert.equal(
    evaluate(reading, profile).some((issue) => issue.tipo === "TEMPERATURA"),
    false,
  );
});
