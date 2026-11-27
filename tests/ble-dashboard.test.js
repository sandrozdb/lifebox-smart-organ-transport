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
    "PROPERTY_NOTIFY", "PROPERTY_WRITE", "BLE_COMMAND_UUID",
    "aplicarPerfilPendente();", "INVERTER_TEMP = true", "INVERTER_IMPACTO = true",
    "return transporteAtivo && (temperaturaCritica() || impactoCritico());",
  ]) assert.ok(full.includes(token), "Ausente no firmware experimental: " + token);
  assert.doesNotMatch(full, /WiFi\.begin\(/);
  assert.doesNotMatch(full, /HTTPClient/);
  assert.match(full, /temperaturaCritica\(\) \|\| impactoCritico\(\)/);
  assert.match(page, /<option value="BLE">/);
  assert.match(page, /data-mode="BLE"/);
  assert.match(page, /id="ble-connect-controls" class="ble-connect-controls" hidden/);
  // A isquemia nao pode ser empurrada para a linha de baixo pelo botao BLE.
  const order = ["planning-scenario", "planning-organ", "planning-consumed",
    "planning-calculate", "ble-connect-controls"];
  const offsets = order.map((id) => page.indexOf('id="' + id + '"'));
  assert.ok(offsets.every((value, i) => value >= 0 && (i === 0 || value > offsets[i - 1])));
  const bleCss = load("public/css/ble-dashboard.css");
  assert.match(bleCss, /grid-template-columns:\s*minmax\(0, 1\.25fr\)/);
  assert.match(bleCss, /@media \(max-width: 560px\)/);
  assert.match(page, /id="planning-organ"/);
  assert.match(page, /id="ble-connect"/);
  assert.doesNotMatch(page, /id="ble-organ"/);
  assert.doesNotMatch(page, /id="ble-disconnect"/);
  for (const id of ["humidity-label", "battery-label", "signal-label"]) {
    assert.ok(page.includes(`id="${id}"`));
  }
  assert.match(page, /ble-dashboard\.js/);
  assert.match(dashboard, /window\.lifeBoxBleSetMode\?\.\(true\)/);
  assert.match(dashboard, /window\.lifeBoxBleApply\?\.\(\)/);
  assert.match(dashboard, /Fonte local: NAO altera o modo IoT do backend/);
  const profiles = require("../src/config/organProfiles").profiles;
  for (const profile of profiles) {
    const [minimum, maximum] = profile.preservation.referenceRangeC;
    const expression = new RegExp(
      '\\{"' + profile.code + '",\\s*"[^"]+",\\s*' +
      minimum.toFixed(1) + 'f,\\s*' + maximum.toFixed(1) + 'f\\}',
    );
    assert.match(full, expression, "Faixa nao corresponde ao perfil: " + profile.code);
  }
  new vm.Script(load("public/js/ble-dashboard.js"));
  new vm.Script(load("public/js/planning.js"));
  new vm.Script(dashboard);
});

