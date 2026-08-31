const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page, request }) => {
  page.on("pageerror", (error) => console.error("PAGE_ERROR", error.message));
  await request.post("/api/simulacao/reset", { data: { transporteId: 1 } });
  await page.goto("/");
  await page.locator("#iot-mode").selectOption("DEMO");
  await expect(page.locator("#telemetry-status")).toHaveText(
    "TELEMETRIA DEMONSTRAÇÃO",
  );
  await page.locator("#planning-calculate").click();
  await expect(page.locator("#planning-result")).toContainText("PLANO ÓTIMO");
  await expect(page.locator('[data-action="start"]')).toBeEnabled();
});

test.afterEach(async ({ request }) => {
  await request.post("/api/simulacao/reset", { data: { transporteId: 1 } });
});

test("normal: planejamento inicia e apresenta indicadores", async ({
  page,
}) => {
  await expect(page.locator("#planning-table tr")).not.toHaveCount(0);
  await expect(page.locator('[data-action="start"]')).toBeEnabled();
  await page.locator('[data-action="start"]').click();
  await expect(page.locator("#sim-status")).toContainText("Executando");
  await expect(page.locator("#ischemia")).not.toHaveText("--");
});

test("alerta crítico aciona saída digital, LED e buzzer", async ({ page }) => {
  await page.locator('[data-action="start"]').click();
  await page.locator('[data-scenario="impacto"]').click();
  await expect(page.locator("#digital-impact-critical")).toHaveText("1", {
    timeout: 10_000,
  });
  await expect(page.locator("#digital-alert-output")).toHaveText("1");
  await expect(page.locator("#led-status")).toHaveText("LIGADO");
  await expect(page.locator("#buzzer-status")).toHaveText("LIGADO");
});

test("reotimização exige confirmação e termina como aplicada", async ({
  page,
}) => {
  let recommendationId;
  let applyPayload;
  page.on("response", async (response) => {
    if (response.url().endsWith("/api/simulacao/reotimizar/recomendar")) {
      const body = await response.json();
      recommendationId = body.recommendationId;
    }
  });
  page.on("request", (request) => {
    if (request.url().endsWith("/api/simulacao/reotimizar/aplicar"))
      applyPayload = request.postDataJSON();
  });
  await page
    .locator("#planning-scenario")
    .selectOption("DEMO_01_GROUND_ANHANGUERA");
  await expect(page.locator("#planning-result")).toContainText("PLANO ÓTIMO");
  await page.locator('[data-action="start"]').click();
  await expect(page.locator("#sim-status")).toContainText("Executando");
  await page.locator('[data-logistic="groundRouteUnavailable"]').click();
  const apply = page.locator("#apply-reoptimization");
  await expect(apply).toBeVisible({ timeout: 10_000 });
  await expect
    .poll(() => recommendationId)
    .toMatch(/^[0-9a-f]{8}-[0-9a-f-]{27}$/i);
  await apply.click();
  await expect(page.locator("#planning-result")).toContainText(
    "REOTIMIZAÇÃO APLICADA",
  );
  await expect(page.locator("#apply-reoptimization")).toHaveCount(0);
  expect(applyPayload).toEqual({
    transporteId: 1,
    recommendationId,
  });
  expect(
    await page.evaluate(() => window.lifeBoxReoptimizationRecommendation),
  ).toBeNull();
});

test("resumo final aparece após concluir", async ({ page }) => {
  await page.locator('[data-action="start"]').click();
  await page.locator('[data-scenario="concluir"]').click();
  await expect(page.locator("#summary-section")).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.locator("#summary-grid")).not.toBeEmpty();
});
