const $ = (selector) => document.querySelector(selector);
let transportId = 1,
  map,
  layers = {},
  trackingAnimationFrame,
  trackingPathLength = 0,
  dismissedOverlayKey = null,
  lastMetricReading = null,
  activeTemperatureOrgan = null;
const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(
        new Date(
          String(value).includes("T") ? value : String(value).replace(" ", "T"),
        ),
      )
    : "--";
const formatMinutes = (value) => {
  const minutes = Math.max(0, Math.floor(Number(value) || 0)),
    hours = Math.floor(minutes / 60),
    rest = minutes % 60;
  return hours
    ? `${hours}h ${rest.toString().padStart(2, "0")}min`
    : `${rest} min`;
};
const formatHoursMinutes = (value) => {
  const totalMinutes = Math.max(0, Math.round(Number(value) || 0)),
    hours = Math.floor(totalMinutes / 60),
    minutes = totalMinutes % 60;
  return hours
    ? `${hours}h${minutes.toString().padStart(2, "0")}min`
    : `${minutes}min`;
};
async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.erro || "Falha na operação");
  return data;
}
function statusVisual(status) {
  const critical = status === "CRITICO",
    attention = status === "ATENCAO",
    element = $("#general-status");
  element.textContent = critical
    ? "ALERTA CRÍTICO"
    : attention
      ? "ATENÇÃO"
      : status === "CONCLUIDO"
        ? "CONCLUÍDO"
        : "NORMAL";
  element.className = `status-badge ${critical ? "critical" : attention ? "attention" : "normal"}`;
}
function renderTemperatureRange(reading, organ) {
  const card = $("#temperature-card"),
    detail = $("#temperature-range-status"),
    state = window.lifeBoxTemperatureRangeState?.(reading?.temperatura, organ);
  card?.classList.toggle(
    "temperature-out-of-range",
    Boolean(state && state.position !== "within"),
  );
  const range = organ?.referenceRangeC || organ?.preservation?.referenceRangeC;
  if (detail)
    detail.textContent =
      state?.text ||
      (range
        ? `Faixa de referência · ${organ.name} ${range.join("–")} °C`
        : "Faixa térmica aguardando perfil");
}
function updateMetrics(reading, transport, organ = activeTemperatureOrgan) {
  if (!reading) return;
  lastMetricReading = reading;
  activeTemperatureOrgan = organ || activeTemperatureOrgan;
  $("#temperature").textContent = Number(reading.temperatura).toFixed(1);
  renderTemperatureRange(reading, activeTemperatureOrgan);
  $("#humidity").textContent = Number(reading.umidade).toFixed(1);
  $("#impact").textContent = Number(reading.impacto).toFixed(2);
  // Destaque vermelho para impacto critico, igual ao card de temperatura.
  $("#impact-card").classList.toggle(
    "impact-critical",
    Number(reading.impacto) >= 3.5,
  );
  $("#impact-label").textContent =
    reading.impacto >= 1.8 ? "Ocorrência detectada" : "Movimento normal";
  $("#battery").textContent = Number(reading.bateria).toFixed(0);
  $("#signal").textContent = Number(reading.sinal).toFixed(0);
  statusVisual(transport.status);
}
window.lifeBoxUpdateTemperatureProfile = (organ) => {
  activeTemperatureOrgan = organ;
  renderTemperatureRange(lastMetricReading, organ);
};
function updateExecutionMetrics(tracking) {
  const minutes = Math.max(
      0,
      Math.floor(Number(tracking.transportElapsedMinutes || 0)),
    ),
    hours = Math.floor(minutes / 60),
    rest = minutes % 60;
  const formattedTime = hours
    ? `${hours}h ${rest.toString().padStart(2, "0")}min`
    : `${rest} min`;
  $("#elapsed").textContent = formattedTime;
  if (tracking.ischemiaTotalMinutes === undefined) return;
  const ischemia = Math.max(
      0,
      Math.floor(Number(tracking.ischemiaTotalMinutes)),
    ),
    maximum = Math.floor(Number(tracking.maximumIschemiaMinutes));
  const margin = Math.floor(Number(tracking.remainingMarginMinutes)),
    safety = Number(tracking.operationalSafetyMarginMinutes || 0);
  $("#simulated-transport-time").textContent =
    `TEMPO DE TRANSPORTE ${formattedTime}`;
  $("#simulated-ischemia").textContent =
    `ISQUEMIA TOTAL ${ischemia} / ${maximum} min`;
  $("#simulated-margin").textContent = `MARGEM RESTANTE ${margin} min`;
  const card = $("#ischemia-card");
  $("#ischemia").textContent = `${ischemia} / ${maximum} min`;
  $("#ischemia-detail").textContent = `Margem: ${margin} min`;
  card.classList.toggle("attention", margin >= 0 && margin < safety);
  card.classList.toggle("critical", margin < 0);
}
function drawCharts(readings) {
  const data = [...readings].reverse().slice(-40);
  LifeBoxCharts.draw(
    $("#chart-temperature"),
    data.map((item) => Number(item.temperatura)),
    "#72a7c4",
  );
  LifeBoxCharts.draw(
    $("#chart-humidity"),
    data.map((item) => Number(item.umidade)),
    "#49a7ff",
  );
  LifeBoxCharts.draw(
    $("#chart-impact"),
    data.map((item) => Number(item.impacto)),
    "#ff5367",
  );
  LifeBoxCharts.draw(
    $("#chart-battery"),
    data.map((item) => Number(item.bateria)),
    "#38da8a",
  );
}
function createTrackingMarker(position) {
  return L.marker(position, {
    icon: L.divIcon({
      className: "lifebox-tracking-marker",
      html: '<span class="tracking-cursor" aria-hidden="true"></span>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -12],
    }),
    title: "LifeBox em deslocamento",
    alt: "Localização atual da LifeBox",
    zIndexOffset: 1200,
  })
    .addTo(map)
    .bindPopup("LifeBox simulada");
}
function createEndpointMarker(position, type) {
  const destination = type === "destination";
  return L.marker(position, {
    icon: L.divIcon({
      className: `route-pin-marker route-${type}`,
      html: `<svg class="route-pin" viewBox="0 0 24 34" aria-hidden="true"><path d="M12 1C5.9 1 1 5.9 1 12c0 8.2 11 21 11 21s11-12.8 11-21C23 5.9 18.1 1 12 1Z"/><circle cx="12" cy="12" r="4"/></svg>`,
      iconSize: [24, 34],
      iconAnchor: [12, 33],
      popupAnchor: [0, -30],
    }),
    title: destination ? "Destino" : "Origem",
    alt: destination ? "Ponto de destino" : "Ponto de origem",
    riseOnHover: true,
  });
}
function createFacilityMarker(position, type) {
  return L.marker(position, {
    icon: L.divIcon({
      className: `route-pin-marker route-facility route-facility-${type}`,
      html: `<svg class="route-pin" viewBox="0 0 24 34" aria-hidden="true"><path d="M12 1C5.9 1 1 5.9 1 12c0 8.2 11 21 11 21s11-12.8 11-21C23 5.9 18.1 1 12 1Z"/><circle cx="12" cy="12" r="4"/></svg>`,
      iconSize: [22, 31],
      iconAnchor: [11, 30],
      popupAnchor: [0, -27],
    }),
    title: type === "airport" ? "Aeroporto" : "Heliponto",
    alt:
      type === "airport"
        ? "Infraestrutura aeroportuária"
        : "Infraestrutura de heliponto",
    riseOnHover: true,
  });
}
function pointAlongRoute(points, progress) {
  if (points.length < 2) return points[0];
  const lengths = points.slice(1).map((point, index) => {
    const previous = points[index];
    return Math.hypot(point.lat - previous.lat, point.lng - previous.lng);
  });
  const total = lengths.reduce((sum, length) => sum + length, 0);
  if (!total) return points.at(-1);
  let distance = total * progress;
  for (let index = 0; index < lengths.length; index += 1) {
    if (distance <= lengths[index] || index === lengths.length - 1) {
      const segmentProgress = lengths[index]
        ? Math.min(1, distance / lengths[index])
        : 1;
      return L.latLng(
        points[index].lat +
          (points[index + 1].lat - points[index].lat) * segmentProgress,
        points[index].lng +
          (points[index + 1].lng - points[index].lng) * segmentProgress,
      );
    }
    distance -= lengths[index];
  }
  return points.at(-1);
}
function animateTrackingMarker(position, path = []) {
  const target = L.latLng(position[0], position[1]);
  const traveledPath = path.map((point) =>
    L.latLng(point.latitude, point.longitude),
  );
  if (!layers.current) {
    layers.current = createTrackingMarker(position);
    trackingPathLength = traveledPath.length;
    return;
  }

  if (trackingAnimationFrame) cancelAnimationFrame(trackingAnimationFrame);
  const start = layers.current.getLatLng();
  const unchanged = start.equals(target, 1e-9);
  if (unchanged) {
    trackingPathLength = traveledPath.length;
    return;
  }

  const durationMs = 1600;
  const startedAt = performance.now();
  const newlyTraveled = traveledPath.slice(Math.max(0, trackingPathLength - 1));
  const animationRoute = [
    start,
    ...newlyTraveled.filter(
      (point, index) => index > 0 || !point.equals(start, 1e-9),
    ),
  ];
  if (!animationRoute.at(-1).equals(target, 1e-9)) animationRoute.push(target);
  trackingPathLength = traveledPath.length;
  const frame = (now) => {
    const progress = Math.min(1, (now - startedAt) / durationMs);
    const current = pointAlongRoute(animationRoute, progress);
    layers.current.setLatLng(current);
    if (progress < 1) trackingAnimationFrame = requestAnimationFrame(frame);
    else trackingAnimationFrame = null;
  };
  trackingAnimationFrame = requestAnimationFrame(frame);
}
function initMap(tracking) {
  if (!window.L || map) return;
  const origin = tracking.origin,
    destination = tracking.destination;
  map = L.map("map", { zoomControl: true }).setView(
    [origin.latitude, origin.longitude],
    8,
  );
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap",
    maxZoom: 19,
  }).addTo(map);
  layers.path = L.polyline([], {
    opacity: 0,
    interactive: false,
  }).addTo(map);
  layers.current = createTrackingMarker([origin.latitude, origin.longitude]);
  layers.origin = createEndpointMarker(
    [origin.latitude, origin.longitude],
    "origin",
  )
    .addTo(map)
    .bindPopup(`Origem: ${origin.name}`);
  layers.destination = createEndpointMarker(
    [destination.latitude, destination.longitude],
    "destination",
  )
    .addTo(map)
    .bindPopup(`Destino: ${destination.name}`);
  map.fitBounds(
    L.latLngBounds([
      [origin.latitude, origin.longitude],
      [destination.latitude, destination.longitude],
    ]),
    { padding: [20, 20] },
  );
}
// Quando os sensores sao locais (BLE), nao existe GPS enviado pela caixa.
// O motor de Pesquisa Operacional gera a posicao/porcentagem simuladas do
// percurso. Nunca usar a ultima posicao 0% salva no banco neste modo.
function trackingFromBleLogistics(tracking, logistics) {
  if (!logistics || !Number.isFinite(Number(logistics.totalProgress)))
    return tracking;
  const progressPercent = Math.min(100,
    Math.max(0, Number(logistics.totalProgress) * 100));
  return {
    ...tracking,
    ...logistics,
    // O motor devolve totalProgress em 0..1; a UI usa progress em 0..100.
    progress: progressPercent,
    current: logistics.currentPosition || tracking.current,
    path: logistics.traveledPath || tracking.path || [],
    origin: logistics.origin || tracking.origin,
    destination: logistics.destination || tracking.destination,
    currentSegment: logistics.currentSegment || null,
    segmentIndex: Number(logistics.currentSegmentIndex) || 0,
    totalSegments: logistics.segments?.length || 0,
    routeName: logistics.planName || tracking.routeName || "Rota ótima simulada",
    traveledKm: Number(logistics.traveledKm) || 0,
    remainingKm: Number(logistics.remainingKm) || 0,
  };
}

