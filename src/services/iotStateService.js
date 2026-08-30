const MODES = Object.freeze({ IOT: "IOT", DEMO: "DEMO" });
const config = require("../config");

const DEFAULT_SIGNAL = Object.freeze({
  transportActive: false,
  temperatureCritical: false,
  impactCritical: false,
  alertOutput: false,
  ledOn: false,
  buzzerOn: false,
});

let state = freshState();

function freshState() {
  return {
    mode: MODES.IOT,
    scenario: "normal",
    lastTelemetryAt: null,
    deviceId: null,
    transportId: null,
    lastReading: null,
    digitalSignal: { ...DEFAULT_SIGNAL },
  };
}

function associatedTransportId(deviceId) {
  if (
    config.iot.deviceId &&
    String(deviceId || "") === config.iot.deviceId &&
    Number.isInteger(config.iot.transportId) &&
    config.iot.transportId > 0
  )
    return config.iot.transportId;
  return state.deviceId === String(deviceId || "") ? state.transportId : null;
}

function snapshot(deviceId) {
  const lastSeenMs = state.lastTelemetryAt
    ? Date.now() - new Date(state.lastTelemetryAt).getTime()
    : null;
  const result = {
    ...state,
    online: lastSeenMs !== null && lastSeenMs <= 15000,
    telemetry: state.mode === MODES.IOT ? "LIVE" : "DEMO",
  };
  if (deviceId) result.transportId = associatedTransportId(deviceId);
  return result;
}

function setMode(mode) {
  const normalized = String(mode || "").toUpperCase();
  if (!Object.values(MODES).includes(normalized)) {
    throw Object.assign(new Error("Modo deve ser IOT ou DEMO."), {
      status: 422,
      code: "INVALID_IOT_MODE",
    });
  }
  state.mode = normalized;
  if (normalized === MODES.IOT) state.scenario = "normal";
  state.lastTelemetryAt = null;
  state.deviceId = null;
  state.transportId = null;
  state.lastReading = null;
  state.digitalSignal = { ...DEFAULT_SIGNAL };
  return snapshot();
}

function setScenario(scenario) {
  state.scenario = String(scenario || "normal").toLowerCase();
  return snapshot();
}

function recordTelemetry(deviceId, transportId, digitalSignal, reading) {
  state.lastTelemetryAt = new Date().toISOString();
  state.deviceId = String(deviceId);
  state.transportId = Number(transportId);
  state.lastReading = reading ? { ...reading } : null;
  state.digitalSignal = { ...DEFAULT_SIGNAL, ...digitalSignal };
  return snapshot();
}

function reset() {
  state = freshState();
  return snapshot();
}

module.exports = {
  MODES,
  snapshot,
  setMode,
  setScenario,
  recordTelemetry,
  associatedTransportId,
  reset,
};

