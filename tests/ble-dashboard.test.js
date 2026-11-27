const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const load = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

test("firmware BLE experimental preserva controles locais sem alterar o sketch original", () => {
  const original = load("firmware-real/sketch.ino");
  const full = load("bluetooth-test/lifebox-ble-full/lifebox-ble-full.ino");
  const page = load("public/index.html");
  const dashboard = load("public/js/dashboard.js");
  assert.match(original, /LIFEBOX FISICA OFFLINE PRONTA/);
  for (const token of [
    "Wire.begin(21, 22)", "acentoAgudo(18, 55)", "ledcWriteTone(PIN_BUZZER, 2000)",
    "BOTAO_BOOT = 0", "transmitirBLE();", "iniciarBLE();",
    "PROPERTY_NOTIFY", "INVERTER_TEMP = true", "INVERTER_IMPACTO = true",
  ]) {
    assert.ok(full.includes(token), "Ausente no firmware completo: " + token);
  }
  assert.doesNotMatch(full, /WiFi\.begin\(/);
  assert.doesNotMatch(full, /HTTPClient/);
  assert.match(page, /data-mode="BLE"/);
  assert.match(page, /id="physical-ble-panel"/);
  assert.match(page, /ble-dashboard\.js/);
  assert.match(dashboard, /window\.lifeBoxBleSetMode\?\.\(true\)/);
  assert.match(dashboard, /window\.lifeBoxBleApply\?\.\(\)/);
  assert.match(dashboard, /Fonte local: NAO altera o modo IoT do backend/);
  new vm.Script(load("public/js/ble-dashboard.js"));
  new vm.Script(dashboard);
});

test("dashboard BLE recebe valores, mostra alerta duplo e respeita pausa do BOOT", async () => {
  const elements = new Map();
  const get = (id) => {
    if (!elements.has(id)) {
      const classes = new Set();
      const listeners = {};
      elements.set(id, {
        id, dataset: {}, hidden: false, disabled: false, value: "",
        textContent: "", innerHTML: "", className: "",
        classList: {
          add: (value) => classes.add(value),
          remove: (value) => classes.delete(value),
          toggle: (value, enabled) => {
            if (enabled) classes.add(value);
            else classes.delete(value);
          },
          contains: (value) => classes.has(value),
        },
        addEventListener: (event, listener) => { listeners[event] = listener; },
        querySelector: () => ({ textContent: "" }),
        listeners,
      });
    }
    return elements.get(id);
  };
  const view = (csv) => {
    const bytes = new TextEncoder().encode(csv);
    return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  };
  let notify;
  const characteristic = {
    addEventListener: (type, handler) => { if (type === "characteristicvaluechanged") notify = handler; },
    startNotifications: async () => undefined,
    readValue: async () => view("6.2,1.40,1"),
  };
  const service = { getCharacteristic: async () => characteristic };
  const server = { getPrimaryService: async () => service };
  const device = {
    gatt: {
      connected: false,
      connect: async function () { this.connected = true; return server; },
      disconnect: function () { this.connected = false; },
    },
    addEventListener: () => undefined,
  };
  const window = {};
  const navigator = { bluetooth: { requestDevice: async () => device } };
  const context = {
    window, document: { getElementById: get }, navigator,
    TextDecoder, Number, Boolean, String, Date,
    setInterval: () => undefined,
  };
  vm.runInNewContext(load("public/js/ble-dashboard.js"), context);

  window.lifeBoxBleSetMode(true);
  assert.equal(get("physical-ble-panel").hidden, false);
  await get("ble-connect").listeners.click();
  assert.equal(get("temperature").textContent, "6.2");
  assert.equal(get("impact").textContent, "1.40");

  notify({ target: { value: view("9.0,4.20,1") } });
  assert.equal(get("temperature").textContent, "9.0");
  assert.equal(get("impact").textContent, "4.20");
  assert.equal(get("alert-count").textContent, "2");
  assert.match(get("presentation-alert-title").textContent, /TEMPERATURA E IMPACTO/);
  assert.equal(get("presentation-alert").classList.contains("hidden"), false);

  notify({ target: { value: view("9.0,4.20,0") } });
  assert.equal(get("general-status").textContent, "AGUARDANDO");
  assert.equal(get("alert-count").textContent, "0");
  assert.equal(get("presentation-alert").classList.contains("hidden"), true);

  window.lifeBoxBleSetMode(false);
  assert.equal(get("physical-ble-panel").hidden, true);
  assert.equal(device.gatt.connected, false);
});
