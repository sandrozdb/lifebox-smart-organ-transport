const test = require("node:test");
const assert = require("node:assert/strict");
const { strategies } = require("../src/services/modalPlannerStrategies");
const {
  FallbackLocationProvider,
} = require("../src/services/locationProvider");
const { baseConditions } = require("../src/services/organPlanningService");

const origin = { name: "São Paulo", latitude: -23.5505, longitude: -46.6333 };
const destination = {
  name: "Campinas",
  latitude: -22.9056,
  longitude: -47.0608,
};

test("todas as Strategies atendem ao contrato de planejamento modal", async () => {
  const locationProvider = new FallbackLocationProvider();
  for (const strategy of strategies()) {
    const raw = await strategy.plan({
      origin,
      destination,
      locationProvider,
      conditions: JSON.parse(JSON.stringify(baseConditions)),
    });
    const plans = Array.isArray(raw) ? raw : [raw];
    assert.ok(
      plans.length > 0,
      `${strategy.constructor.name} deve produzir alternativa`,
    );
    for (const plan of plans) {
      assert.equal(typeof plan.id, "string");
      assert.equal(typeof plan.name, "string");
      assert.equal(typeof plan.modal, "string");
      assert.equal(typeof plan.modalCode, "string");
      assert.ok(Array.isArray(plan.segments) && plan.segments.length > 0);
      assert.ok(Array.isArray(plan.requiredInfrastructure));
      for (const segment of plan.segments) {
        assert.equal(typeof segment.modal, "string");
        for (const field of ["distanceKm", "timeMin", "cost"])
          assert.ok(Number.isFinite(segment[field]));
      }
    }
  }
});