function updateTracking(tracking) {
  initMap(tracking);
  if (map && tracking.current) {
    const position = [
      Number(tracking.current.latitude),
      Number(tracking.current.longitude),
    ];
    animateTrackingMarker(position, tracking.path);
    map.invalidateSize();
  }
  $("#progress-bar").style.width = `${tracking.progress || 0}%`;
  const segment = tracking.currentSegment;
  $("#progress-label").textContent = segment
    ? `TRECHO ${tracking.segmentIndex + 1}/${tracking.totalSegments} · ${segment.modal} · ${Number(tracking.progress).toFixed(0)}% total`
    : `${Number(tracking.progress || 0).toFixed(0)}% · ${tracking.routeName}`;
  const currentLeg = $("#current-leg");
  if (currentLeg)
    currentLeg.textContent = segment
      ? `Trecho atual · ${segment.from} → ${segment.to}`
      : "Trecho atual aguardando execução";
  $("#traveled").textContent =
    `${Number(tracking.traveledKm || 0).toFixed(1)} km`;
  $("#remaining").textContent =
    `${Number(tracking.remainingKm || 0).toFixed(1)} km`;
  $("#current-coordinates").textContent = tracking.current
    ? `${Number(tracking.current.latitude).toFixed(5)}, ${Number(tracking.current.longitude).toFixed(5)}`
    : "Aguardando GPS";
  updateExecutionMetrics(tracking);
}
function updateSimulationControls(simulation, transport) {
  // Mesmos tres rotulos em SIMULADOR, WOKWI e ESP32 FISICO.
  // Apenas a acao executada muda conforme a fonte de telemetria.
  const start = document.querySelector('[data-action="start"]'),
    pause = document.querySelector('[data-action="stop"]'),
    hasExecution = Boolean(
      simulation.logistics && transport.status !== "CONCLUIDO",
    ),
    awaitingPlan = Boolean(simulation.awaitingRecommendationId);
  start.textContent = "▶ INICIAR TRANSPORTE";
  pause.textContent = "Ⅱ PAUSAR TRANSPORTE";
  window.lifeBoxCanResume =
    hasExecution && !simulation.running && !awaitingPlan;
  window.lifeBoxSimulationRunning = Boolean(simulation.running);
  window.lifeBoxRouteAwaitingPlan = awaitingPlan;
  if (window.lifeBoxBleIsSelected?.()) {
    // O estado fisico vem das notificacoes BLE, nao do servidor.
    window.lifeBoxBleApply?.();
    return;
  }
  if (awaitingPlan) {
    start.disabled = true;
    pause.disabled = true;
    $("#sim-status").textContent = "Aguardando novo plano";
  } else if (simulation.running) {
    start.disabled = true;
    pause.disabled = false;
    $("#sim-status").textContent = "Executando";
  } else if (hasExecution) {
    start.disabled = false;
    pause.disabled = true;
    $("#sim-status").textContent = "Pausado";
  } else {
    start.disabled = !window.lifeBoxCurrentPlan;
    pause.disabled = true;
    $("#sim-status").textContent = "Preparado";
  }
}
function updateIotControls(iot) {
  const mode = iot.mode || "IOT",
    demoMode = mode === "DEMO" && !window.lifeBoxBleIsSelected?.(),
    boxScenarioGroup = document
      .querySelector("[data-scenario]")
      ?.closest(".scenario-group"),
    modeMessage = $("#scenario-mode-message");
  window.lifeBoxIotMode = mode;
  window.lifeBoxServerIotMode = mode;
  if (!window.lifeBoxBleIsSelected?.()) $("#iot-mode").value = mode;
  syncSourceSelector();
  if (!window.lifeBoxBleIsSelected?.()) {
    $("#esp32-status").textContent = iot.online
      ? "ESP32 ONLINE"
      : "ESP32 OFFLINE";
    $("#esp32-status").classList.toggle("online", Boolean(iot.online));
    $("#telemetry-status").textContent =
      mode === "IOT" ? "TELEMETRIA AO VIVO" : "TELEMETRIA DEMONSTRAÇÃO";
  }
  boxScenarioGroup?.classList.toggle("mode-disabled", !demoMode);
  if (modeMessage) {
    modeMessage.hidden = demoMode;
    modeMessage.textContent = demoMode
      ? ""
      : window.lifeBoxBleIsSelected?.()
        ? "BLE local: a caixa física envia somente temperatura e impacto ao navegador; nuvem e histórico ficam independentes."
        : "No modo IoT, as condições da caixa vêm do ESP32/Wokwi. Condições logísticas permanecem disponíveis para o operador.";
  }
  document.querySelectorAll("[data-scenario]").forEach((control) => {
    control.disabled = !demoMode;
  });
}
window.lifeBoxSnapExecutionTracking = (tracking) => {
  if (!tracking?.current || !map) return;
  if (trackingAnimationFrame) {
    cancelAnimationFrame(trackingAnimationFrame);
    trackingAnimationFrame = null;
  }
  const position = [
    Number(tracking.current.latitude),
    Number(tracking.current.longitude),
  ];
  layers.current?.setLatLng(position);
  trackingPathLength = tracking.path?.length || 0;
  window.lifeBoxExecutionTracking = tracking;
  updateTracking(tracking);
};
function renderPhysics(data) {
  if (!data.available) {
    $("#physics-grid").innerHTML = `<div class="empty">${data.message}</div>`;
    return;
  }
  const { thermal: t, acceleration: a, electrical: e, organ } = data,
    range = organ?.referenceRangeC?.join("–") || "demonstrativa";
  $("#physics-grid").innerHTML =
    `<div class="physics-group"><h4>Termodinâmica didática</h4><p>Órgão <b>${organ?.name || "—"}</b></p><p>Faixa de referência <b>${range} °C</b></p><p>Status térmico <b>${t.status}</b></p><p>Temperatura inicial <b>${t.initial.toFixed(2)} °C</b></p><p>ΔT <b>${t.deltaT >= 0 ? "+" : ""}${t.deltaT.toFixed(2)} °C</b></p><p>Tempo simulado <b>${formatMinutes(t.elapsedMinutes)}</b></p><p>ΔT/Δt <b>${t.rateCPerMinute.toFixed(3)} °C/min</b></p><p>Q = mcΔT <b>${t.heatJoules.toFixed(0)} J</b></p></div><div class="physics-group"><h4>Aceleração simulada</h4><p>Eixo X <b>${a.x.toFixed(3)} g</b></p><p>Eixo Y <b>${a.y.toFixed(3)} g</b></p><p>Eixo Z <b>${a.z.toFixed(3)} g</b></p><p>Resultante <b>${a.resultant.toFixed(3)} g</b></p><p>Maior pico <b>${a.peak.toFixed(3)} g</b></p></div><div class="physics-group"><h4>Grandezas elétricas</h4><p>P = VI <b>${e.powerWatts.toFixed(2)} W</b></p><p>E = Pt <b>${e.energyWh.toFixed(3)} Wh</b></p><p>Energia restante <b>${e.remainingEnergyWh.toFixed(2)} Wh</b></p><p>Autonomia estimada <b>${e.estimatedAutonomyHours.toFixed(2)} h</b></p><small>${data.disclaimer}</small></div>`;
}
function renderAlerts(items) {
  $("#alert-count").textContent = items.filter(
    (item) => !Boolean(item.resolvido),
  ).length;
  const element = $("#alerts");
  element.className = "scroll-list";
  element.innerHTML =
    items
      .map(
        (item) =>
          `<div class="alert-item severity-${item.severidade}"><i class="alert-icon"></i><div><strong>${item.tipo} · ${item.severidade}</strong><p>${item.mensagem}${item.valor !== null ? ` Valor: ${Number(item.valor).toFixed(2)}` : ""}</p><time>${formatDate(item.criado_em)} · ${item.resolvido ? "Resolvido" : "Ativo"}</time></div>${item.resolvido ? "" : `<button class="resolve" data-resolve="${item.id}">Resolver</button>`}</div>`,
      )
      .join("") || '<div class="empty">Nenhum alerta registrado.</div>';
}
function renderActuators(signal = {}) {
  const ledOn = Boolean(signal.ledOn),
    buzzerOn = Boolean(signal.buzzerOn);
  $("#virtual-led").classList.toggle("active", ledOn);
  $("#virtual-buzzer").classList.toggle("active", buzzerOn);
  $("#led-status").textContent = ledOn ? "LIGADO" : "DESLIGADO";
  $("#buzzer-status").textContent = buzzerOn ? "LIGADO" : "DESLIGADO";
  $("#digital-transport-active").textContent = signal.transportActive
    ? "1"
    : "0";
  $("#digital-temperature-critical").textContent = signal.temperatureCritical
    ? "1"
    : "0";
  $("#digital-impact-critical").textContent = signal.impactCritical ? "1" : "0";
  $("#digital-alert-output").textContent = signal.alertOutput ? "1" : "0";
  $("#digital-transport-state").textContent = signal.transportActive
    ? "ATIVO"
    : "INATIVO";
  $("#digital-temperature-state").textContent = signal.temperatureCritical
    ? "CRÍTICO"
    : "NORMAL";
  $("#digital-impact-state").textContent = signal.impactCritical
    ? "CRÍTICO"
    : "NORMAL";
  $("#digital-alert-state").textContent = signal.alertOutput
    ? "ATIVO"
    : "INATIVO";
}
function renderPresentationAlert(transport, alerts, iot) {
  const overlay = $("#presentation-alert");

  // No IoT, a leitura e o sinal digital atuais sao a fonte de verdade.
  // Alertas persistidos podem estar em cooldown ou pertencer a outro instante.
  if (
    iot?.mode === "IOT" &&
    iot.online &&
    iot.lastReading &&
    Number(iot.transportId) === Number(transport.id)
  ) {
    const signal = iot.digitalSignal || {};
    const temperatureCritical = Boolean(signal.temperatureCritical);
    const impactCritical = Boolean(signal.impactCritical);
    if (!temperatureCritical && !impactCritical) {
      overlay.classList.add("hidden");
      dismissedOverlayKey = null;
      return;
    }

    const reading = iot.lastReading;
    const profile = window.lifeBoxActiveProfile || iot.organ;
    const range =
      profile?.preservation?.referenceRangeC || profile?.referenceRangeC;
    const organ = profile?.name || transport.tipo_orgao || "orgao selecionado";
    const messages = [];
    if (temperatureCritical) {
      const currentTemp = Number(reading.temperatura);
      messages.push(
        `Temperatura crítica: ${Number.isFinite(currentTemp) ? currentTemp.toFixed(1) + " °C" : "fora da faixa"}.${range ? ` Faixa de referência — ${organ}: ${range.join("–")} °C.` : ""}`,
      );
    }
    if (impactCritical) {
      const currentImpact = Number(reading.impacto);
      messages.push(
        `Impacto crítico: ${Number.isFinite(currentImpact) ? currentImpact.toFixed(2) + " g" : "limite ultrapassado"}.`,
      );
    }

    const key = `iot-${transport.id}-${temperatureCritical}-${impactCritical}`;
    if (dismissedOverlayKey === key) return;
    $("#presentation-alert-title").textContent =
      temperatureCritical && impactCritical
        ? "⚠ TEMPERATURA E IMPACTO CRÍTICOS"
        : temperatureCritical
          ? "⚠ TEMPERATURA CRÍTICA"
          : "⚠ IMPACTO CRÍTICO";
    $("#presentation-alert-message").textContent = messages.join("\n");
    overlay.querySelector("p").textContent = "OCORRÊNCIA EM TEMPO REAL";
    overlay.dataset.key = key;
    overlay.classList.remove("hidden");
    return;
  }

  // Nao usar alertas historicos como se fossem leituras atuais do IoT.
  if (iot?.mode === "IOT") {
    overlay.classList.add("hidden");
    dismissedOverlayKey = null;
    return;
  }

  const current = alerts.find((alert) => !Boolean(alert.resolvido));
  if (!current || !["ATENCAO", "CRITICO"].includes(transport.status)) {
    overlay.classList.add("hidden");
    dismissedOverlayKey = null;
    return;
  }
  const key = `${current.id}-${current.severidade}`;
  if (dismissedOverlayKey === key) return;
  const labels = {
    TEMPERATURA: "TEMPERATURA CRÍTICA",
    IMPACTO: "IMPACTO CRÍTICO",
    UMIDADE: "UMIDADE ALTA",
    BATERIA: "BATERIA BAIXA",
    SINAL: "PERDA DE SINAL",
    ATRASO: "ATRASO LOGÍSTICO",
  };
  const profile = window.lifeBoxActiveProfile,
    organ = profile?.name || transport.tipo_orgao || "órgão selecionado";
  let message = current.mensagem;
  if (current.tipo === "TEMPERATURA") {
    const range = profile?.preservation?.referenceRangeC;
    message = `Atual: ${Number(current.valor).toFixed(1)} °C${range ? `\nFaixa de referência — ${organ}: ${range.join("–")} °C` : ""}`;
  } else if (current.tipo === "IMPACTO")
    message = `Impacto detectado: ${Number(current.valor).toFixed(2)} g.`;
  $("#presentation-alert-title").textContent =
    `⚠ ${labels[current.tipo] || current.tipo}`;
  $("#presentation-alert-message").textContent = message;
  overlay.querySelector("p").textContent =
    current.tipo === "ATRASO"
      ? "ALERTA OPERACIONAL"
      : "OCORRÊNCIA EM TEMPO REAL";
  overlay.dataset.key = key;
  overlay.classList.remove("hidden");
}
function renderTimeline(items) {
  const element = $("#timeline");
  element.className = "scroll-list";
  element.innerHTML =
    items
      .map(
        (item) =>
          `<div class="timeline-item"><i class="timeline-dot"></i><div><strong>${item.tipo_evento.replaceAll("_", " ")}</strong><p>${item.descricao}</p></div><time>${formatDate(item.registrado_em)}</time></div>`,
      )
      .join("") || '<div class="empty">Nenhum evento registrado.</div>';
}
async function renderSummary() {
  const summary = await api(`/api/transportes/${transportId}/resumo`);
  if (summary.status_final !== "CONCLUIDO") return;
  $("#summary-section").classList.remove("hidden");
  const values = [
    ["Duração simulada", formatHoursMinutes(summary.duracao_minutos)],
    [
      `Isquemia final · início ${Number(summary.isquemia_inicial_minutos || 0).toFixed(0)} min`,
      `${Number(summary.isquemia_final_minutos || 0).toFixed(0)} min`,
    ],
    [
      "Margem final",
      `${Number(summary.margem_final_minutos || 0).toFixed(0)} min`,
    ],
    [
      "Temperatura · média / máxima",
      `${Number(summary.temperatura_media || 0).toFixed(1)} / ${Number(summary.temperatura_max || 0).toFixed(1)} °C`,
    ],
    [
      "Umidade · média / máxima",
      `${Number(summary.umidade_media || 0).toFixed(1)} / ${Number(summary.umidade_max || 0).toFixed(1)}%`,
    ],
    [
      "Impacto · média / máxima",
      `${Number(summary.impacto_medio || 0).toFixed(2)} / ${Number(summary.impacto_max || 0).toFixed(2)} g`,
    ],
    ["Sinal médio", `${Number(summary.sinal_medio || 0).toFixed(0)}%`],
    [
      "Temperatura dentro da faixa",
      `${Number(summary.percentual_tempo_limites || 0).toFixed(0)}%`,
    ],
    ["Alertas de temperatura", summary.alertas_por_tipo?.TEMPERATURA || 0],
    ["Impactos críticos", summary.impactos_criticos || 0],
    ["Bateria final", `${Number(summary.bateria_final || 0).toFixed(0)}%`],
    ["Reotimizações", summary.quantidade_reotimizacoes || 0],
  ];
  $("#summary-grid").innerHTML = values
    .map(([label, value]) => `<div><b>${value}</b><span>${label}</span></div>`)
    .join("");
  let logistics = $("#summary-logistics");
  if (!logistics) {
    logistics = document.createElement("section");
    logistics.id = "summary-logistics";
    logistics.className = "summary-logistics";
    $("#summary-grid").insertAdjacentElement("afterend", logistics);
  }
  const origin = summary.origem?.name || summary.origem?.nome || "—",
    destination = summary.destino?.name || summary.destino?.nome || "—";
  logistics.innerHTML = `<div class="summary-logistics-head"><small>RESULTADO LOGÍSTICO</small><strong>✓ Transporte concluído</strong></div><div><small>PLANO FINAL</small><b>${summary.plano_final?.modal || "—"}</b></div><div><small>DISTÂNCIA PERCORRIDA</small><b>${Number(summary.plano_final?.distancia_percorrida_km || 0).toFixed(1)} km</b></div><div class="summary-logistics-route"><small>ORIGEM → DESTINO</small><b>${origin} → ${destination}</b></div>`;
}
function renderQaStatus(qa) {
  $("#qa-test-count").textContent =
    qa.passed === null
      ? "PENDENTE"
      : `${qa.passed} aprovados${qa.failed ? ` · ${qa.failed} falharam` : ""}`;
  $("#qa-last-validation").textContent = qa.validatedAt
    ? `${qa.status} · ${formatDate(qa.validatedAt)}`
    : "PENDENTE";
}
function selectDashboardTransport(transports, iot) {
  const fallback =
    transports.find((item) => item.status !== "CONCLUIDO") || transports[0];
  if (
    iot.mode !== "IOT" ||
    iot.transportId === null ||
    iot.transportId === undefined
  )
    return fallback;
  return (
    transports.find((item) => item.id === Number(iot.transportId)) || fallback
  );
}
async function refresh() {
  try {
    const [transports, iot] = await Promise.all([
      api("/api/transportes"),
      api("/api/iot/status"),
    ]);
    if (!transports.length) return;
    const transport = selectDashboardTransport(transports, iot);
    transportId = transport.id;
    window.lifeBoxTransportId = transportId;
    const [readings, alerts, events, tracking, simulation, physics, qa] =
      await Promise.all([
        api(`/api/transportes/${transportId}/leituras?limite=100`),
        api(`/api/transportes/${transportId}/alertas`),
        api(`/api/transportes/${transportId}/eventos`),
        api(`/api/transportes/${transportId}/rastreabilidade`),
        api("/api/simulacao/status"),
        api(`/api/fisica/${transportId}`),
        api(`/api/qualidade`),
      ]);
    $("#transport-code").textContent = transport.codigo_transporte;
    updateIotControls(iot);
    updateSimulationControls(simulation, transport);
    window.lifeBoxExecutionActive = Boolean(
      simulation.logistics && transport.status !== "CONCLUIDO",
    );
    if (simulation.logistics) {
      window.lifeBoxExecutionTracking = window.lifeBoxBleIsSelected?.()
        ? trackingFromBleLogistics(tracking, simulation.logistics)
        : {
            ...tracking,
            ...simulation.logistics,
          };
      if (simulation.running && !window.lifeBoxActiveExecutionPlan)
        window.lifeBoxActiveExecutionPlan = {
          id: simulation.logistics.planId,
          modal: simulation.logistics.modal,
        };
    }
    const activeReading =
      iot.mode === "IOT"
        ? iot.lastReading
        : simulation.initialTelemetry || readings[0];
    const activeOrgan =
      simulation.logistics?.organProfile ||
      iot.organ ||
      window.lifeBoxActiveProfile;
    if (!window.lifeBoxBleIsSelected?.()) updateMetrics(activeReading, transport, activeOrgan);
    // No BLE, posicao e progresso SEMPRE sao do plano simulado,
    // mesmo que a tabela de telemetria nao tenha GPS fisico.
    const bleTracking = window.lifeBoxBleIsSelected?.() && simulation.logistics
      ? trackingFromBleLogistics(tracking, simulation.logistics)
      : null;
    updateTracking(bleTracking || window.lifeBoxExecutionTracking || tracking);
    const mapMode = $("#map-mode");
    if (mapMode) {
      mapMode.textContent = simulation.awaitingRecommendationId
        ? "REOTIMIZAÇÃO · MAPA PAUSADO"
        : window.lifeBoxBleIsSelected?.()
          ? "PERCURSO SIMULADO · ESP32 FÍSICO" : "PLANEJAMENTO";
    }
    if (simulation.awaitingRecommendationId) {
      $("#progress-label").textContent += " · AGUARDANDO NOVA ROTA";
    }
    drawCharts(readings);
    if (!window.lifeBoxBleIsSelected?.()) renderAlerts(alerts);
    renderTimeline(events);
    if (!window.lifeBoxBleIsSelected?.()) {
      renderPresentationAlert(transport, alerts, iot);
      renderActuators(iot.digitalSignal || simulation.digitalSignal);
    }
    renderPhysics(physics);
    renderQaStatus(qa);
    if (transport.status === "CONCLUIDO") await renderSummary();
    $("#system-status").textContent = "Sistema online";
    window.lifeBoxBleApply?.();
  } catch (error) {
    $("#system-status").textContent = "API indisponível";
    $("#system-dot").className = "dot critical";
    console.error("[LifeBox] dashboard refresh failed:", error);
    window.lifeBoxBleApply?.();
  }
}
// O percurso e gerado pela simulacao logistica da API; o ESP32 via BLE so
// transmite sensores e confirma o estado fisico. Ambos devem andar juntos.
let bleRouteManaged = false;
let bleRouteBusy = false;
let bleRouteSyncBusy = false;
let bleRouteRequestedState = null;

