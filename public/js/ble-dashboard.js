// LifeBox - ESP32 fisico via Bluetooth BLE, apenas no navegador.
// Sem POST para API: dados locais nao entram no Render/MySQL.
(() => {
  const SERVICE_UUID = "2d514649-4c65-426f-7820-202600000001";
  const CHARACTERISTIC_UUID = "2d514649-4c65-426f-7820-202600000002";
  const $ble = (id) => document.getElementById(id);
  const state = {
    selected: false, device: null, characteristic: null, reading: null,
    lastSeen: 0, dismissed: null,
    message: "Clique em Conectar para procurar o ESP32 físico.",
  };
  const connected = () => Boolean(state.device && state.device.gatt && state.device.gatt.connected);
  const fresh = () => Boolean(connected() && state.reading && Date.now() - state.lastSeen < 5000);
  window.lifeBoxBleIsSelected = () => state.selected;

  function showOverlay(title, message, key) {
    const overlay = $ble("presentation-alert");
    if (!overlay) return;
    if (!title || state.dismissed === key) {
      overlay.classList.add("hidden");
      return;
    }
    $ble("presentation-alert-title").textContent = title;
    $ble("presentation-alert-message").textContent = message;
    overlay.querySelector("p").textContent = "ALERTA LOCAL · ESP32 FÍSICO";
    overlay.dataset.key = key;
    overlay.classList.remove("hidden");
  }

  function apply() {
    const panel = $ble("physical-ble-panel");
    if (!panel) return;
    panel.hidden = !state.selected;
    if (!state.selected) return;

    const isConnected = connected();
    const hasReading = fresh();
    $ble("ble-connect").disabled = isConnected;
    $ble("ble-disconnect").disabled = !isConnected;
    $ble("ble-connection-status").textContent = hasReading
      ? "Conectado · recebendo valores ao vivo"
      : isConnected ? "Conectado · aguardando leituras" : state.message;
    $ble("esp32-status").textContent = hasReading ? "ESP32 BLE ONLINE" : "ESP32 BLE OFFLINE";
    $ble("esp32-status").classList.toggle("online", hasReading);
    $ble("telemetry-status").textContent = hasReading ? "BLE LOCAL AO VIVO" : "BLE SEM LEITURAS";
    $ble("transport-code").textContent = "CAIXA FÍSICA · LOCAL";
    $ble("temperature").textContent = hasReading ? state.reading.temperature.toFixed(1) : "--";
    $ble("impact").textContent = hasReading ? state.reading.impact.toFixed(2) : "--";
    $ble("humidity").textContent = "--";
    $ble("battery").textContent = "--";
    $ble("signal").textContent = "--";
    $ble("impact-label").textContent = hasReading ? "Impacto simulado da caixa" : "Aguardando BLE";
    $ble("temperature-range-status").textContent = "Coração · faixa didática 4–8 °C (caixa física)";

    const tempCritical = Boolean(hasReading && (state.reading.temperature < 4 || state.reading.temperature > 8));
    const impactCritical = Boolean(hasReading && state.reading.impact >= 3.5);
    const transportActive = Boolean(hasReading && state.reading.transportActive);
    const alarm = transportActive && (tempCritical || impactCritical);
    $ble("temperature-card").classList.toggle("temperature-out-of-range", tempCritical);
    if (typeof renderActuators === "function") {
      renderActuators({
        transportActive, temperatureCritical: tempCritical, impactCritical,
        alertOutput: alarm, ledOn: alarm, buzzerOn: alarm,
      });
    }
    const badge = $ble("general-status");
    badge.textContent = !hasReading ? "AGUARDANDO BLE"
      : !transportActive ? "AGUARDANDO" : alarm ? "ALERTA CRÍTICO" : "NORMAL";
    badge.className = "status-badge " + (alarm ? "critical" : "normal");

    const messages = [];
    if (transportActive && tempCritical) {
      messages.push("Temperatura fora da faixa: " + state.reading.temperature.toFixed(1) + " °C (referência 4–8 °C).");
    }
    if (transportActive && impactCritical) {
      messages.push("Impacto crítico: " + state.reading.impact.toFixed(2) + " g (limite ≥ 3,5 g).");
    }
    $ble("alert-count").textContent = String(messages.length);
    $ble("alerts").className = "scroll-list";
    $ble("alerts").innerHTML = messages.length
      ? messages.map((message) => '<div class="alert-item severity-CRITICO"><i class="alert-icon"></i><div><strong>ALERTA LOCAL BLE</strong><p>' + message + '</p><time>Não salvo na nuvem</time></div></div>').join("")
      : '<div class="empty">' + (!hasReading ? "Sem dados Bluetooth atuais." : !transportActive ? "Transporte pausado pelo BOOT." : "Nenhum alerta físico BLE.") + '</div>';

    if (!alarm) {
      state.dismissed = null;
      showOverlay(null, "", "");
      return;
    }
    const key = "ble-" + Number(tempCritical) + "-" + Number(impactCritical);
    const title = tempCritical && impactCritical ? "⚠ TEMPERATURA E IMPACTO CRÍTICOS"
      : tempCritical ? "⚠ TEMPERATURA CRÍTICA" : "⚠ IMPACTO CRÍTICO";
    showOverlay(title, messages.join("\n"), key);
  }

  function receive(value) {
    const csv = new TextDecoder().decode(value).trim().split(",");
    if (csv.length < 2) return;
    const temperature = Number(csv[0]);
    const impact = Number(csv[1]);
    if (!Number.isFinite(temperature) || !Number.isFinite(impact) ||
        temperature < -10 || temperature > 25 || impact < 0 || impact > 10) return;
    const transportActive = csv.length >= 3 ? csv[2] === "1" : true;
    state.reading = { temperature, impact, transportActive };
    state.lastSeen = Date.now();
    state.message = "Bluetooth conectado";
    apply();
  }

  function disconnected() {
    state.characteristic = null;
    state.reading = null;
    state.lastSeen = 0;
    state.message = "Desconectado. Clique em Conectar para tentar novamente.";
    apply();
  }

  async function connect() {
    if (!state.selected) return;
    if (!navigator.bluetooth) {
      state.message = "Web Bluetooth indisponível. Use Chrome/Edge no notebook com HTTPS.";
      apply();
      return;
    }
    state.message = "Procurando LifeBox BLE...";
    apply();
    try {
      // requestDevice chamado diretamente pelo clique do usuario.
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: "LifeBox" }],
        optionalServices: [SERVICE_UUID],
      });
      state.device = device;
      device.addEventListener("gattserverdisconnected", disconnected);
      state.message = "Conectando ao ESP32...";
      apply();
      const gatt = await device.gatt.connect();
      const service = await gatt.getPrimaryService(SERVICE_UUID);
      const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);
      state.characteristic = characteristic;
      characteristic.addEventListener("characteristicvaluechanged", (event) => receive(event.target.value));
      await characteristic.startNotifications();
      receive(await characteristic.readValue());
    } catch (error) {
      if (state.device && state.device.gatt && state.device.gatt.connected) state.device.gatt.disconnect();
      state.device = null;
      disconnected();
      state.message = "Falha na conexão: " + (error.message || String(error));
      apply();
    }
  }

  function disconnect() {
    if (connected()) state.device.gatt.disconnect();
    state.device = null;
    state.reading = null;
    state.lastSeen = 0;
    state.dismissed = null;
    state.message = "Desconectado pelo usuário.";
    apply();
  }
  window.lifeBoxBleSetMode = (selected) => {
    if (!selected) disconnect();
    state.selected = Boolean(selected);
    if (selected) {
      state.message = "Clique em Conectar para procurar o ESP32 físico.";
      const select = $ble("iot-mode");
      if (select) select.value = "BLE";
      if (typeof syncSourceSelector === "function") syncSourceSelector();
    } else {
      const overlay = $ble("presentation-alert");
      if (overlay) overlay.classList.add("hidden");
    }
    apply();
  };
  window.lifeBoxBleApply = apply;
  $ble("ble-connect").addEventListener("click", connect);
  $ble("ble-disconnect").addEventListener("click", disconnect);
  $ble("dismiss-presentation-alert").addEventListener("click", () => {
    if (state.selected) state.dismissed = $ble("presentation-alert").dataset.key || null;
  });
  setInterval(() => { if (state.selected) apply(); }, 1500);
})();
