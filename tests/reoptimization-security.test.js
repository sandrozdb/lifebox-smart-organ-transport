const test = require("node:test");
const assert = require("node:assert/strict");

process.env.DB_DRIVER = "memory";
const repository = require("../src/repositories");
const planning = require("../src/services/organPlanningService");
const simulation = require("../src/services/simulationService");
const executionPlan = require("../src/services/executionPlanService");
const changedAccess = {
  originHasHelipad: true,
  groundAccessOriginAvailable: false,
  infrastructureAvailability: {
    AIRPORT_ORIGIN: true,
    AIRPORT_DESTINATION: true,
    HELIPORT_ORIGIN: true,
    HELIPORT_DESTINATION: true,
  },
};

async function activeTransport(suffix) {
  const transport = await repository.createTransporte({
    codigo_transporte: `SEC-${suffix}`,
    identificador_caixa: `BOX-${suffix}`,
    tipo_orgao: "Coração",
    hospital_origem: "São Paulo",
    hospital_destino: "Brasília",
    latitude_origem: -23.5505,
    longitude_origem: -46.6333,
    latitude_destino: -15.7939,
    longitude_destino: -47.8828,
  });
  const result = await planning.calculate({
    organCode: "HEART",
    consumedMinutes: 0,
    origin: { name: "São Paulo", latitude: -23.5505, longitude: -46.6333 },
    destination: { name: "Brasília", latitude: -15.7939, longitude: -47.8828 },
  });
  await simulation.start(
    transport.id,
    "LOGISTICS_PLAN",
    result.selected,
    result,
  );
  return transport;
}

test("recomendação inválida e ausente são rejeitadas", async () => {
  const transport = await activeTransport("INVALID");
  try {
    await assert.rejects(
      () => simulation.applyReoptimization(transport.id, "inexistente"),
      (error) =>
        error.status === 404 && error.code === "RECOMMENDATION_NOT_FOUND",
    );
  } finally {
    await simulation.reset(transport.id);
  }
});

test("recommendationId pertence ao transporte e execução corretos", async () => {
  const transport = await activeTransport("OWNER");
  try {
    const recommendation = await simulation.recommendReoptimization(
      transport.id,
      "Acesso terrestre indisponível",
      changedAccess,
    );
    await assert.rejects(
      () =>
        simulation.applyReoptimization(
          transport.id + 1,
          recommendation.recommendationId,
        ),
      (error) => [404, 409].includes(error.status),
    );
  } finally {
    await simulation.reset(transport.id);
  }
});

test("recomendação não pode ser aplicada duas vezes", async () => {
  const transport = await activeTransport("REPLAY");
  try {
    const recommendation = await simulation.recommendReoptimization(
      transport.id,
      "Acesso terrestre indisponível",
      changedAccess,
    );
    await simulation.applyReoptimization(
      transport.id,
      recommendation.recommendationId,
    );
    await assert.rejects(
      () =>
        simulation.applyReoptimization(
          transport.id,
          recommendation.recommendationId,
        ),
      (error) => error.status === 409,
    );
  } finally {
    await simulation.reset(transport.id);
  }
});

test("recomendação expirada é rejeitada", async () => {
  const transport = await activeTransport("STALE");
  try {
    const recommendation = await simulation.recommendReoptimization(
      transport.id,
      "Acesso terrestre indisponível",
      changedAccess,
    );
    simulation._recommendations.get(recommendation.recommendationId).createdAt =
      0;
    await assert.rejects(
      () =>
        simulation.applyReoptimization(
          transport.id,
          recommendation.recommendationId,
        ),
      (error) => error.status === 409 && error.code === "RECOMMENDATION_STALE",
    );
  } finally {
    await simulation.reset(transport.id);
  }
});

test("reinício remove plano e recomendações mantidos em memória", async () => {
  const transport = await activeTransport("RESTART");
  const recommendation = await simulation.recommendReoptimization(
    transport.id,
    "Acesso terrestre indisponível",
    changedAccess,
  );
  assert.ok(executionPlan.get(transport.id));
  assert.ok(simulation._recommendations.has(recommendation.recommendationId));
  await simulation.reset(transport.id);
  assert.equal(executionPlan.get(transport.id), null);
  assert.equal(simulation._recommendations.size, 0);
});