async function bleRouteApiAction(action) {
  const apiAction = action === "start"
    ? (window.lifeBoxCanResume ? "resume" : "start") : action;
  if (apiAction === "start" && !window.lifeBoxCurrentPlan)
    throw new Error("Calcule o plano ótimo antes de iniciar o percurso.");
  const response = await api("/api/simulacao/" + apiAction, {
    method: "POST",
    body: JSON.stringify({
      transporteId: transportId,
      rotaId: "LOGISTICS_PLAN",
      plan: window.lifeBoxCurrentPlan,
      result: window.lifeBoxPlanningResult,
      // O servidor aceita apenas IOT/DEMO; BLE continua exclusivamente local.
      mode: window.lifeBoxServerIotMode || "IOT",
    }),
  });
  window.lifeBoxSimulationRunning = Boolean(response.running);
  window.lifeBoxCanResume = Boolean(
    response.logistics && !response.running && !response.awaitingRecommendationId,
  );
  if (response.logistics) {
    window.lifeBoxExecutionTracking = response.logistics;
    window.lifeBoxExecutionActive = true;
  } else if (action === "reset") {
    window.lifeBoxExecutionTracking = null;
    window.lifeBoxExecutionActive = false;
    window.lifeBoxActiveExecutionPlan = null;
    window.lifeBoxReoptimizationRecommendation = null;
  }
  return response;
}

