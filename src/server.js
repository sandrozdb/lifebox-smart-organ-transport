const config = require("./config");
const app = require("./app");
const { ensureDemo } = require("./services/bootstrapService");
const { errorMessage } = require("./utils/errorMessage");
let server;
async function shutdown(signal) {
  console.log(
    JSON.stringify({ level: "info", event: "server_stopping", signal }),
  );
  if (server) {
    const forceExit = setTimeout(() => process.exit(0), 2_000);
    server.close(async () => {
      clearTimeout(forceExit);
      if (config.dbDriver === "mysql")
        await require("./database/mysql").close();
      process.exit(0);
    });
    server.closeAllConnections?.();
  } else process.exit(0);
}
async function main() {
  try {
    if (config.dbDriver === "mysql") await require("./database/mysql").health();
    if (config.dbDriver === "memory" || config.seedDemoData) await ensureDemo();
    server = app.listen(config.port, () =>
      console.log(
        JSON.stringify({
          level: "info",
          event: "server_started",
          port: config.port,
          environment: config.nodeEnv,
          database: config.dbDriver,
        }),
      ),
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "server_start_failed",
        message: errorMessage(error),
        code: error?.code || undefined,
      }),
    );
    process.exit(1);
  }
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
main();
