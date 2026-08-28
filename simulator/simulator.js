require("dotenv").config();
const { generate } = require("./sensor-generator");
const base = process.env.API_BASE_URL || "http://localhost:3000";
const interval = Number(process.env.SIMULATOR_INTERVAL_MS) || 2000;
const state = {
  transporteId: Number(process.env.TRANSPORTE_ID) || 1,
  tick: 0,
  scenarioTick: 0,
  scenario: process.argv[2] || "normal",
  progress: 0,
  battery: 100,
};
async function send() {
  state.scenarioTick++;
  const payload = generate(state);
  try {
    const response = await fetch(`${base}/api/telemetria`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    console.log(
      `${payload.timestamp} | ${payload.temperatura}°C | ${payload.bateria}% | ${result.status || result.erro}`,
    );
    if (state.progress >= 1) process.exit(0);
  } catch (error) {
    console.error("API indisponível:", error.message);
  }
}
console.log(
  `Simulador externo iniciado: ${state.scenario}. Ctrl+C para encerrar.`,
);
send();
setInterval(send, interval);