async function bleRoutePhysicalAction(action) {
  if (bleRouteBusy) return;
  bleRouteBusy = true;
  let hadHardwareError = null;
  try {
    if (action === "start") {
      if (window.lifeBoxRouteAwaitingPlan)
        throw new Error("Percurso pausado para reotimização. Aplique o novo plano primeiro.");
      if (!window.lifeBoxSimulationRunning &&
          !window.lifeBoxCanResume && !window.lifeBoxCurrentPlan)
        throw new Error("Calcule o plano ótimo antes de iniciar o percurso.");
      // Nao mova o mapa antes de receber do ESP32 a confirmacao ATIVO=1.
      try {
        await window.lifeBoxBleCommandTransport("start");
        await window.lifeBoxBleAwaitTransport(true);
        if (!window.lifeBoxSimulationRunning) await bleRouteApiAction("start");
        bleRouteManaged = true;
      } catch (error) {
        // Falha na confirmacao BLE OU na API: tentar pausar a caixa.
        // Nao iniciar o mapa com a caixa em estado desconhecido.
        try {
          await window.lifeBoxBleCommandTransport("stop");
          await window.lifeBoxBleAwaitTransport(false);
        } catch (ignored) { /* erro original e repassado */ }
        throw error;
      }
      $("#action-feedback").textContent =
        "Transporte iniciado. Rota simulada no mapa; temperatura e impacto recebidos do ESP32 físico.";
    } else if (action === "stop" || action === "reset") {
      try {
        await window.lifeBoxBleCommandTransport(action);
        await window.lifeBoxBleAwaitTransport(false);
      } catch (error) {
        hadHardwareError = error;
      }
      // Mesmo se a caixa desconectar, nao deixar o mapa seguir sozinho.
      await bleRouteApiAction(action);
      if (action === "reset") bleRouteManaged = false;
      $("#action-feedback").textContent = hadHardwareError
        ? "Mapa pausado/reiniciado, mas a caixa não confirmou o comando: " +
          hadHardwareError.message
        : action === "reset"
          ? "Percurso reiniciado e caixa física pausada."
          : "Transporte e percurso pausados.";
    } else {
      throw new Error("Comando desconhecido.");
    }
    await refresh();
  } finally {
    bleRouteBusy = false;
  }
}

