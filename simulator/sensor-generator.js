const jitter = (amount) => (Math.random() - 0.5) * amount;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
function normalTemperature(profile) {
  const preservation = profile?.preservation,
    range = preservation?.referenceRangeC;
  if (!range) return 5 + jitter(0.35);
  const [min, max] = range,
    operationalTarget = Number(preservation.targetTemperatureC);
  const safeMargin = Math.min(0.25, Math.max(0, (max - min) / 4));
  const center = clamp(operationalTarget, min + safeMargin, max - safeMargin);
  return clamp(center + jitter(Math.min(0.35, (max - min) / 3)), min, max);
}
function criticalTemperature(profile, scenarioTick) {
  const range = profile?.preservation?.referenceRangeC;
  return range
    ? range[1] + 2 + Math.max(0, scenarioTick - 1)
    : Math.min(12, 5 + scenarioTick * 7);
}
function generate(state) {
  state.tick += 1;
  const slow = state.scenario === "atraso",
    profile = state.logistics?.organProfile;
  state.progress =
    state.logistics?.totalProgress ??
    Math.min(1, state.progress + (slow ? 0.003 : 0.012));
  let temperatura = normalTemperature(profile),
    umidade = 58 + jitter(2),
    impacto = Math.max(0, 0.12 + jitter(0.12)),
    aceleracao = 0.25 + jitter(0.18),
    bateria = Math.max(0, state.battery - 0.04),
    sinal = 88 + jitter(5),
    velocidade = slow ? 8 + jitter(2) : 38 + jitter(8);
  if (state.scenario === "temperatura")
    temperatura = criticalTemperature(profile, state.scenarioTick);
  if (state.scenario === "umidade")
    umidade = Math.min(91, 58 + state.scenarioTick * 5);
  if (
    state.scenario === "impacto" &&
    state.scenarioTick >= 1 &&
    state.scenarioTick <= 3
  ) {
    impacto = 4.4;
    aceleracao = 4.8;
  }
  if (state.scenario === "bateria") bateria = Math.max(7, state.battery - 6);
  state.battery = bateria;
  if (state.scenario === "sinal") sinal = state.scenarioTick < 7 ? 0 : 82;
  if (state.scenario === "concluir") {
    state.progress = 1;
    velocidade = 0;
  }
  const location = state.logistics?.currentPosition || {
      latitude: -23.561684,
      longitude: -46.655981,
    },
    ax = aceleracao,
    ay = jitter(0.16),
    az = 0.98 + jitter(0.08);
  return {
    transporteId: state.transporteId,
    executionId: state.executionId,
    deviceId: "LIFEBOX-001",
    cenario: state.scenario,
    temperatura: +temperatura.toFixed(2),
    umidade: +umidade.toFixed(2),
    aceleracao: +aceleracao.toFixed(3),
    aceleracaoX: +ax.toFixed(3),
    aceleracaoY: +ay.toFixed(3),
    aceleracaoZ: +az.toFixed(3),
    impacto: +impacto.toFixed(3),
    ...location,
    velocidade: +Math.max(0, velocidade).toFixed(2),
    bateria: +bateria.toFixed(2),
    sinal: +Math.max(0, sinal).toFixed(2),
    timestamp: new Date().toISOString(),
  };
}
module.exports = { generate, normalTemperature, criticalTemperature };
