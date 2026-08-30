const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });
const sslEnabled = process.env.DB_SSL === "true";
const nodeEnv = process.env.NODE_ENV || "development";
const dbDriver = process.env.DB_DRIVER || "mysql";
const sslCa = process.env.DB_SSL_CA?.replace(/\\n/g, "\n");

if (!["memory", "mysql"].includes(dbDriver))
  throw new Error(`DB_DRIVER inválido: ${dbDriver}. Use memory ou mysql.`);

if (nodeEnv === "production" && dbDriver === "mysql") {
  const required = ["DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME"];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length)
    throw new Error(
      `Configuração MySQL de produção incompleta: ${missing.join(", ")}.`,
    );
}

module.exports = Object.freeze({
  port: Number(process.env.PORT) || 3000,
  nodeEnv,
  dbDriver,
  seedDemoData: process.env.SEED_DEMO_DATA === "true",
  simulatorIntervalMs: Number(process.env.SIMULATOR_INTERVAL_MS) || 2000,
  simulationTimeScale: Number(process.env.SIMULATION_TIME_SCALE) || 120,
  alertCooldownSeconds: Number(process.env.ALERT_COOLDOWN_SECONDS) || 30,
  apiBaseUrl: process.env.API_BASE_URL || "http://localhost:3000",
  database: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "lifebox_db",
    connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS) || 10000,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
    ssl: sslEnabled
      ? {
          rejectUnauthorized:
            process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
          ...(sslCa ? { ca: sslCa } : {}),
        }
      : undefined,
  },
});