// BOOT fisico e desconexao BLE tambem devem pausar/retomar o mapa ja
// iniciado neste painel. Nao altera a telemetria real da caixa.
window.lifeBoxBleOnTransportChange = (transportActive) => {
  if (!bleRouteManaged || bleRouteBusy) return;
  bleRouteRequestedState = Boolean(transportActive);
  if (bleRouteSyncBusy) return;
  bleRouteSyncBusy = true;
  void (async () => {
    try {
      while (bleRouteRequestedState !== null) {
        const requested = bleRouteRequestedState;
        bleRouteRequestedState = null;
        // A reotimizacao tem prioridade: BOOT nao pode retomar o mapa
        // enquanto o operador ainda precisa decidir o novo plano.
        if (requested && window.lifeBoxRouteAwaitingPlan) continue;
        if (requested !== Boolean(window.lifeBoxSimulationRunning)) {
          await bleRouteApiAction(requested ? "resume" : "stop");
          await refresh();
          $("#action-feedback").textContent = requested
            ? "BOOT: caixa e percurso retomados."
            : "BOOT/desconexão: caixa e percurso pausados.";
        }
      }
    } catch (error) {
      $("#action-feedback").textContent =
        "Falha ao sincronizar percurso após BOOT/desconexão: " + error.message;
    } finally {
      bleRouteSyncBusy = false;
      if (bleRouteRequestedState !== null)
        window.lifeBoxBleOnTransportChange(bleRouteRequestedState);
    }
  })();
};

