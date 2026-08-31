const assert = require("node:assert/strict");
const { test } = require("node:test");

process.env.DB_DRIVER = "memory";
process.env.IOT_DEVICE_ID = "LIFEBOX-WOKWI-001";
process.env.IOT_TRANSPORT_ID = "2";

const repository = require("../src/repositories");
const telemetry = require("../src/services/telemetryService");
const transportService = require("../src/services/transportService");
const iotState = require("../src/services/iotStateService");

const transportData = (code) => ({
  codigo_transporte: code,
  identificador_caixa: `BOX-${code}`,
  tipo_orgao: "Rim",
  hospital_origem: "Hospital Origem",
  hospital_destino: "Hospital Destino",
  latitude_origem: -23.5505,
  longitude_origem: -46.6333,
  latitude_destino: -22.9056,
  longitude_destino: -47.0608,
});

test("telemetria IoT é vinculada à execução ativa pelo backend", async () => {
  repository.reset();
  iotState.reset();

  await repository.createTransporte(transportData("T-001"));
  const transport = await repository.createTransporte(transportData("T-002"));
  const started = await transportService.start(transport.id, "exec-iot-active");

  const result = await telemetry.receive({
    transporteId: transport.id,
    executionId: "exec-cliente-nao-confiavel",
    deviceId: "LIFEBOX-WOKWI-001",
    temperatura: 4,
    umidade: 58,
    aceleracao: 1,
    aceleracaoX: 0,
    aceleracaoY: 0,
    aceleracaoZ: 1,
    impacto: 0,
    latitude: -23.5505,
    longitude: -46.6333,
    velocidade: 40,
    bateria: 100,
    sinal: 80,
    timestamp: "2026-08-31T06:00:00Z",
  });

  assert.equal(result.reading.execucao_id, started.execucao_atual_id);

  const currentExecutionReadings = await repository.getLeituras(
    transport.id,
    10,
    started.execucao_atual_id,
  );
  assert.equal(currentExecutionReadings.length, 1);
  assert.equal(currentExecutionReadings[0].temperatura, 4);

  const spoofedExecutionReadings = await repository.getLeituras(
    transport.id,
    10,
    "exec-cliente-nao-confiavel",
  );
  assert.equal(spoofedExecutionReadings.length, 0);
});
