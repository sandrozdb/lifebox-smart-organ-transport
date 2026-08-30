const fs = require("fs");
const path = require("path");
require("dotenv").config();
const mysql = require("mysql2/promise");
const { errorMessage } = require("../src/utils/errorMessage");
const database = process.env.DB_NAME || "lifebox_db",
  sslCa = process.env.DB_SSL_CA?.replace(/\\n/g, "\n"),
  ssl =
    process.env.DB_SSL === "true"
      ? {
          rejectUnauthorized:
            process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
          ...(sslCa ? { ca: sslCa } : {}),
        }
      : undefined;
if (!/^[A-Za-z0-9_]+$/.test(database))
  throw new Error("DB_NAME deve conter apenas letras, números e sublinhado.");
async function ensureColumns(connection, table, columns) {
  const [rows] = await connection.query(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=?",
    [database, table],
  );
  const existing = new Set(rows.map((row) => row.COLUMN_NAME));
  for (const [column, definition] of Object.entries(columns))
    if (!existing.has(column)) {
      await connection.query(
        `ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`,
      );
      console.log(
        JSON.stringify({
          level: "info",
          event: "migration_applied",
          table,
          column,
        }),
      );
    }
}
async function ensureIndex(connection, table, name, columns) {
  const [rows] = await connection.query(
    "SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND INDEX_NAME=? LIMIT 1",
    [database, table, name],
  );
  if (!rows.length) {
    const safeColumns = columns.map((column) => `\`${column}\``).join(", ");
    await connection.query(
      `ALTER TABLE \`${table}\` ADD INDEX \`${name}\` (${safeColumns})`,
    );
    console.log(
      JSON.stringify({ level: "info", event: "index_created", table, name }),
    );
  }
}
async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    ssl,
    multipleStatements: true,
    connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS) || 10000,
  });
  try {
    await connection.query(
      fs
        .readFileSync(path.resolve("database", "schema.sql"), "utf8")
        .replaceAll("lifebox_db", database),
    );
    await connection.query(`USE \`${database}\``);
    await ensureColumns(connection, "transportes", {
      execucao_atual_id: "VARCHAR(80) NULL",
    });
    await ensureColumns(connection, "leituras", {
      aceleracao_x: "DECIMAL(7,3) NOT NULL DEFAULT 0",
      aceleracao_y: "DECIMAL(7,3) NOT NULL DEFAULT 0",
      aceleracao_z: "DECIMAL(7,3) NOT NULL DEFAULT 0",
      execucao_id: "VARCHAR(80) NULL",
    });
    await ensureColumns(connection, "alertas", {
      execucao_id: "VARCHAR(80) NULL",
    });
    await ensureColumns(connection, "eventos_rastreabilidade", {
      execucao_id: "VARCHAR(80) NULL",
    });
    await ensureIndex(connection, "leituras", "idx_leituras_execucao_data", [
      "transporte_id",
      "execucao_id",
      "registrado_em",
    ]);
    await ensureIndex(connection, "alertas", "idx_alertas_execucao_data", [
      "transporte_id",
      "execucao_id",
      "criado_em",
    ]);
    await ensureIndex(
      connection,
      "eventos_rastreabilidade",
      "idx_eventos_execucao_data",
      ["transporte_id", "execucao_id", "registrado_em"],
    );
    console.log(JSON.stringify({ level: "info", event: "schema_applied" }));
    if (process.env.SEED_DEMO_DATA === "true") {
      await connection.query(
        fs
          .readFileSync(path.resolve("database", "seed.sql"), "utf8")
          .replaceAll("lifebox_db", database),
      );
      console.log(
        JSON.stringify({ level: "info", event: "demo_seed_applied" }),
      );
    }
  } finally {
    await connection.end();
  }
}
run().catch((error) => {
  console.error(
    JSON.stringify({
      level: "error",
      event: "database_setup_failed",
      message: errorMessage(error),
      code: error?.code || undefined,
    }),
  );
  process.exit(1);
});
