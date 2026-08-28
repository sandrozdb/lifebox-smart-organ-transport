const test = require("node:test");
const assert = require("node:assert/strict");

if (process.env.RUN_MYSQL_INTEGRATION !== "true") {
  test(
    "integração MySQL requer RUN_MYSQL_INTEGRATION=true",
    { skip: true },
    () => {},
  );
} else {
  process.env.DB_DRIVER = "mysql";
  const repository = require("../src/repositories");
  const database = require("../src/database/mysql");

  test.after(async () => database.close());

  test("MySQL insere transporte e isola telemetria por execução", async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const transport = await repository.createTransporte({
      codigo_transporte: `CI-${suffix}`,
      identificador_caixa: `BOX-${suffix}`,
      tipo_orgao: "Coração",
      hospital_origem: "Origem CI",
      hospital_destino: "Destino CI",
      latitude_origem: -23.55,
      longitude_origem: -46.63,
      latitude_destino: -22.9,
      longitude_destino: -47.06,
    });
    assert.ok(transport.id);
    await repository.createLeitura({
      transporteId: transport.id,
      executionId: "EXEC-A",
      deviceId: "CI",
      temperatura: 4,
      umidade: 55,
      aceleracao: 1,
      impacto: 0.1,
      latitude: -23.55,
      longitude: -46.63,
      velocidade: 20,
      bateria: 90,
      sinal: 95,
    });
    await repository.createLeitura({
      transporteId: transport.id,
      executionId: "EXEC-B",
      deviceId: "CI",
      temperatura: 5,
      umidade: 56,
      aceleracao: 1,
      impacto: 0.2,
      latitude: -23.54,
      longitude: -46.62,
      velocidade: 21,
      bateria: 89,
      sinal: 94,
    });
    const executionA = await repository.getLeituras(
      transport.id,
      100,
      "EXEC-A",
    );
    assert.equal(executionA.length, 1);
    assert.equal(executionA[0].execucao_id, "EXEC-A");
  });
}