document.addEventListener("click", async (event) => {
  const action = event.target.dataset.action,
    scenario = event.target.dataset.scenario,
    resolve = event.target.dataset.resolve,
    dismiss = event.target.id === "dismiss-presentation-alert";
  if (dismiss) {
    dismissedOverlayKey = $("#presentation-alert").dataset.key;
    $("#presentation-alert").classList.add("hidden");
    return;
  }
  if (!action && !scenario && !resolve) return;
  // BLE: o ESP32 controla atuadores; a API avanca o mapa simuladamente.
  // Os mesmos botoes comandam os dois fluxos, sem enviar sensores BLE ao banco.
  if (action && window.lifeBoxBleIsSelected?.()) {
    try {
      await bleRoutePhysicalAction(action);
    } catch (error) {
      $("#action-feedback").textContent =
        "Não foi possível sincronizar o transporte e o percurso: " + error.message;
    }
    window.lifeBoxBleApply?.();
    return;
  }
  try {
    if (action) {
      if (
        action === "start" &&
        !window.lifeBoxCanResume &&
        !window.lifeBoxCurrentPlan
      )
        throw new Error("Nenhum plano logístico factível disponível.");
      if (action === "reset") {
        dismissedOverlayKey = null;
        $("#presentation-alert").classList.add("hidden");
        renderActuators({ ledOn: false, buzzerOn: false });
      }
      const requestedAction =
        action === "start" && window.lifeBoxCanResume ? "resume" : action;
      const simulationResponse = await api(
        `/api/simulacao/${requestedAction}`,
        {
          method: "POST",
          body: JSON.stringify({
            transporteId: transportId,
            rotaId: "LOGISTICS_PLAN",
            plan: window.lifeBoxCurrentPlan,
            result: window.lifeBoxPlanningResult,
            mode: $("#iot-mode").value === "BLE"
              ? (window.lifeBoxServerIotMode || "IOT")
              : $("#iot-mode").value,
          }),
        },
      );
      if (action === "start") {
        window.lifeBoxExecutionActive = true;
        window.lifeBoxActiveExecutionPlan = window.lifeBoxCurrentPlan;
        window.lifeBoxExecutionTracking = simulationResponse.logistics;
      }
      if (action === "reset") {
        window.lifeBoxExecutionActive = false;
        window.lifeBoxActiveExecutionPlan = null;
        window.lifeBoxReoptimizationRecommendation = null;
      }
    }
    if (scenario)
      await api("/api/simulacao/cenario", {
        method: "POST",
        body: JSON.stringify({ cenario: scenario, transporteId: transportId }),
      });
    if (resolve)
      await api(`/api/alertas/${resolve}/resolver`, { method: "PATCH" });
    $("#action-feedback").textContent = scenario
      ? `Cenário “${event.target.textContent.trim()}” ativado.`
      : "Comando executado.";
    await refresh();
  } catch (error) {
    $("#action-feedback").textContent = error.message;
  }
});
window.lifeBoxShowPlan = (plan, result, points) => {
  window.lifeBoxPlanningActive = true;
  window.lifeBoxInspectedPlan = plan;
  const start = document.querySelector('[data-action="start"]');
  if (start) start.disabled = !plan.viavel;
  $("#start-requirement").textContent = plan.viavel
    ? "Plano logístico factível disponível."
    : "Nenhum plano logístico factível disponível.";
  if (!window.L) {
    document.querySelector("#map .map-fallback").innerHTML =
      "<strong>Biblioteca do mapa não carregada</strong><p>Verifique a conexão com o Leaflet.</p>";
    return;
  }
  if (!map) {
    map = L.map("map", { zoomControl: true }).setView(
      [result.origin.latitude, result.origin.longitude],
      8,
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);
    layers.path = L.polyline([], {
      opacity: 0,
      interactive: false,
    }).addTo(map);
    layers.current = createTrackingMarker([
      result.origin.latitude,
      result.origin.longitude,
    ]);
  }
  if (!window.lifeBoxExecutionActive) {
    if (trackingAnimationFrame) {
      cancelAnimationFrame(trackingAnimationFrame);
      trackingAnimationFrame = null;
    }
    layers.current?.setLatLng([
      result.origin.latitude,
      result.origin.longitude,
    ]);
    layers.path?.setLatLngs([]);
    trackingPathLength = 0;
  }
  layers.planning?.forEach((item) => item.remove());
  layers.planning = [];
  layers.origin?.remove();
  layers.destination?.remove();
  layers.origin = null;
  layers.destination = null;
  const marker = (point, label, type = "facility") => {
    const position = [point.latitude, point.longitude];
    const layer =
      type === "origin" || type === "destination"
        ? createEndpointMarker(position, type)
        : createFacilityMarker(
            position,
            point.type?.includes("AIRPORT") ? "airport" : "helipad",
          );
    const displayName = String(point.name || "").replace(
      /\s+simulad[ao]$/i,
      "",
    );
    const popupText = new RegExp(`^${label}\\b`, "i").test(displayName)
      ? displayName
      : `${label}: ${displayName}`;
    return layer.addTo(map).bindPopup(popupText);
  };
  layers.planning.push(
    marker(result.origin, "Hospital doador", "origin"),
    marker(result.destination, "Hospital receptor", "destination"),
  );
  (plan.facilities || []).forEach((facility) => {
    const facilityType = facility.type?.includes("AIRPORT")
      ? "Aeroporto"
      : "Heliponto";
    const facilityMarker = marker(facility, facilityType);
    if (facility.icao)
      facilityMarker.bindTooltip(facility.icao, {
        permanent: false,
        sticky: true,
        direction: "top",
        className: "airport-code-tooltip",
      });
    layers.planning.push(facilityMarker);
  });
  (plan.segments || []).forEach((segment, index) => {
    if (segment.modal === "OPERACIONAL") return;
    const start = segment.origin || points[index],
      end = segment.destination || points[index + 1];
    const geometry = (
      segment.geometry?.length ? segment.geometry : [start, end]
    ).filter(Boolean);
    if (geometry.length < 2) return;
    const aerial = ["AVIÃO", "HELICÓPTERO"].includes(segment.modal);
    layers.planning.push(
      L.polyline(
        geometry.map((point) => [point.latitude, point.longitude]),
        {
          color: aerial ? "#49a7ff" : "#72a7c4",
          weight: aerial ? 4 : 5,
          opacity: 0.9,
          dashArray: aerial ? "8 7" : null,
          lineCap: "round",
          lineJoin: "round",
        },
      ).addTo(map),
    );
  });
  layers.current?.bringToFront?.();
  const all = [result.origin, result.destination, ...(plan.facilities || [])];
  map.invalidateSize();
  map.fitBounds(
    L.latLngBounds(all.map((point) => [point.latitude, point.longitude])),
    {
      paddingTopLeft: [40, 80],
      paddingBottomRight: [40, 55],
    },
  );
  $("#route-name").textContent =
    `${result.origin.name} → ${result.destination.name} · Plano: ${plan.modal}`;
  $("#map-mode").textContent = "PLANEJAMENTO";
};
const mapMode = document.querySelector(".map-mode");
if (mapMode) {
  mapMode.innerHTML = `<span id="map-mode">PLANEJAMENTO</span><span><i class="legend-pin legend-pin-red"></i>Origem / destino</span><span><i class="legend-pin legend-pin-blue"></i>Aeroporto / heliponto</span><span><i class="legend-cursor"></i>Posição atual</span><span><i class="legend-line legend-ground"></i>Terrestre</span><span><i class="legend-line legend-air"></i>Aéreo</span>`;
  mapMode.insertAdjacentHTML(
    "afterend",
    '<p id="current-leg" class="current-leg">Trecho atual aguardando execução</p>',
  );
}
const projectDetails = [
    ...document.querySelectorAll(".technical-details"),
  ].find(
    (details) =>
      details.querySelector(":scope > summary")?.textContent.trim() ===
      "DETALHES TÉCNICOS DO PROJETO",
  ),
  finalSummary = $("#summary-section");
