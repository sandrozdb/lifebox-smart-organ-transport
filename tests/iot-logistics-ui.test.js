const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const dashboardSource = fs.readFileSync(
  path.resolve(__dirname, "../public/js/dashboard.js"),
  "utf8",
);
const planningSource = fs.readFileSync(
  path.resolve(__dirname, "../public/js/planning.js"),
  "utf8",
);

test("modo IoT bloqueia apenas cenários da caixa", () => {
  const start = dashboardSource.indexOf("function updateIotControls");
  const end = dashboardSource.indexOf(
    "window.lifeBoxSnapExecutionTracking",
    start,
  );
  const updateIotControls = dashboardSource.slice(start, end);

  assert.ok(start >= 0 && end > start);
  assert.match(updateIotControls, /querySelectorAll\("\[data-scenario\]"\)/);
  assert.doesNotMatch(
    updateIotControls,
    /\[data-scenario\], \[data-logistic\]/,
  );
  assert.doesNotMatch(
    updateIotControls,
    /querySelectorAll\("\[data-logistic\]"\)/,
  );
  assert.match(
    updateIotControls,
    /Condições logísticas permanecem disponíveis para o operador/,
  );
});

test("condições logísticas continuam sob controle da reotimização", () => {
  assert.match(planningSource, /querySelectorAll\("\[data-logistic\]"\)/);
  assert.match(planningSource, /toggleLogistic\(button\)/);
  assert.match(planningSource, /reotimizar\/recomendar/);
});
