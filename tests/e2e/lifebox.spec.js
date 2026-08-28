const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page, request }) => {
  page.on("pageerror", (error) => console.error("PAGE_ERROR", error.message));
  await request.post("/api/simulacao/reset", { data: { transporteId: 1 } });
  await page.goto("/");
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
  await expect(page.locator("#buzzer-status")).toHaveText("ATIVO");
});

test("reotimização exige confirmação e termina como aplicada", async ({
  page,
}) => {
  await page.locator("#planning-scenario").selectOption("GROUND_SHORT");
  await expect(page.locator("#planning-result")).toContainText("PLANO ÓTIMO");
  await page.locator('[data-action="start"]').click();
  await page.locator('[data-logistic="groundRouteUnavailable"]').click();
  const apply = page.locator("#apply-reoptimization");
  await expect(apply).toBeVisible({ timeout: 10_000 });
  await apply.click();
  await expect(page.locator("#planning-result")).toContainText(
    "REOTIMIZAÇÃO APLICADA",
  );
  await expect(page.locator("#apply-reoptimization")).toHaveCount(0);
});

test("resumo final aparece após concluir", async ({ page }) => {
  await page.locator('[data-action="start"]').click();
  await page.locator('[data-scenario="concluir"]').click();
  await expect(page.locator("#summary-section")).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.locator("#summary-grid")).not.toBeEmpty();
});
