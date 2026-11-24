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
  assert.match(lab, /telemetria online será integrada depois/);
});

test("physical ESP32 firmware keeps both potentiometers on ADC1", () => {
  const sketch = load("firmware-real/sketch.ino");

  assert.match(sketch, /PIN_TEMPERATURE = 34/);
  assert.match(sketch, /PIN_IMPACT = 35/);
  assert.match(sketch, /PIN_OLED_SDA = 21/);
  assert.match(sketch, /PIN_OLED_SCL = 22/);
  assert.match(sketch, /PIN_GREEN_LED = 25/);
  assert.match(sketch, /PIN_RED_LED = 26/);
  assert.match(sketch, /ENABLE_BUZZER = false/);
  assert.match(sketch, /VALORES SIMULADOS/);
});

test("virtual Wokwi firmware remains separate from the offline physical demo", () => {
  const virtual = load("firmware/sketch.ino");
  const physical = load("firmware-real/sketch.ino");

  assert.match(virtual, /Wokwi-GUEST/);
  assert.match(virtual, /\/api\/telemetria/);
  assert.doesNotMatch(physical, /WiFi\.begin\(/);
  assert.doesNotMatch(physical, /HTTPClient\.begin\(/);
});
