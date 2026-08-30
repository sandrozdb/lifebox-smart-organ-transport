const assert = require("node:assert/strict");
const { after, before, beforeEach, test } = require("node:test");

process.env.DB_DRIVER = "memory";
const app = require("../src/app");
const iotState = require("../src/services/iotStateService");

let server;
let baseUrl;

before(() => {
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());
beforeEach(() => iotState.reset());

test("estado IoT inicia seguro e sem telemetria artificial", async () => {
  const response = await fetch(`${baseUrl}/api/iot/status`);
  const state = await response.json();
  assert.equal(state.mode, "IOT");
  assert.equal(state.scenario, "normal");
  assert.equal(state.online, false);
  assert.equal(state.lastReading, null);
  assert.equal(state.digitalSignal.alertOutput, false);
});

test("dashboard alterna para demonstração e volta ao IoT", async () => {
  const demo = await fetch(`${baseUrl}/api/iot/mode`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "DEMO" }),
  });
  assert.equal(demo.status, 200);
  assert.equal((await demo.json()).telemetry, "DEMO");

  const iot = await fetch(`${baseUrl}/api/iot/mode`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "IOT" }),
  });
  const state = await iot.json();
  assert.equal(state.mode, "IOT");
  assert.equal(state.scenario, "normal");
  assert.equal(state.digitalSignal.alertOutput, false);
});

test("telemetria atualiza presença, leitura e sinal calculado pelo backend", () => {
  const reading = { id: 42, temperatura: 4.1, impacto: 0.08 };
  const state = iotState.recordTelemetry(
    "LIFEBOX-WOKWI-001",
    { alertOutput: true, ledOn: true, buzzerOn: true },
    reading,
  );
  assert.equal(state.online, true);
  assert.equal(state.deviceId, "LIFEBOX-WOKWI-001");
  assert.deepEqual(state.lastReading, reading);
  assert.equal(state.digitalSignal.ledOn, true);
  assert.equal(state.digitalSignal.buzzerOn, true);
});
