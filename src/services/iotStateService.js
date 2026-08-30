const MODES = Object.freeze({ IOT: "IOT", DEMO: "DEMO" });

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
    lastReading: null,
    digitalSignal: { ...DEFAULT_SIGNAL },
  };
}

function snapshot() {
  const lastSeenMs = state.lastTelemetryAt
    ? Date.now() - new Date(state.lastTelemetryAt).getTime()
    : null;
  return {
    ...state,
    online: lastSeenMs !== null && lastSeenMs <= 15000,
    telemetry: state.mode === MODES.IOT ? "LIVE" : "DEMO",
  };
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
  state.lastReading = null;
  state.digitalSignal = { ...DEFAULT_SIGNAL };
  return snapshot();
}

function setScenario(scenario) {
  state.scenario = String(scenario || "normal").toLowerCase();
  return snapshot();
}

function recordTelemetry(deviceId, digitalSignal, reading) {
  state.lastTelemetryAt = new Date().toISOString();
  state.deviceId = String(deviceId);
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
  reset,
};
