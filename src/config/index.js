const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });
const sslEnabled = process.env.DB_SSL === "true";
module.exports = Object.freeze({
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  dbDriver: process.env.DB_DRIVER || "mysql",
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
        }
      : undefined,
  },
});
