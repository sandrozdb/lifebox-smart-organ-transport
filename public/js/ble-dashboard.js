// LifeBox - ESP32 fisico via Bluetooth BLE, apenas no navegador.
// Sem POST para API: dados locais nao entram no Render/MySQL.
(() => {
  const SERVICE_UUID = "2d514649-4c65-426f-7820-202600000001";
  const CHARACTERISTIC_UUID = "2d514649-4c65-426f-7820-202600000002";
  const COMMAND_UUID = "2d514649-4c65-426f-7820-202600000003";
  // Mesmos limites academicos dos perfis do backend, sem depender de API no BLE.
  const PROFILES = [
    { code: "HEART", name: "Coração", min: 4, max: 8 },
    { code: "LUNG", name: "Pulmão", min: 0, max: 4 },
    { code: "KIDNEY", name: "Rim", min: 0, max: 4 },
    { code: "LIVER", name: "Fígado", min: 0, max: 4 },
    { code: "PANCREAS", name: "Pâncreas", min: 0, max: 4 },
    { code: "INTESTINE", name: "Intestino", min: 0, max: 4 },
  ];
  const findProfile = (code) => PROFILES.find((profile) => profile.code === code);
  const $ble = (id) => document.getElementById(id);
  const state = {
    selected: false, device: null, characteristic: null, commandCharacteristic: null,
    reading: null, desiredOrgan: "HEART", connecting: false, simulationStart: 0,
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

  function requestedProfile() {
    return findProfile(state.desiredOrgan) || PROFILES[0];
  }

  async function setOrgan(code) {
    if (!findProfile(code)) throw new Error("Órgão BLE inválido.");
    state.desiredOrgan = code;
    state.dismissed = null;
    apply();
    if (!state.selected || !connected() || !state.commandCharacteristic) return false;
    // Somente BLE GATT; não é um comando ao servidor do Render.
    await state.commandCharacteristic.writeValueWithResponse(
      new TextEncoder().encode(code),
    );
    apply(); // A confirmação vem do indice de perfil na proxima notificacao.
    return true;
  }

  window.lifeBoxBleSetOrgan = setOrgan;

  function apply() {
    const controls = $ble("ble-connect-controls");
    if (!controls) return;
    // O botao aparece EXCLUSIVAMENTE ao selecionar ESP32 FISICO em FONTE.
    controls.hidden = !state.selected;
    if (!state.selected) return;

    const isConnected = connected();
    const hasReading = fresh();
    const connectButton = $ble("ble-connect");
    connectButton.disabled = state.connecting;
    connectButton.textContent = state.connecting
      ? "Conectando..." : isConnected ? "Desconectar ESP32 físico" : "Conectar ESP32 físico";
    $ble("esp32-status").textContent = hasReading ? "ESP32 BLE ONLINE" : "ESP32 BLE OFFLINE";
    $ble("esp32-status").classList.toggle("online", hasReading);
    $ble("telemetry-status").textContent = hasReading ? "BLE LOCAL AO VIVO" : "BLE SEM LEITURAS";
    $ble("transport-code").textContent = "CAIXA FÍSICA · LOCAL";
    $ble("temperature").textContent = hasReading ? state.reading.temperature.toFixed(1) : "--";
    $ble("impact").textContent = hasReading ? state.reading.impact.toFixed(2) : "--";
    // Valores demonstrativos sinteticos: NAO recebidos do ESP32 e NAO
    // salvos na API. Atualizam em funcao do tempo para a apresentacao.
    const seconds = hasReading && state.simulationStart
      ? (Date.now() - state.simulationStart) / 1000 : 0;
    const humidity = 63 + 1.5 * Math.sin(seconds / 12);
    const battery = Math.max(75, 95 - seconds / 1800);
    const signal = 91 + 3 * Math.sin(seconds / 9);
    $ble("humidity").textContent = hasReading ? humidity.toFixed(1) : "--";
    $ble("battery").textContent = hasReading ? battery.toFixed(0) : "--";
    $ble("signal").textContent = hasReading ? signal.toFixed(0) : "--";
    for (const [id, label] of [
      ["humidity-label", "SIMULADO · % relativa"],
      ["battery-label", "SIMULADO · % disponível"],
      ["signal-label", "SIMULADO · % comunicação"],
    ]) {
      const target = $ble(id);
      if (target) {
        target.textContent = label;
        target.classList.add("ble-simulated-label");
      }
    }
    $ble("impact-label").textContent = hasReading
      ? "Potenciômetro físico · BLE" : "Aguardando BLE";
    const confirmedProfile = hasReading ? findProfile(state.reading.organCode) : null;
    const requested = requestedProfile();
    $ble("ble-organ-status").textContent = !isConnected
      ? (state.connecting ? "Conectando ao ESP32..." : (state.message.startsWith("Falha") ? state.message : "Bluetooth desconectado"))
      : !hasReading
        ? "Conectado · aguardando telemetria"
        : !confirmedProfile
          ? "Regrave o firmware BLE com seleção de órgãos."
          : confirmedProfile.code !== requested.code
            ? "Enviando " + requested.name + " ao OLED..."
            : "OLED sincronizado: " + confirmedProfile.name + " · " +
              confirmedProfile.min + "–" + confirmedProfile.max + " °C";
    $ble("temperature-range-status").textContent = confirmedProfile
      ? confirmedProfile.name + " · faixa acadêmica " + confirmedProfile.min + "–" + confirmedProfile.max + " °C"
      : "Faixa do órgão aguardando confirmação BLE";

    const tempCritical = Boolean(
      hasReading && confirmedProfile &&
      (state.reading.temperature < confirmedProfile.min ||
       state.reading.temperature > confirmedProfile.max),
    );
    const impactCritical = Boolean(hasReading && state.reading.impact >= 3.5);
    const transportActive = Boolean(hasReading && state.reading.transportActive);
    // Unica condicao de acionamento: temperatura FORA da faixa do perfil.
    const alarm = transportActive && tempCritical;
    $ble("temperature-card").classList.toggle("temperature-out-of-range", tempCritical);
    if (typeof renderActuators === "function") {
      renderActuators({
        transportActive, temperatureCritical: tempCritical, impactCritical,
        alertOutput: alarm, ledOn: alarm, buzzerOn: alarm,
      });
    }
    const formula = $ble("digital-logic-formula");
    if (formula) formula.textContent = "ATIVO AND TEMP_FORA_DA_FAIXA";
    const note = $ble("actuators-rule-note");
    if (note) note.textContent = "ESP32 físico por BLE: LED vermelho e buzzer só ligam se a temperatura estiver fora da faixa do órgão. Impacto é informativo.";
    const badge = $ble("general-status");
    badge.textContent = !hasReading || !confirmedProfile ? "AGUARDANDO BLE"
      : !transportActive ? "AGUARDANDO" : alarm ? "ALERTA CRÍTICO" : "NORMAL";
    badge.className = "status-badge " + (alarm ? "critical" : "normal");

    const messages = [];
    if (transportActive && tempCritical && confirmedProfile) {
      messages.push(
        "Temperatura fora da faixa: " + state.reading.temperature.toFixed(1) +
        " °C (órgão " + confirmedProfile.name +
        ", referência " + confirmedProfile.min + "–" + confirmedProfile.max + " °C).",
      );
    }
    const impactNote = transportActive && impactCritical
      ? '<div class="alert-item"><i class="alert-icon"></i><div><strong>IMPACTO ELEVADO · INFORMATIVO</strong><p>' +
        state.reading.impact.toFixed(2) +
        ' g; não aciona os atuadores nesta configuração.</p></div></div>'
      : "";
    $ble("alert-count").textContent = String(messages.length);
    $ble("alerts").className = "scroll-list";
    $ble("alerts").innerHTML = (messages.length
      ? messages.map((message) => '<div class="alert-item severity-CRITICO"><i class="alert-icon"></i><div><strong>ALERTA TÉRMICO BLE</strong><p>' + message + '</p><time>Não salvo na nuvem</time></div></div>').join("")
      : '<div class="empty">' + (!hasReading ? "Sem dados Bluetooth atuais." : !transportActive ? "Transporte pausado pelo BOOT." : "Nenhum alerta térmico na caixa.") + '</div>') + impactNote;

    if (!alarm) {
      state.dismissed = null;
      showOverlay(null, "", "");
      return;
    }
    const key = "ble-" + confirmedProfile.code + "-" + Number(tempCritical);
    showOverlay("⚠ TEMPERATURA FORA DA FAIXA", messages.join("\n"), key);
  }

  function receive(value) {
    const csv = new TextDecoder().decode(value).trim().split(",");
    if (csv.length < 2) return;
    const temperature = Number(csv[0]);
    const impact = Number(csv[1]);
    if (!Number.isFinite(temperature) || !Number.isFinite(impact) ||
        temperature < -10 || temperature > 25 || impact < 0 || impact > 10) return;
    const transportActive = csv.length >= 3 ? csv[2] === "1" : true;
    // A quarta coluna confirma qual perfil esta efetivamente no OLED.
    const organIndex = csv.length >= 4 ? Number(csv[3]) : -1;
    const organCode = Number.isInteger(organIndex) && PROFILES[organIndex]
      ? PROFILES[organIndex].code : null;
    state.reading = { temperature, impact, transportActive, organCode };
    state.lastSeen = Date.now();
    if (!state.simulationStart) state.simulationStart = Date.now();
    state.message = "Bluetooth conectado";
    apply();
  }

  function disconnected() {
    state.characteristic = null;
    state.commandCharacteristic = null;
    state.connecting = false;
    state.simulationStart = 0;
    state.reading = null;
    state.lastSeen = 0;
    state.message = "Desconectado. Clique em Conectar para tentar novamente.";
    apply();
  }

  async function connect() {
    if (!state.selected || state.connecting || connected()) return;
    if (!navigator.bluetooth) {
      state.message = "Web Bluetooth indisponível. Use Chrome/Edge no notebook com HTTPS.";
      apply();
      return;
    }
    state.connecting = true;
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
      const commandCharacteristic = await service.getCharacteristic(COMMAND_UUID);
      state.characteristic = characteristic;
      state.commandCharacteristic = commandCharacteristic;
      characteristic.addEventListener("characteristicvaluechanged", (event) => receive(event.target.value));
      await characteristic.startNotifications();
      receive(await characteristic.readValue());
      // Usa SEMPRE a escolha existente no planejamento, nao outro seletor.
      await setOrgan($ble("planning-organ")?.value || state.desiredOrgan);
      state.connecting = false;
      apply();
    } catch (error) {
      if (state.device && state.device.gatt && state.device.gatt.connected) state.device.gatt.disconnect();
      state.device = null;
      disconnected();
      state.message = "Falha na conexão: " + (error.message || String(error));
      state.connecting = false;
      apply();
    }
  }

  function disconnect() {
    if (connected()) state.device.gatt.disconnect();
    state.device = null;
    state.reading = null;
    state.lastSeen = 0;
    state.simulationStart = 0;
    state.connecting = false;
    state.dismissed = null;
    state.message = "Desconectado pelo usuário.";
    apply();
  }
  window.lifeBoxBleSetMode = (selected) => {
    if (!selected) disconnect();
    state.selected = Boolean(selected);
    if (selected) {
      const planningCode = $ble("planning-organ")?.value;
      if (findProfile(planningCode)) state.desiredOrgan = planningCode;
      state.message = "Clique em Conectar para procurar o ESP32 físico.";
      const select = $ble("iot-mode");
      if (select) select.value = "BLE";
      if (typeof syncSourceSelector === "function") syncSourceSelector();
    } else {
      const overlay = $ble("presentation-alert");
      if (overlay) overlay.classList.add("hidden");
      const formula = $ble("digital-logic-formula");
      if (formula) formula.textContent = "ATIVO AND (TEMP_CRÍTICA OR IMPACTO_CRÍTICO)";
      const note = $ble("actuators-rule-note");
      if (note) note.textContent = "Umidade, bateria, sinal, atraso e reotimização são alertas operacionais e não acionam LED e buzzer.";
      const labels = {
        "humidity-label": "% relativa",
        "battery-label": "% disponível",
        "signal-label": "% comunicação",
      };
      for (const [id, text] of Object.entries(labels)) {
        const element = $ble(id);
        if (element) {
          element.textContent = text;
          element.classList.remove("ble-simulated-label");
        }
      }
    }
    apply();
  };
  window.lifeBoxBleApply = apply;
  $ble("ble-connect").addEventListener("click", () => {
    if (!state.selected) return;
    // Desconectar nao muda a fonte: mantem o botao visivel para reconectar.
    if (connected()) return disconnect();
    // A janela Bluetooth abre somente pelo clique neste botao, nunca pela fonte.
    return connect();
  });
  $ble("dismiss-presentation-alert").addEventListener("click", () => {
    if (state.selected) state.dismissed = $ble("presentation-alert").dataset.key || null;
  });
  setInterval(() => { if (state.selected) apply(); }, 1500);
})();
