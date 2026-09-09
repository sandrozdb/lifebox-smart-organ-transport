const { spawn } = require("node:child_process");
const path = require("node:path");

const port = Number(process.env.E2E_PORT) || 3101;
const healthUrl = `http://127.0.0.1:${port}/api/health`;
const startupTimeoutMs = 15_000;
const pollIntervalMs = 250;
const shutdownTimeoutMs = 3_000;

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  console.error("E2E_PORT deve ser uma porta TCP válida.");
  process.exit(1);
}

let serverProcess;
let playwrightProcess;
let cleanupPromise;
let handlingSignal = false;

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function hasExited(child) {
  return child.exitCode !== null || child.signalCode !== null;
}

function waitForExit(child, timeoutMs) {
  if (hasExited(child)) return Promise.resolve(true);

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      child.removeListener("exit", onExit);
      resolve(false);
    }, timeoutMs);
    const onExit = () => {
      clearTimeout(timeout);
      resolve(true);
    };
    child.once("exit", onExit);
  });
}

async function waitForHealth() {
  const deadline = Date.now() + startupTimeoutMs;
  while (Date.now() < deadline) {
    if (hasExited(serverProcess))
      throw new Error("Servidor E2E encerrou antes de ficar saudável.");

    try {
      const response = await fetch(healthUrl);
      if (response.ok) return;
    } catch {
      // O servidor ainda está iniciando.
    }
    await delay(pollIntervalMs);
  }
  throw new Error(`Servidor E2E não respondeu em ${healthUrl}.`);
}

function runPlaywright() {
  const playwrightCli = require.resolve("@playwright/test/cli");
  playwrightProcess = spawn(
    process.execPath,
    [playwrightCli, "test", ...process.argv.slice(2)],
    {
      env: {
        ...process.env,
        E2E_PORT: String(port),
        E2E_REUSE_SERVER: "true",
      },
      stdio: "inherit",
      shell: false,
    },
  );

  return new Promise((resolve, reject) => {
    playwrightProcess.once("error", reject);
    playwrightProcess.once("exit", (code, signal) => {
      if (code !== null) resolve(code);
      else reject(new Error(`Playwright encerrou pelo sinal ${signal}.`));
    });
  });
}

async function stopServer() {
  if (!serverProcess || hasExited(serverProcess)) return;
  serverProcess.kill("SIGTERM");
  if (await waitForExit(serverProcess, shutdownTimeoutMs)) return;
  serverProcess.kill("SIGKILL");
  await waitForExit(serverProcess, shutdownTimeoutMs);
}

function cleanup() {
  cleanupPromise ||= stopServer();
  return cleanupPromise;
}

async function handleSignal(signal) {
  if (handlingSignal) return;
  handlingSignal = true;
  if (playwrightProcess && !hasExited(playwrightProcess))
    playwrightProcess.kill(signal);
  await cleanup();
  process.exit(signal === "SIGINT" ? 130 : 143);
}

process.once("SIGINT", () => void handleSignal("SIGINT"));
process.once("SIGTERM", () => void handleSignal("SIGTERM"));

async function main() {
  let exitCode = 1;
  try {
    serverProcess = spawn(
      process.execPath,
      [path.join(__dirname, "start-memory.js")],
      {
        env: {
          ...process.env,
          PORT: String(port),
          DB_DRIVER: "memory",
        },
        stdio: "inherit",
        shell: false,
      },
    );
    serverProcess.once("error", (error) => {
      console.error(`Falha ao iniciar servidor E2E: ${error.message}`);
    });

    await waitForHealth();
    exitCode = await runPlaywright();
  } catch (error) {
    console.error(error.message);
  } finally {
    await cleanup();
  }
  process.exitCode = exitCode;
}

void main();
