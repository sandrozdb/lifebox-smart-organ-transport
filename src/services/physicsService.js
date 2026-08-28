const config = require("../config/physics");
const repository = require("../repositories");
const thresholds = require("../config/thresholds");
const executionPlan = require("./executionPlanService");
const round = (value, places = 3) => Number(Number(value).toFixed(places));
function thermalVariation(initial, current) {
  return current - initial;
}
function thermalRate(deltaT, elapsedMinutes) {
  return elapsedMinutes > 0 ? deltaT / elapsedMinutes : 0;
}
function heatEnergy(mass, specificHeat, deltaT) {
  return mass * specificHeat * deltaT;
}
function accelerationMagnitude(ax, ay, az) {
  return Math.sqrt(ax ** 2 + ay ** 2 + az ** 2);
}
function electricPower(voltage, current) {
  return voltage * current;
}
function electricEnergy(power, elapsedHours) {
  return power * elapsedHours;
}
function batteryAutonomyHours(capacityWh, batteryPercent, powerWatts) {
  return powerWatts > 0
    ? (capacityWh * Math.max(0, batteryPercent)) / 100 / powerWatts
    : 0;
}
function readingTime(reading) {
  return new Date(
    String(reading.registrado_em || reading.timestamp).replace(" ", "T"),
  ).getTime();
}
function criticalActuators(reading, range) {
  const [min, max] = range || [
    thresholds.temperatura.criticalMin,
    thresholds.temperatura.criticalMax,
  ];
  return (
    Number(reading.temperatura) > max ||
    Number(reading.temperatura) < min ||
    Number(reading.impacto) >= thresholds.impacto.critical
  );
}
function estimatedCurrent(reading, range) {
  return (
    config.correnteBaseAmperes +
    (Number(reading.sinal) > 0 ? config.correnteGpsComunicacaoAmperes : 0) +
    (criticalActuators(reading, range)
      ? config.correnteLedAlertaAmperes + config.correnteBuzzerAmperes
      : 0)
  );
}
function accumulatedEnergy(readings, elapsedMinutes, range) {
  if (readings.length < 2 || elapsedMinutes <= 0) return 0;
  const perInterval = elapsedMinutes / (readings.length - 1) / 60;
  return readings
    .slice(1)
    .reduce(
      (total, reading) =>
        total +
        electricEnergy(
          electricPower(config.tensaoVolts, estimatedCurrent(reading, range)),
          perInterval,
        ),
      0,
    );
}
async function analyze(transporteId) {
  const transport = await repository.getTransporte(transporteId);
  const execution = executionPlan.get(transporteId);
  const executionId = execution?.organProfile
    ? transport?.execucao_atual_id
    : null;
  const readings = (
    await repository.getLeituras(transporteId, 10000, executionId)
  ).reverse();
  if (!readings.length)
    return {
      available: false,
      message:
        "Aguardando leituras da execução atual para calcular a análise física.",
      parameters: config,
    };
  const profile = execution?.organProfile || null,
    range = profile?.preservation?.referenceRangeC || [
      thresholds.temperatura.normalMin,
      thresholds.temperatura.normalMax,
    ],
    first = readings[0],
    last = readings.at(-1),
    elapsedMinutes = execution
      ? Number(execution.transportElapsedMinutes) || 0
      : Math.max(0, (readingTime(last) - readingTime(first)) / 60000),
    deltaT = thermalVariation(
      Number(first.temperatura),
      Number(last.temperatura),
    ),
    magnitudes = readings.map((r) =>
      accelerationMagnitude(
        Number(r.aceleracao_x ?? r.aceleracao ?? 0),
        Number(r.aceleracao_y ?? 0),
        Number(r.aceleracao_z ?? 0),
      ),
    ),
    current = estimatedCurrent(last, range),
    power = electricPower(config.tensaoVolts, current),
    batteryPercent = Number(last.bateria),
    remainingWh = (config.bateriaCapacidadeWh * batteryPercent) / 100,
    energyWh = accumulatedEnergy(readings, elapsedMinutes, range),
    inRange =
      Number(last.temperatura) >= range[0] &&
      Number(last.temperatura) <= range[1];
  return {
    available: true,
    executionId,
    organ: profile
      ? { code: profile.code, name: profile.name, referenceRangeC: range }
      : null,
    thermal: {
      initial: Number(first.temperatura),
      current: Number(last.temperatura),
      deltaT: round(deltaT),
      elapsedMinutes: round(elapsedMinutes, 2),
      rateCPerMinute: round(thermalRate(deltaT, elapsedMinutes)),
      heatJoules: round(
        heatEnergy(
          config.massaEquivalenteKg,
          config.calorEspecificoJPorKgC,
          deltaT,
        ),
      ),
      status: inRange ? "DENTRO DA FAIXA" : "FORA DA FAIXA",
    },
    acceleration: {
      x: Number(last.aceleracao_x ?? last.aceleracao ?? 0),
      y: Number(last.aceleracao_y ?? 0),
      z: Number(last.aceleracao_z ?? 0),
      resultant: round(magnitudes.at(-1)),
      peak: round(Math.max(...magnitudes)),
      impact: Number(last.impacto),
    },
    electrical: {
      voltage: config.tensaoVolts,
      current: round(current),
      powerWatts: round(power),
      elapsedHours: round(elapsedMinutes / 60),
      energyWh: round(energyWh),
      batteryPercent,
      remainingEnergyWh: round(remainingWh),
      estimatedAutonomyHours: round(
        batteryAutonomyHours(config.bateriaCapacidadeWh, batteryPercent, power),
        2,
      ),
    },
    parameters: config,
    disclaimer:
      "Cálculo didático com telemetria e parâmetros simulados; não representa validação clínica ou de hardware real.",
  };
}
module.exports = {
  thermalVariation,
  thermalRate,
  heatEnergy,
  accelerationMagnitude,
  electricPower,
  electricEnergy,
  batteryAutonomyHours,
  readingTime,
  estimatedCurrent,
  accumulatedEnergy,
  analyze,
};
