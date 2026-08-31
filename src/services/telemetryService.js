const repository = require("../repositories");
const config = require("../config");
const { evaluate } = require("./ruleEngine");
const { evaluateDigitalAlert } = require("./digitalAlertLogic");
const { AlertNotifier } = require("../observers/alertNotifier");
const { TimelineAlertObserver } = require("../observers/timelineAlertObserver");
const iotState = require("./iotStateService");
const alertNotifier = new AlertNotifier();
alertNotifier.subscribe(new TimelineAlertObserver(repository));
function validate(payload) {
  const numeric = [
    "transporteId",
    "temperatura",
    "umidade",
    "aceleracao",
    "impacto",
    "latitude",
    "longitude",
    "velocidade",
    "bateria",
    "sinal",
  ];
  for (const field of numeric)
    if (!Number.isFinite(Number(payload[field])))
      throw Object.assign(new Error(`${field} deve ser numérico.`), {
        status: 400,
      });
  if (
    Number(payload.umidade) < 0 ||
    Number(payload.umidade) > 100 ||
    Number(payload.bateria) < 0 ||
    Number(payload.bateria) > 100 ||
    Number(payload.sinal) < 0 ||
    Number(payload.sinal) > 100
  )
    throw Object.assign(
      new Error("Umidade, bateria e sinal devem estar entre 0 e 100."),
      { status: 400 },
    );
  if (!payload.deviceId)
    throw Object.assign(new Error("deviceId é obrigatório."), { status: 400 });
  const result = Object.fromEntries(
    Object.entries(payload).map(([key, value]) =>
      numeric.includes(key) ? [key, Number(value)] : [key, value],
    ),
  );
  result.aceleracaoX = Number.isFinite(Number(payload.aceleracaoX))
    ? Number(payload.aceleracaoX)
    : result.aceleracao;
  result.aceleracaoY = Number.isFinite(Number(payload.aceleracaoY))
    ? Number(payload.aceleracaoY)
    : 0;
  result.aceleracaoZ = Number.isFinite(Number(payload.aceleracaoZ))
    ? Number(payload.aceleracaoZ)
    : 0;
  return result;
}
async function receive(payload) {
  const data = validate(payload);
  const associatedTransportId = iotState.associatedTransportId(data.deviceId);
  if (associatedTransportId && data.transporteId !== associatedTransportId)
    throw Object.assign(
      new Error("Transporte não corresponde ao dispositivo informado."),
      { status: 409, code: "IOT_TRANSPORT_MISMATCH" },
    );
  const transport = await repository.getTransporte(data.transporteId);
  if (!transport)
    throw Object.assign(new Error("Transporte não encontrado."), {
      status: 404,
    });

  // O backend é a fonte de verdade da execução ativa. O ESP32/Wokwi não
  // precisa conhecer nem enviar execucao_id; cada leitura física é vinculada
  // à execução corrente do transporte antes de persistir dados e alertas.
  data.executionId = transport.execucao_atual_id || null;

  const execution = require("./executionPlanService").get(data.transporteId);
  const profile = execution?.organProfile || iotState.activeProfile();
  const reading = await repository.createLeitura(data),
    issues = evaluate(data, profile),
    alerts = [];
  const digitalSignal = evaluateDigitalAlert({
    transportActive: ["EM_ANDAMENTO", "ATENCAO", "CRITICO"].includes(
      transport.status,
    ),
    temperatureCritical: issues.some(
      (issue) => issue.tipo === "TEMPERATURA" && issue.severidade === "CRITICO",
    ),
    impactCritical: issues.some(
      (issue) => issue.tipo === "IMPACTO" && issue.severidade === "CRITICO",
    ),
  });
  for (const issue of issues) {
    const since = new Date(Date.now() - config.alertCooldownSeconds * 1000),
      recent = await repository.getRecentAlerta(
        data.transporteId,
        issue.tipo,
        since,
        data.executionId,
      );
    if (!recent) {
      const alert = await repository.createAlerta({
        transporteId: data.transporteId,
        executionId: data.executionId,
        leituraId: reading.id,
        ...issue,
      });
      alerts.push(alert);
      await alertNotifier.notify({ alert, reading });
    }
  }
  const status = issues.some((x) => x.severidade === "CRITICO")
    ? "CRITICO"
    : issues.length
      ? "ATENCAO"
      : "EM_ANDAMENTO";
  if (transport.status !== "CONCLUIDO")
    await repository.updateTransporte(data.transporteId, { status });
  iotState.recordTelemetry(
    data.deviceId,
    data.transporteId,
    digitalSignal,
    reading,
  );
  return { reading, alerts, status, digitalSignal };
}
module.exports = { receive, validate, alertNotifier };
