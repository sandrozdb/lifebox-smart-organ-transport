const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const result = spawnSync(process.execPath, ["--test", "--test-concurrency=1"], {
  cwd: path.resolve(__dirname, ".."),
  encoding: "utf8",
});
process.stdout.write(result.stdout || "");
process.stderr.write(result.stderr || "");
const combined = `${result.stdout || ""}\n${result.stderr || ""}`;
const passed = Number(combined.match(/ℹ pass (\d+)/)?.[1] || 0),
  failed = Number(combined.match(/ℹ fail (\d+)/)?.[1] || 0);
const target = path.resolve(__dirname, "..", "work", "qa-last-run.json");
try {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(
    target,
    JSON.stringify({
      passed,
      failed,
      status: result.status === 0 ? "APROVADA" : "REPROVADA",
      validatedAt: new Date().toISOString(),
    }),
  );
} catch (error) {
  process.stderr.write(
    `[QA] aviso: não foi possível atualizar work/qa-last-run.json (${error.code || error.message}).\n`,
  );
}
process.exit(result.status ?? 1);
