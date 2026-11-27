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
    pendingTransport: null, pendingSince: 0, commandError: null,
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

  async function commandTransport(action) {
    if (!state.selected) throw new Error("Selecione ESP32 FÍSICO em FONTE.");
    if (!connected() || !fresh() || !state.commandCharacteristic)
      throw new Error("Conecte o ESP32 físico antes de iniciar ou pausar.");
    if (state.reading.protocolVersion < 2)
      throw new Error("Firmware BLE antigo. Regrave a versão com comandos START/PAUSE e impacto.");
    const command = action === "start" || action === "resume"
      ? "START" : ["stop", "reset", "finish"].includes(action) ? "PAUSE" : null;
    if (!command) throw new Error("Comando de transporte físico inválido.");
    state.pendingTransport = command;
    state.pendingSince = Date.now();
    state.commandError = null;
    apply();
    try {
      // WRITE indica recebimento da escrita GATT, mas a confirmação do estado
      // só vem pela notificação de telemetria do ESP32.
      await state.commandCharacteristic.writeValueWithResponse(
        new TextEncoder().encode(command),
      );
      return "Comando " + (command === "START" ? "INICIAR" : "PAUSAR") +
        " enviado. Aguardando confirmação do ESP32 físico.";
    } catch (error) {
      state.pendingTransport = null;
      state.pendingSince = 0;
      state.commandError = "Falha ao enviar comando ao ESP32.";
      apply();
      throw error;
    }
  }
  window.lifeBoxBleCommandTransport = commandTransport;

  function apply() {
    if (state.pendingTransport && Date.now() - state.pendingSince > 5000) {
      state.pendingTransport = null;
      state.pendingSince = 0;
      state.commandError = "ESP32 não confirmou o comando. Verifique o Monitor Serial e o firmware.";
    }
    const controls = $ble("ble-connect-controls");
    if (!controls) return;
    // O botao aparece EXCLUSIVAMENTE ao selecionar ESP32 FISICO em FONTE.
    controls.hidden = !state.selected;
    if (!state.selected) {
      $ble("ble-organ-status").textContent = "";
      return;
    }

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
    $ble("impact-label").textContent = !hasReading
      ? "Aguardando BLE"
      : state.reading.impact >= 3.5
        ? "Impacto crítico · limite ≥ 3,5 g"
        : "Impacto normal · limite 3,5 g";
    const confirmedProfile = hasReading ? findProfile(state.reading.organCode) : null;
    const requested = requestedProfile();
    $ble("ble-organ-status").textContent = state.commandError
      ? state.commandError : !isConnected
      ? (state.connecting ? "Conectando ao ESP32..." : (state.message.startsWith("Falha") ? state.message : "Bluetooth desconectado"))
      : !hasReading
        ? "Conectado · aguardando telemetria"
        : state.reading.protocolVersion < 2
          ? "ATUALIZE O FIRMWARE: versão antiga não sincroniza Iniciar/Pausar nem o impacto físico."
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
    const updatedFirmware = Boolean(hasReading && state.reading.protocolVersion >= 2);
    // O display sempre reflete o bit de ativo recebido do ESP32, nunca
    // o status da simulacao logistica que usa a API.
    const startButton = document.querySelector('[data-action="start"]');
    const pauseButton = document.querySelector('[data-action="stop"]');
    const simulationStatus = $ble("sim-status");
    if (startButton) {
      startButton.disabled = !updatedFirmware || transportActive ||
        Boolean(state.pendingTransport);
      startButton.textContent = "▶ INICIAR TRANSPORTE";
    }
    if (pauseButton) {
      pauseButton.disabled = !updatedFirmware || !transportActive ||
        Boolean(state.pendingTransport);
      pauseButton.textContent = "Ⅱ PAUSAR TRANSPORTE";
    }
    if (simulationStatus) {
      simulationStatus.textContent = !hasReading ? "Preparado"
        : !updatedFirmware ? "Atualizar firmware BLE"
        : state.pendingTransport ? "Confirmando comando..."
        : transportActive ? "Executando" : "Pausado";
    }
    // Mesmo circuito logico do ESP32: ATIVO AND (TEMP_CRITICA OR IMPACTO_CRITICO).
    const alarm = transportActive && (tempCritical || impactCritical);
    $ble("temperature-card").classList.toggle("temperature-out-of-range", tempCritical);
    if (typeof renderActuators === "function") {
      renderActuators({
        transportActive, temperatureCritical: tempCritical, impactCritical,
        alertOutput: alarm, ledOn: alarm, buzzerOn: alarm,
      });
    }
    const formula = $ble("digital-logic-formula");
    if (formula) formula.textContent = "ATIVO AND (TEMP_CRÍTICA OR IMPACTO_CRÍTICO)";
    const note = $ble("actuators-rule-note");
    if (note) note.textContent = "ESP32 físico · BLE: LED vermelho e buzzer ligam se o transporte estiver ativo E (temperatura fora da faixa do órgão OU impacto ≥ 3,5 g). Botão BOOT pausa os atuadores.";
    const badge = $ble("general-status");
    badge.textContent = !hasReading || !confirmedProfile ? "AGUARDANDO BLE"
      : !transportActive ? "AGUARDANDO" : alarm ? "ALERTA CRÍTICO" : "NORMAL";
    badge.className = "status-badge " + (alarm ? "critical" : "normal");

    const messages = [];
    if (transportActive && tempCritical && confirmedProfile) {
      messages.push({
        type: "TEMPERATURA CRÍTICA",
        detail: "Temperatura fora da faixa: " + state.reading.temperature.toFixed(1) +
          " °C (órgão " + confirmedProfile.name +
          ", referência " + confirmedProfile.min + "–" + confirmedProfile.max + " °C).",
      });
    }
    if (transportActive && impactCritical) {
      messages.push({
        type: "IMPACTO CRÍTICO",
        detail: "Impacto detectado: " + state.reading.impact.toFixed(2) +
          " g (limite demonstrativo ≥ 3,5 g).",
      });
    }
    $ble("alert-count").textContent = String(messages.length);
    $ble("alerts").className = "scroll-list";
    $ble("alerts").innerHTML = messages.length
      ? messages.map((item) =>
        '<div class="alert-item severity-CRITICO"><i class="alert-icon"></i><div><strong>' +
        item.type + ' · BLE</strong><p>' + item.detail +
        '</p><time>Alerta local · não salvo na nuvem</time></div></div>',
      ).join("")
      : '<div class="empty">' + (!hasReading ? "Sem dados Bluetooth atuais."
        : !transportActive ? "Transporte pausado pelo BOOT."
        : "Nenhum alerta crítico na caixa.") + '</div>';

    if (!alarm) {
      state.dismissed = null;
      showOverlay(null, "", "");
      return;
    }
    const key = "ble-" + (confirmedProfile?.code || "SEM-PERFIL") +
      "-" + Number(tempCritical) + "-" + Number(impactCritical);
    const title = tempCritical && impactCritical
      ? "⚠ TEMPERATURA E IMPACTO CRÍTICOS"
      : tempCritical ? "⚠ TEMPERATURA CRÍTICA" : "⚠ IMPACTO CRÍTICO";
    showOverlay(title, messages.map((item) => item.detail).join("\n"), key);
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
    const protocolVersion = csv.length >= 5 ? Number(csv[4]) : 1;
    state.reading = { temperature, impact, transportActive, organCode, protocolVersion };
    if (state.pendingTransport === "START" && transportActive ||
        state.pendingTransport === "PAUSE" && !transportActive) {
      state.pendingTransport = null;
      state.pendingSince = 0;
      state.commandError = null;
    }
    state.lastSeen = Date.now();
    if (!state.simulationStart) state.simulationStart = Date.now();
    state.message = "Bluetooth conectado";
    apply();
  }

  function disconnected() {
    state.characteristic = null;
    state.commandCharacteristic = null;
    state.connecting = false;
    state.pendingTransport = null;
    state.pendingSince = 0;
    state.commandError = null;
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
      // Se o firmware fisico ainda for antigo, a interface informa o usuario
      // e nao afirma que os botoes de transporte estao sincronizados.
      if (state.reading?.protocolVersion >= 2) {
        await setOrgan($ble("planning-organ")?.value || state.desiredOrgan);
      }
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
    state.pendingTransport = null;
    state.pendingSince = 0;
    state.commandError = null;
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