if (projectDetails && finalSummary)
  finalSummary.insertAdjacentElement(
    "afterend",
    projectDetails.closest("section"),
  );
function syncSourceSelector() {
  const select = $("#iot-mode"),
    button = $("#iot-mode-button");
  if (!select || !button) return;
  button.querySelector("span").textContent =
    select.selectedOptions[0]?.textContent || "ESP32 / WOKWI";
  document
    .querySelectorAll("#iot-mode-options [role='option']")
    .forEach((option) =>
      option.setAttribute(
        "aria-selected",
        String(option.dataset.mode === select.value),
      ),
    );
}
function initSourceSelector() {
  const select = $("#iot-mode"),
    button = $("#iot-mode-button"),
    list = $("#iot-mode-options"),
    options = [...list.querySelectorAll("[role='option']")];
  const close = (restoreFocus = false) => {
    list.hidden = true;
    button.setAttribute("aria-expanded", "false");
    if (restoreFocus) button.focus();
  };
  const open = () => {
    list.hidden = false;
    button.setAttribute("aria-expanded", "true");
    (
      options.find((option) => option.dataset.mode === select.value) ||
      options[0]
    ).focus();
  };
  const choose = (option) => {
    select.value = option.dataset.mode;
    syncSourceSelector();
    close(true);
    select.dispatchEvent(new Event("change", { bubbles: true }));
  };
  button.addEventListener("click", () => (list.hidden ? open() : close()));
  button.addEventListener("keydown", (event) => {
    if (["Enter", " ", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      open();
    } else if (event.key === "Escape") close();
  });
  options.forEach((option, index) => {
    option.addEventListener("click", () => choose(option));
    option.addEventListener("keydown", (event) => {
      if (["Enter", " "].includes(event.key)) {
        event.preventDefault();
        choose(option);
      } else if (event.key === "Escape") close(true);
      else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        const target =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? options.length - 1
              : (index +
                  (event.key === "ArrowDown" ? 1 : -1) +
                  options.length) %
                options.length;
        options[target].focus();
      }
    });
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".source-select")) close();
  });
  syncSourceSelector();
}
initSourceSelector();
$("#iot-mode").addEventListener("change", async (event) => {
  if (event.target.value === "BLE") {
    window.lifeBoxBleSetMode?.(true);
    dismissedOverlayKey = null;
    return; // Fonte local: NAO altera o modo IoT do backend.
  }
  window.lifeBoxBleSetMode?.(false);
  try {
    await api("/api/iot/mode", {
      method: "PUT",
      body: JSON.stringify({ mode: event.target.value }),
    });
    dismissedOverlayKey = null;
    await refresh();
  } catch (error) {
    $("#action-feedback").textContent = error.message;
  }
});
refresh();
setInterval(refresh, 2000);
window.addEventListener("resize", () => map?.invalidateSize());