test("BLE aplica ativo AND (temperatura critica OR impacto critico), com orgao e BOOT", async () => {
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
  get("planning-organ").value = "HEART";
  get("iot-mode").value = "IOT";
  const view = (csv) => {
    const bytes = new TextEncoder().encode(csv);
    return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  };
  let notify;
  const sent = [];
  const readings = {
    addEventListener: (type, handler) => {
      if (type === "characteristicvaluechanged") notify = handler;
    },
    startNotifications: async () => undefined,
    readValue: async () => view("6.2,1.40,1,0"),
  };
  const commands = {
    writeValueWithResponse: async (bytes) => {
      sent.push(new TextDecoder().decode(bytes));
    },
  };
  const service = {
    getCharacteristic: async (uuid) => uuid.endsWith("3") ? commands : readings,
  };
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
  const actuators = [];
  let chooserCalls = 0;
  const navigator = { bluetooth: { requestDevice: async () => { chooserCalls++; return device; } } };
  vm.runInNewContext(load("public/js/ble-dashboard.js"), {
    window, document: { getElementById: get }, navigator,
    TextDecoder, TextEncoder, Number, Boolean, String, Date,
    renderActuators: (signal) => actuators.push(signal),
    setInterval: () => undefined,
  });

  // Em Wokwi/Simulador: botao escondido e Bluetooth nao solicitado.
  window.lifeBoxBleSetMode(false);
  assert.equal(window.lifeBoxBleIsSelected(), false);
  assert.equal(get("ble-connect-controls").hidden, true);
  assert.equal(chooserCalls, 0);
  // O clique na FONTE exibe o botao, mas NAO abre o seletor nativo.
  window.lifeBoxBleSetMode(true);
  assert.equal(get("ble-connect-controls").hidden, false);
  assert.equal(get("iot-mode").value, "BLE");
  assert.equal(chooserCalls, 0);
  assert.equal(device.gatt.connected, false);
  await get("ble-connect").listeners.click();
  assert.equal(chooserCalls, 1);
  assert.equal(window.lifeBoxBleIsSelected(), true);
  assert.deepEqual(sent, ["HEART"]);
  assert.match(get("ble-organ-status").textContent, /OLED sincronizado: Coração/);
  assert.equal(get("temperature").textContent, "6.2");
  assert.equal(get("impact").textContent, "1.40");
  assert.notEqual(get("humidity").textContent, "--");
  assert.notEqual(get("battery").textContent, "--");
  assert.notEqual(get("signal").textContent, "--");
  assert.match(get("humidity-label").textContent, /SIMULADO/);
  assert.match(get("battery-label").textContent, /SIMULADO/);
  assert.match(get("signal-label").textContent, /SIMULADO/);
  assert.match(get("ble-connect").textContent, /Desconectar ESP32/);

  get("planning-organ").value = "LUNG";
  await window.lifeBoxBleSetOrgan(get("planning-organ").value);
  assert.deepEqual(sent, ["HEART", "LUNG"]);
  assert.match(get("ble-organ-status").textContent, /aguardando confirmação/i);
  // Só temperatura crítica, com pulmão fora da faixa (0–4 °C).
  notify({ target: { value: view("6.2,1.40,1,1") } });
  assert.match(get("temperature-range-status").textContent, /Pulmão.*0–4/);
  assert.equal(get("alert-count").textContent, "1");
  assert.match(get("presentation-alert-title").textContent, /TEMPERATURA CRÍTICA/);
  assert.equal(actuators.at(-1).alertOutput, true);
  assert.equal(actuators.at(-1).buzzerOn, true);
  assert.equal(actuators.at(-1).temperatureCritical, true);
  assert.equal(actuators.at(-1).impactCritical, false);

  // Só impacto crítico: temperatura normal não impede o acionamento.
  notify({ target: { value: view("3.0,4.20,1,1") } });
  assert.equal(get("general-status").textContent, "ALERTA CRÍTICO");
  assert.equal(get("alert-count").textContent, "1");
  assert.match(get("alerts").innerHTML, /IMPACTO CRÍTICO/);
  assert.match(get("presentation-alert-title").textContent, /IMPACTO CRÍTICO/);
  assert.equal(actuators.at(-1).temperatureCritical, false);
  assert.equal(actuators.at(-1).impactCritical, true);
  assert.equal(actuators.at(-1).alertOutput, true);
  assert.equal(actuators.at(-1).ledOn, true);

  // Duas entradas críticas = dois alertas, uma saída de acionamento.
  notify({ target: { value: view("6.2,4.20,1,1") } });
  assert.equal(get("alert-count").textContent, "2");
  assert.match(get("presentation-alert-title").textContent, /TEMPERATURA E IMPACTO CRÍTICOS/);
  assert.equal(actuators.at(-1).alertOutput, true);
  assert.equal(actuators.at(-1).buzzerOn, true);

  // Nenhuma entrada crítica = desligado.
  notify({ target: { value: view("3.0,1.40,1,1") } });
  assert.equal(get("general-status").textContent, "NORMAL");
  assert.equal(get("alert-count").textContent, "0");
  assert.equal(get("presentation-alert").classList.contains("hidden"), true);
  assert.equal(actuators.at(-1).alertOutput, false);
  assert.equal(actuators.at(-1).ledOn, false);
  assert.equal(actuators.at(-1).buzzerOn, false);

  // Mesmo com ambas condições críticas, BOOT pausado desliga tudo.
  notify({ target: { value: view("6.2,4.20,0,1") } });
  assert.equal(get("general-status").textContent, "AGUARDANDO");
  assert.equal(get("alert-count").textContent, "0");
  assert.equal(get("presentation-alert").classList.contains("hidden"), true);
  assert.equal(actuators.at(-1).transportActive, false);
  assert.equal(actuators.at(-1).alertOutput, false);
  assert.equal(actuators.at(-1).ledOn, false);
  assert.equal(actuators.at(-1).buzzerOn, false);

  get("ble-connect").listeners.click();
  assert.equal(device.gatt.connected, false);
  assert.equal(window.lifeBoxBleIsSelected(), true);
  assert.equal(get("iot-mode").value, "BLE");
  assert.equal(get("ble-connect-controls").hidden, false);
  assert.equal(get("temperature").textContent, "--");
  assert.equal(get("humidity").textContent, "--");
  assert.equal(get("battery").textContent, "--");
  assert.equal(get("signal").textContent, "--");

  get("iot-mode").value = "IOT";
  window.lifeBoxBleSetMode(false);
  assert.equal(get("ble-connect-controls").hidden, true);
  assert.equal(get("humidity-label").textContent, "% relativa");
  assert.equal(get("battery-label").textContent, "% disponível");
  assert.equal(get("signal-label").textContent, "% comunicação");
});
