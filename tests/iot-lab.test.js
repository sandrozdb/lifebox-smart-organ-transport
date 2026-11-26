const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const load = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("dashboard links to the three-mode IoT lab page", () => {
  const dashboard = load("public/index.html");
  const lab = load("public/iot-lab.html");

  assert.match(dashboard, /href="\/iot-lab\.html"/);
  for (const mode of ["demo", "wokwi", "real"]) {
    assert.match(lab, new RegExp(`data-lab-tab="${mode}"`));
    assert.match(lab, new RegExp(`id="panel-${mode}"`));
  }
  assert.match(lab, /VALORES SIMULADOS/);
  assert.match(lab, /telemetria online será\s+integrada depois/);
});

test("physical ESP32 firmware keeps both potentiometers on ADC1", () => {
  const sketch = load("firmware-real/sketch.ino");

  assert.match(sketch, /PIN_TEMP = 34/);
  assert.match(sketch, /PIN_IMPACTO = 35/);
  assert.match(sketch, /Wire\.begin\(21, 22\)/);
  assert.match(sketch, /LED_VERDE = 25/);
  assert.match(sketch, /LED_VERMELHO = 26/);
  assert.match(sketch, /PIN_BUZZER = 27/);
  assert.match(sketch, /BOTAO_BOOT = 0/);
  assert.match(sketch, /INVERTER_TEMP = true/);
  assert.match(sketch, /INVERTER_IMPACTO = true/);
  assert.match(sketch, /ledcAttach\(PIN_BUZZER, 2000, 8\)/);
  assert.match(sketch, /buzzerLigado = false/);
  assert.match(sketch, /alerta && !buzzerLigado/);
  assert.match(sketch, /!alerta && buzzerLigado/);
  assert.doesNotMatch(sketch, /ledcWriteTone\(PIN_BUZZER, alerta \? 2000 : 0\)/);
  assert.match(sketch, /display\.setCursor\(0, 57\)/);
  assert.match(sketch, /acentoAgudo\(18, 55\)/);
});

test("virtual Wokwi firmware remains separate from the offline physical demo", () => {
  const virtual = load("firmware/sketch.ino");
  const physical = load("firmware-real/sketch.ino");

  assert.match(virtual, /Wokwi-GUEST/);
  assert.match(virtual, /\/api\/telemetria/);
  assert.doesNotMatch(physical, /WiFi\.begin\(/);
  assert.doesNotMatch(physical, /HTTPClient\.begin\(/);
});
