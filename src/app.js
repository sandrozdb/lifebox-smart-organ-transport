const path = require("path");
const express = require("express");
const config = require("./config");

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "50kb" }));
app.use(
  express.static(path.resolve(__dirname, "..", "public"), {
    etag: false,
    setHeaders(response) {
      response.setHeader("Cache-Control", "no-store");
    },
  }),
);
app.use("/docs", express.static(path.resolve(__dirname, "..", "docs")));

app.get("/api/health", async (_req, res) => {
  try {
    if (config.dbDriver === "mysql") await require("./database/mysql").health();
    res.json({ status: "ok", service: "lifebox-api" });
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "health_check_failed",
        message: error.message,
      }),
    );
    res.status(503).json({
      error: "Serviço temporariamente indisponível.",
      code: "SERVICE_UNAVAILABLE",
    });
  }
});

app.use("/api/transportes", require("./routes/transportes"));
app.use("/api/telemetria", require("./routes/telemetria"));
app.use("/api/alertas", require("./routes/alertas"));
app.use("/api/simulacao", require("./routes/simulacao"));
app.use("/api/iot", require("./routes/iot"));
app.use("/api/otimizacao", require("./routes/otimizacao"));
app.use("/api/planejamento", require("./routes/planejamento"));
app.use("/api/fisica", require("./routes/fisica"));
app.use("/api/qualidade", require("./routes/qualidade"));

app.use("/api", (_req, res) =>
  res
    .status(404)
    .json({ error: "Endpoint não encontrado.", code: "ENDPOINT_NOT_FOUND" }),
);
app.use((error, _req, res, _next) => {
  const status = Number(error.status) || 500;
  const publicMessage =
    status < 500 ? error.message : "Erro interno do servidor.";
  console.error(
    JSON.stringify({
      level: "error",
      event: "request_failed",
      status,
      code: error.code || "INTERNAL_ERROR",
      message: error.message,
    }),
  );
  res.status(status).json({
    error: publicMessage,
    code: error.code || (status < 500 ? "REQUEST_FAILED" : "INTERNAL_ERROR"),
    ...(error.details ? { details: error.details } : {}),
  });
});

module.exports = app;
