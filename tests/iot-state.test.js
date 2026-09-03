const assert = require("node:assert/strict");
const { after, before, beforeEach, test } = require("node:test");

process.env.DB_DRIVER = "memory";
process.env.IOT_DEVICE_ID = "LIFEBOX-WOKWI-001";
process.env.IOT_TRANSPORT_ID = "2";
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
  assert.equal(state.deviceId, null);
  assert.equal(state.transportId, 2);
});

test("backend informa o transporte associado ao dispositivo", async () => {
  const response = await fetch(
    `${baseUrl}/api/iot/status?deviceId=LIFEBOX-WOKWI-001`,
  );
  const state = await response.json();
  assert.equal(state.transportId, 2);
});

test("backend não associa dispositivo diferente do configurado", async () => {
  const response = await fetch(
    `${baseUrl}/api/iot/status?deviceId=OUTRO-DISPOSITIVO`,
  );
  const state = await response.json();
  assert.equal(state.transportId, null);
});

test("backend rejeita transporte diferente da associação do dispositivo", async () => {
  const response = await fetch(`${baseUrl}/api/telemetria`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transporteId: 1,
      deviceId: "LIFEBOX-WOKWI-001",
      temperatura: 4,
      umidade: 60,
      aceleracao: 1,
      impacto: 0,
      latitude: -23.55,
      longitude: -46.63,
      velocidade: 20,
      bateria: 80,
      sinal: 90,
    }),
  });
  assert.equal(response.status, 409);
  assert.equal((await response.json()).code, "IOT_TRANSPORT_MISMATCH");
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
  assert.equal(state.online, false);
  assert.equal(state.deviceId, null);
  assert.equal(state.lastReading, null);
  assert.equal(state.transportId, 2);
  assert.equal(state.digitalSignal.alertOutput, false);
});

test("telemetria atualiza presença, leitura e sinal calculado pelo backend", () => {
  const reading = { id: 42, temperatura: 4.1, impacto: 0.08 };
  const state = iotState.recordTelemetry(
    "LIFEBOX-WOKWI-001",
    2,
    { alertOutput: true, ledOn: true, buzzerOn: true },
    reading,
  );
  assert.equal(state.online, true);
  assert.equal(state.deviceId, "LIFEBOX-WOKWI-001");
  assert.equal(state.transportId, 2);
  assert.deepEqual(state.lastReading, reading);
  assert.equal(state.digitalSignal.ledOn, true);
  assert.equal(state.digitalSignal.buzzerOn, true);
});
