(() => {
  const $ = (selector) => document.querySelector(selector);
  const locationOptions = [
    "Aracaju - SE",
    "Belém - PA",
    "Belo Horizonte - MG",
    "Boa Vista - RR",
    "Brasília - DF",
    "Campinas - SP",
    "Campo Grande - MS",
    "Cuiabá - MT",
    "Curitiba - PR",
    "Florianópolis - SC",
    "Fortaleza - CE",
    "Goiânia - GO",
    "João Pessoa - PB",
    "Macapá - AP",
    "Maceió - AL",
    "Manaus - AM",
    "Natal - RN",
    "Palmas - TO",
    "Porto Alegre - RS",
    "Porto Velho - RO",
    "Recife - PE",
    "Rio Branco - AC",
    "Rio de Janeiro - RJ",
    "Salvador - BA",
    "São Luís - MA",
    "São Paulo - SP",
    "Teresina - PI",
    "Vitória - ES",
  ];
  let profiles = [],
    scenarios = [],
    activeScenario,
    activeConditions = {},
    lastResult,
    lastShown,
    recommendationExpiryTimer,
    syncPlanningSelects = () => {};
  const api = async (path, options = {}) => {
    const response = await fetch(path, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    const data = await response.json();
    if (!response.ok) {
      const error = Error(data.error || data.erro || "Falha");
      error.code = data.code;
      throw error;
    }
    return data;
  };
  const money = (value) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  const statusLabel = (status) =>
    ({
      FACTIVEL: "FACTÍVEL",
      MARGEM_CRITICA: "MARGEM CRÍTICA",
      INVIAVEL: "INVIÁVEL",
    })[status] || status.replaceAll("_", " ");
  const reasonLabel = (key) =>
    ({
      delay40: "Atraso logístico de 40 min",
      traffic30: "Trânsito intenso (+30% no tempo terrestre)",
      helicopterUnavailable: "Helicóptero indisponível",
      airportUnavailable: "Aeroporto indisponível",
      airCost20: "Aumento de 20% no custo aéreo",
      consumed30: "Acréscimo de 30 min no tempo de isquemia",
      groundRouteUnavailable: "Transporte terrestre indisponível",
    })[key] || "Condição operacional atualizada";
  const profile = () =>
    profiles.find((item) => item.code === $("#planning-organ").value);
  const clone = (value) => JSON.parse(JSON.stringify(value));
  function clearRecommendation() {
    if (recommendationExpiryTimer) clearTimeout(recommendationExpiryTimer);
    recommendationExpiryTimer = null;
    window.lifeBoxReoptimizationRecommendation = null;
  }
  function storeRecommendation(recommendation, reason) {
    if (!recommendation?.recommendationId)
      throw new Error("A recomendação recebida não possui recommendationId.");
    clearRecommendation();
    const expiresInMs = Number(recommendation.expiresInSeconds || 0) * 1000;
    window.lifeBoxReoptimizationRecommendation = {
      ...recommendation,
      reason,
      expiresAt: expiresInMs ? Date.now() + expiresInMs : null,
    };
    if (expiresInMs)
      recommendationExpiryTimer = setTimeout(() => {
        if (
          window.lifeBoxReoptimizationRecommendation?.recommendationId ===
          recommendation.recommendationId
        )
          clearRecommendation();
      }, expiresInMs);
    return window.lifeBoxReoptimizationRecommendation;
  }
  function renderProfile() {
    const item = profile();
    if (!item) return;
    window.lifeBoxActiveProfile = item;
    $("#planning-profile").innerHTML =
      `<b>PERFIL DE PRESERVAÇÃO · ${item.name.toUpperCase()}</b><span>SCS</span><span>${item.preservation.referenceRangeC.join("–")} °C <em>CIENTÍFICO</em></span><span>Alvo acadêmico: ${item.preservation.targetTemperatureC} °C</span><span>Janela: ${item.ischemia.officialMaxMinutes} min <em>OFICIAL</em></span><span>Margem: ${item.ischemia.operationalSafetyMarginMinutes} min</span>`;
  }
  function science() {
    const item = profile(),
      element = $("#planning-science-panel");
    const sources = [item.ischemia.source, ...item.preservation.sources].filter(
      (source, index, all) =>
        source &&
        all.findIndex((candidate) => candidate.url === source.url) === index,
    );
    element.innerHTML = `<div class="science-head"><div><p class="eyebrow">REFERÊNCIAS DO MODELO</p><h4>Base científica — ${item.name}</h4></div><span>PERFIL ACADÊMICO</span></div><div class="science-summary"><span><small>ÓRGÃO</small><strong>${item.name}</strong></span><span><small>FAIXA TÉRMICA DE REFERÊNCIA</small><strong>${item.preservation.referenceRangeC.join("–")} °C</strong></span><span><small>ALVO ACADÊMICO</small><strong>${item.preservation.targetTemperatureC} °C</strong></span><span><small>JANELA DE ISQUEMIA</small><strong>${item.ischemia.officialMaxMinutes} min</strong></span><span><small>MARGEM OPERACIONAL</small><strong>${item.ischemia.operationalSafetyMarginMinutes} min</strong></span></div><div class="science-sources">${sources.map((source) => `<article><span class="source-type ${source.classification === "OFFICIAL_DATA" ? "official" : "scientific"}">${source.classification === "OFFICIAL_DATA" ? "FONTE OFICIAL" : "FONTE CIENTÍFICA"}</span><h5>${source.title}</h5><p>${source.institution || "Publicação científica"} · ${source.year}</p><a href="${source.url}" target="_blank" rel="noopener noreferrer">Abrir fonte ↗</a></article>`).join("")}</div>`;
    const isHidden = element.classList.toggle("hidden");
    $("#planning-science").setAttribute("aria-expanded", String(!isHidden));
  }
  function scenario() {
    return scenarios.find((item) => item.id === $("#planning-scenario").value);
  }
  function setScenario() {
    clearRecommendation();
    activeScenario = scenario();
    activeConditions = clone(activeScenario.conditions || {});
    $("#planning-organ").value = activeScenario.organCode;
    $("#planning-consumed").value = activeScenario.consumedMinutes;
    $("#planning-origin").value = activeScenario.origin.name;
    $("#planning-destination").value = activeScenario.destination.name;
    syncPlanningSelects();
    $("#planning-description").textContent = activeScenario.description;
    renderProfile();
    clearLogisticButtons();
    calculate();
  }
  function clearLogisticButtons() {
    document
      .querySelectorAll("[data-logistic]")
      .forEach((button) => button.classList.remove("active"));
  }
  function toggleLogistic(button) {
    const key = button.dataset.logistic,
      active = button.classList.toggle("active");
    if (key === "traffic30")
      activeConditions.trafficIncrease = active ? 0.3 : 0;
    if (key === "groundRouteUnavailable") {
      activeConditions.groundRouteUnavailable = null;
      activeConditions.modalAvailability = active
        ? { GROUND: false, HELICOPTER: true, AIRPLANE: true }
        : clone(activeScenario.conditions?.modalAvailability || {});
      activeConditions.groundAccessOriginAvailable = !active;
      activeConditions.groundAccessDestinationAvailable = !active;
      activeConditions.originHasHelipad = active
        ? true
        : Boolean(activeScenario.conditions?.originHasHelipad);
      activeConditions.destinationHasHelipad = active
        ? true
        : Boolean(activeScenario.conditions?.destinationHasHelipad);
      activeConditions.infrastructureAvailability = {
        ...(activeConditions.infrastructureAvailability || {}),
        HELIPORT_ORIGIN: active
          ? true
          : activeScenario.conditions?.infrastructureAvailability
              ?.HELIPORT_ORIGIN !== false,
        HELIPORT_DESTINATION: active
          ? true
          : activeScenario.conditions?.infrastructureAvailability
              ?.HELIPORT_DESTINATION !== false,
      };
    }
    if (key === "delay40") activeConditions.delayMinutes = active ? 40 : 0;
    if (key === "helicopterUnavailable") {
      activeConditions.modalAvailability = active
        ? { GROUND: true, HELICOPTER: false, AIRPLANE: true }
        : clone(activeScenario.conditions?.modalAvailability || {});
    }
    if (key === "airportUnavailable") {
      activeConditions.infrastructureAvailability =
        activeConditions.infrastructureAvailability || {};
      activeConditions.infrastructureAvailability.AIRPORT_ORIGIN = !active;
      activeConditions.infrastructureAvailability.AIRPORT_DESTINATION = !active;
      activeConditions.modalAvailability = active
        ? { GROUND: true, HELICOPTER: true, AIRPLANE: true }
        : clone(activeScenario.conditions?.modalAvailability || {});
    }
    if (key === "airCost20")
      activeConditions.airCostIncrease = active ? 0.2 : 0;
    if (key === "consumed30")
      activeConditions.extraConsumedMinutes = active ? 30 : 0;
    $("#action-feedback").textContent = active
      ? `Condição logística “${button.textContent.trim()}” ativada. Recalculando o plano...`
      : `Condição logística “${button.textContent.trim()}” removida. Recalculando o plano...`;
    calculate(key);
  }
  function payload(reoptimize = false) {
    const custom = $("#planning-custom").checked;
    const tracking = window.lifeBoxExecutionTracking;
    const currentOrigin =
      reoptimize && tracking?.current
        ? {
            name: "Posição atual da LifeBox",
            latitude: tracking.current.latitude,
            longitude: tracking.current.longitude,
          }
        : null;
    return {
      organCode: profile().code,
      consumedMinutes:
        reoptimize && tracking?.ischemiaTotalMinutes !== undefined
          ? Number(tracking.ischemiaTotalMinutes)
          : Number($("#planning-consumed").value || 0),
      origin:
        currentOrigin ||
        (custom
          ? { query: $("#planning-origin").value }
          : activeScenario.origin),
      destination: custom
        ? { query: $("#planning-destination").value }
        : activeScenario.destination,
      conditions: activeConditions,
    };
  }
  function planPoints(plan) {
    const lookup = {};
    [
      lastResult.origin,
      lastResult.destination,
      ...(plan.facilities || []),
    ].forEach((point) => (lookup[point.name] = point));
    const points = [];
    plan.segments.forEach((segment) => {
      if (lookup[segment.from])
        points.push({ ...lookup[segment.from], modal: segment.modal });
      if (lookup[segment.to])
        points.push({ ...lookup[segment.to], modal: segment.modal });
    });
    return points.filter(
      (point, index, all) =>
        index === 0 ||
        point.latitude !== all[index - 1].latitude ||
        point.longitude !== all[index - 1].longitude,
    );
  }
  function showOnMap(plan) {
    lastShown = plan;
    if (plan && window.lifeBoxShowPlan)
      window.lifeBoxShowPlan(plan, lastResult, planPoints(plan));
  }
  function reoptimizationMarkup(recommendation) {
    const planLabel = (plan) =>
      plan
        ? `${plan.name || plan.modal}${plan.groundRoute?.via ? ` — Via ${plan.groundRoute.via}` : plan.modal && plan.name !== plan.modal ? ` · ${plan.modal}` : ""}`
        : "Sem solução viável";
    const current = recommendation.currentPlan || {},
      next = recommendation.plan || {},
      number = (value) => Number(value || 0).toFixed(0);
    return `<section class="reoptimization reoptimization-decision"><header><div><b>REOTIMIZAÇÃO DA PO · ${recommendation.status}</b><span>${reasonLabel(recommendation.reason)}</span></div><strong class="route-paused-message">DESLOCAMENTO PAUSADO · AGUARDANDO ESCOLHA DO NOVO PLANO</strong></header><div class="reoptimization-plans"><article><small>PLANO ATUAL</small><strong>${planLabel(current)}</strong></article><span>→</span><article class="recommended"><small>PLANO RECOMENDADO</small><strong>${planLabel(next)}</strong></article></div><div class="reoptimization-comparison"><span><small>INDICADOR</small><b>Atual</b><b>Recomendado</b></span><span><small>Tempo</small><b>${number(current.timeMin)} min</b><b>${number(next.timeMin)} min</b></span><span><small>Custo</small><b>${money(current.cost || 0)}</b><b>${money(next.cost || 0)}</b></span><span><small>Margem</small><b>${number(current.marginMinutes)} min</b><b>${number(next.marginMinutes)} min</b></span></div><button id="apply-reoptimization" class="primary">APLICAR NOVO PLANO</button></section>`;
  }
  function render(result, reason) {
    const previous = lastResult?.selected;
    lastResult = result;
    window.lifeBoxPlanningResult = result;
    const selected = result.selected,
      res = $("#planning-result");
    res.className = "planning-result";
    const unavailableReasons = [
      ...new Set(
        result.alternatives
          .filter((item) => item.status !== "FACTIVEL")
          .map((item) => item.motivo)
          .filter(Boolean),
      ),
    ];
    const noSolutionMarkup = `<div class="po-no-solution"><b>NENHUM PLANO VIÁVEL</b><span>As alternativas permanecem disponíveis para análise, mas nenhuma atende simultaneamente às restrições deste cenário.</span>${unavailableReasons.length ? `<small>Restrições identificadas: ${unavailableReasons.join(" · ")}</small>` : ""}</div>`;
    res.innerHTML = selected
      ? `<strong><em>PLANO ÓTIMO</em><b> · ${selected.modal}</b></strong><span>${result.origin.name} → ${result.destination.name}</span><span>${selected.timeMin.toFixed(0)} min · ${money(selected.cost)} · margem ${selected.marginMinutes.toFixed(0)} min · FACTÍVEL</span>${selected.groundRoute ? `<span>Via: ${selected.groundRoute.via} · pedágio demonstrativo: ${money(selected.groundRoute.toll)}</span>` : ""}<p>Menor custo entre as alternativas que satisfazem as restrições do órgão.</p>`
      : noSolutionMarkup;
    if (reason && previous?.id !== selected?.id) {
      res.insertAdjacentHTML(
        "beforeend",
        `<p class="reoptimization"><b>REOTIMIZAÇÃO DA PO</b><br>Plano anterior: ${previous?.modal || "Sem solução viável"} · Novo plano: ${selected?.modal || "SEM SOLUÇÃO VIÁVEL"}<br>Motivo da reotimização: ${reasonLabel(reason)}</p>`,
      );
    }
    $("#planning-table").innerHTML = result.alternatives
      .map(
        (item) =>
          `<tr data-plan="${item.id}" class="${item.selected ? "route-selected" : ""} ${item.status === "FACTIVEL" ? "" : "route-infeasible"}"><td>${item.name}${item.groundRoute ? `<br><small>Via: ${item.groundRoute.via}</small>` : ""}<br><button data-view-plan="${item.id}">VER NO MAPA</button></td><td>${item.modal}</td><td>${item.timeMin.toFixed(0)} min</td><td>${money(item.cost)}</td><td>${item.marginMinutes.toFixed(0)} min</td><td><span class="planning-status status-${item.status}">${statusLabel(item.status)}</span></td><td>${item.motivo}</td></tr>`,
      )
      .join("");
    $("#planning-calculations").innerHTML =
      `<section class="po-block po-model"><div class="po-block-heading"><span>Etapa 1</span><div><p>MODELO DA DECISÃO</p><h4>Como o sistema escolhe</h4></div></div><div class="po-model-grid"><div class="po-objective"><small>FUNÇÃO OBJETIVO</small><strong>MIN C_total</strong><p>O sistema escolhe o plano de menor custo entre as alternativas que respeitam as restrições.</p></div><div class="po-constraints"><small>RESTRIÇÕES CONSIDERADAS</small><ul><li>Limite de isquemia</li><li>Margem mínima</li><li>Disponibilidade dos modais</li><li>Infraestrutura disponível</li><li>Condições de preservação</li></ul></div></div></section><section class="po-block"><div class="po-block-heading"><span>Etapa 2</span><div><p>ALTERNATIVAS ANALISADAS</p><h4>Comparação dos planos disponíveis</h4></div></div><div class="po-alternatives">${result.alternatives.map((item) => `<article class="po-alternative status-${item.status}"><header><div><small>PLANO</small><b>${item.name}</b></div><span class="po-status">${statusLabel(item.status)}</span></header><p class="po-composition"><small>COMPOSIÇÃO / MODAL</small><strong>${item.modal}</strong></p><div class="po-values"><span>Tempo<strong>${item.timeMin.toFixed(0)} min</strong></span><span>Custo<strong>${money(item.cost)}</strong></span><span>Margem<strong>${item.marginMinutes.toFixed(0)} min</strong></span></div><div class="po-reason"><small>MOTIVO</small><p>${item.motivo}</p></div><details><summary>Ver composição do plano</summary><div class="po-segments">${item.segments.map((segment, index) => `<div class="po-segment"><span>${String(index + 1).padStart(2, "0")}</span><div><b>${segment.from} → ${segment.to}</b><small>${segment.modal} · ${segment.distanceKm.toFixed(1)} km · ${segment.timeMin.toFixed(0)} min · ${money(segment.cost)}</small></div></div>`).join("")}</div></details></article>`).join("")}</div></section><article class="po-block po-solution"><div class="po-block-heading"><span>Etapa 3</span><div><p>SOLUÇÃO ÓTIMA</p><h4>Plano selecionado pelo modelo</h4></div></div>${selected ? `<div class="po-solution-main"><div><small>PLANO ESCOLHIDO</small><strong>${selected.name}</strong><p>${selected.modal}</p></div><span class="po-status">FACTÍVEL</span></div><div class="po-solution-values"><span>Composição<strong>${selected.modal}</strong></span><span>Tempo<strong>${selected.timeMin.toFixed(0)} min</strong></span><span>Custo<strong>${money(selected.cost)}</strong></span><span>Margem<strong>${selected.marginMinutes.toFixed(0)} min</strong></span></div><p class="po-justification"><b>JUSTIFICATIVA</b> Menor custo entre todas as alternativas factíveis.</p>` : "<p>Nenhum plano logístico factível disponível.</p>"}</article>`;
    const activeProfile = profiles.find(
        (profile) => profile.code === $("#planning-organ").value,
      ),
      ischemiaLimit = Number(activeProfile?.ischemia?.officialMaxMinutes || 0),
      minimumMargin = Number(
        activeProfile?.ischemia?.operationalSafetyMarginMinutes || 0,
      ),
      consumedMinutes = Number($("#planning-consumed").value || 0),
      feasibleCosts = result.alternatives
        .filter((item) => item.status === "FACTIVEL")
        .map((item) => money(item.cost))
        .join("; "),
      appliedCalculation = document.createElement("section");
    appliedCalculation.className = "po-live-calculation";
    appliedCalculation.innerHTML = `<div class="po-live-heading"><small>CÁLCULO REAL DESTE CENÁRIO</small><strong>Formulação e valores substituídos</strong></div><div class="po-formula-main"><small>FUNÇÃO OBJETIVO</small><b>min Z = Σᵢ∈F Cᵢxᵢ</b><span>Minimizar o custo total entre os planos pertencentes ao conjunto factível F.</span></div><div class="po-formula-grid"><article><small>VARIÁVEL DE DECISÃO</small><b>xᵢ ∈ {0,1} &nbsp; e &nbsp; Σᵢ∈F xᵢ = 1</b><span>xᵢ = 1 quando o plano i é escolhido; somente um plano pode vencer.</span></article><article><small>CONJUNTO FACTÍVEL</small><b>F = {i | I₀ + Tᵢ ≤ J − Mmín ∧ Aᵢ = 1}</b><span>O plano precisa respeitar a janela com margem e estar disponível.</span></article><article><small>RESTRIÇÃO SUBSTITUÍDA</small><b>${consumedMinutes} + Tᵢ ≤ ${ischemiaLimit} − ${minimumMargin} = ${ischemiaLimit - minimumMargin}</b><span>I₀ = isquemia consumida; J = janela do órgão; Mmín = margem mínima.</span></article><article><small>MARGEM DO ESCOLHIDO</small><b>${selected ? `M = ${ischemiaLimit} − ${consumedMinutes} − ${selected.timeMin.toFixed(0)} = ${selected.marginMinutes.toFixed(0)} min` : "Sem alternativa escolhida"}</b><span>O plano só é elegível quando M ≥ ${minimumMargin} min.</span></article><article class="po-formula-result"><small>AVALIAÇÃO DA FUNÇÃO OBJETIVO</small><b>${selected ? `min { ${feasibleCosts} } = ${money(selected.cost)}` : "Nenhum custo elegível"}</b><span>${selected ? `${selected.name} foi selecionado por apresentar o menor custo entre os planos factíveis.` : "Nenhuma alternativa satisfez todas as restrições."}</span></article></div>`;
    $("#planning-calculations .po-model").append(appliedCalculation);
    document
      .querySelectorAll("#planning-calculations .po-alternative")
      .forEach((card, index) => {
        const alternative = result.alternatives[index];
        if (selected && alternative?.id === selected.id) {
          card.classList.add("is-selected");
          const status = card.querySelector(".po-status");
          if (status) status.textContent = "RECOMENDADO";
        }
        card
          .querySelectorAll(".po-segment")
          .forEach((segmentCard, segmentIndex) => {
            const modal = alternative?.segments?.[segmentIndex]?.modal || "";
            segmentCard.dataset.modal = modal;
          });
      });
    const solutionStatus = document.querySelector(
      "#planning-calculations .po-solution .po-status",
    );
    if (solutionStatus) solutionStatus.textContent = "PLANO RECOMENDADO";
    showOnMap(selected || result.alternatives[0]);
    if (!window.lifeBoxExecutionActive) window.lifeBoxCurrentPlan = selected;
  }
  async function calculate(reason) {
    const calculateButton = $("#planning-calculate"),
      originalLabel = calculateButton.textContent;
    calculateButton.disabled = true;
    calculateButton.textContent = "CALCULANDO PLANO...";
    try {
      $("#planning-result").textContent = "Calculando planos...";
      const reoptimize = Boolean(
        reason &&
        window.lifeBoxExecutionActive &&
        window.lifeBoxExecutionTracking?.current,
      );
      if (reoptimize) {
        const recommendation = await api(
          "/api/simulacao/reotimizar/recomendar",
          {
            method: "POST",
            body: JSON.stringify({
              transporteId: window.lifeBoxTransportId,
              reason: reasonLabel(reason),
              conditions: activeConditions,
            }),
          },
        );
        render(recommendation.result);
        const activeRecommendation = storeRecommendation(
          recommendation,
          reason,
        );
        $("#sim-status").textContent = "Aguardando novo plano";
        document
          .querySelectorAll("[data-logistic]")
          .forEach((button) => (button.disabled = true));
        $("#planning-result").insertAdjacentHTML(
          "beforeend",
          reoptimizationMarkup(activeRecommendation),
        );
      } else {
        render(
          await api("/api/planejamento/calcular", {
            method: "POST",
            body: JSON.stringify(payload(false)),
          }),
          reason,
        );
      }
    } catch (error) {
      if (
        lastResult &&
        ["PLAN_UNCHANGED", "NO_FEASIBLE_RECOMMENDATION"].includes(error.code)
      ) {
        clearRecommendation();
        render(lastResult);
        const unchanged = error.code === "PLAN_UNCHANGED";
        $("#planning-result").insertAdjacentHTML(
          "beforeend",
          `<p class="reoptimization reoptimization-info"><b>CONDIÇÃO LOGÍSTICA CONSIDERADA</b><br>${unchanged ? "O plano ativo continua sendo a melhor alternativa. Nenhuma troca é necessária." : "A condição não produz outra alternativa factível. O plano ativo foi mantido e requer acompanhamento operacional."}</p>`,
        );
        $("#action-feedback").textContent = unchanged
          ? "Condição aplicada ao modelo; o plano atual continua ótimo."
          : "Condição aplicada, mas não existe outro plano factível para recomendar.";
      } else {
        $("#planning-result").textContent = error.message;
        $("#action-feedback").textContent = error.message;
      }
    } finally {
      calculateButton.disabled = false;
      calculateButton.textContent = originalLabel;
    }
  }
  async function applyRecommendation() {
    const recommendation = window.lifeBoxReoptimizationRecommendation;
    if (!recommendation?.recommendationId) return;
    if (recommendation.expiresAt && recommendation.expiresAt <= Date.now()) {
      clearRecommendation();
      return;
    }
    try {
      const applied = await api("/api/simulacao/reotimizar/aplicar", {
        method: "POST",
        body: JSON.stringify({
          transporteId: window.lifeBoxTransportId,
          recommendationId: recommendation.recommendationId,
        }),
      });
      window.lifeBoxActiveExecutionPlan = recommendation.plan;
      window.lifeBoxCurrentPlan = recommendation.plan;
      recommendation.status = "APLICADA";
      render(recommendation.result);
      window.lifeBoxSnapExecutionTracking?.(applied.logistics);
      $("#planning-result").insertAdjacentHTML(
        "afterbegin",
        `<p class="reoptimization reoptimization-applied"><b>REOTIMIZAÇÃO APLICADA</b><br>${recommendation.plan.modal}<br>O plano ativo foi atualizado a partir da posição atual. Tempo, isquemia e caminho já percorrido foram preservados.</p>`,
      );
      $("#action-feedback").textContent =
        "Novo plano aplicado. Deslocamento retomado.";
      $("#sim-status").textContent = "Executando";
      document
        .querySelectorAll("[data-logistic]")
        .forEach((button) => (button.disabled = false));
      clearRecommendation();
    } catch (error) {
      if (
        [
          "RECOMMENDATION_NOT_FOUND",
          "RECOMMENDATION_ALREADY_APPLIED",
          "RECOMMENDATION_STALE",
        ].includes(error.code)
      )
        clearRecommendation();
      $("#planning-result").insertAdjacentHTML(
        "beforeend",
        `<p class="reoptimization">Não foi possível aplicar a reotimização: ${error.message}</p>`,
      );
    }
  }
  function custom() {
    $("#planning-custom-fields").classList.toggle(
      "hidden",
      !$("#planning-custom").checked,
    );
  }
  function enhanceLocationSelect(select) {
    const wrapper = document.createElement("div"),
      trigger = document.createElement("button"),
      menu = document.createElement("div");
    wrapper.className = "location-select";
    trigger.type = "button";
    trigger.className = "location-select-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    menu.className = "location-select-menu";
    menu.setAttribute("role", "listbox");
    select.parentNode.insertBefore(wrapper, select);
    wrapper.append(select, trigger, menu);
    select.classList.add("location-select-native");
    select.setAttribute("aria-hidden", "true");
    select.tabIndex = -1;

    const close = () => {
      wrapper.classList.remove("open");
      trigger.setAttribute("aria-expanded", "false");
    };
    const sync = () => {
      trigger.textContent =
        select.selectedOptions[0]?.textContent || "Selecione";
      menu.querySelectorAll("[role='option']").forEach((option) => {
        const selected = option.dataset.value === select.value;
        option.classList.toggle("selected", selected);
        option.setAttribute("aria-selected", String(selected));
      });
    };
    [...select.options].forEach((option) => {
      const item = document.createElement("button");
      item.type = "button";
      item.setAttribute("role", "option");
      item.dataset.value = option.value;
      item.textContent = option.textContent;
      item.onclick = () => {
        select.value = option.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        sync();
        close();
        trigger.focus({ preventScroll: true });
      };
      menu.append(item);
    });
    trigger.onclick = () => {
      const willOpen = !wrapper.classList.contains("open");
      document
        .querySelectorAll(".location-select.open")
        .forEach((item) => item.classList.remove("open"));
      if (willOpen) {
        wrapper.classList.add("open");
        trigger.setAttribute("aria-expanded", "true");
        const selectedOption = menu.querySelector(".selected");
        if (selectedOption)
          menu.scrollTop = Math.max(
            0,
            selectedOption.offsetTop - menu.clientHeight / 2,
          );
      }
    };
    wrapper.onkeydown = (event) => {
      if (event.key === "Escape") {
        close();
        trigger.focus({ preventScroll: true });
      }
    };
    sync();
    return { wrapper, sync };
  }
  async function init() {
    const planningPanel = $("#intelligent-planning"),
      tableWrap = planningPanel.querySelector(":scope > .table-wrap"),
      backButton = $("#planning-back-optimal");
    if (tableWrap) {
      const comparison = document.createElement("details"),
        summary = document.createElement("summary");
      comparison.className = "technical-comparison";
      summary.textContent = "VER COMPARAÇÃO TÉCNICA DOS PLANOS";
      comparison.append(summary, tableWrap);
      if (backButton) comparison.append(backButton);
      $("#planning-result").insertAdjacentElement("afterend", comparison);
    }
    [profiles, scenarios] = await Promise.all([
      api("/api/planejamento/perfis"),
      api("/api/planejamento/cenarios"),
    ]);
    $("#planning-organ").innerHTML = profiles
      .map((item) => `<option value="${item.code}">${item.name}</option>`)
      .join("");
    $("#planning-scenario").innerHTML = scenarios
      .map((item) => `<option value="${item.id}">${item.name}</option>`)
      .join("");
    const locationMarkup = locationOptions
      .map((name) => `<option value="${name}">${name}</option>`)
      .join("");
    $("#planning-origin").innerHTML = locationMarkup;
    $("#planning-destination").innerHTML = locationMarkup;
    const planningSelects = [
      enhanceLocationSelect($("#planning-scenario")),
      enhanceLocationSelect($("#planning-organ")),
      enhanceLocationSelect($("#planning-origin")),
      enhanceLocationSelect($("#planning-destination")),
    ];
    syncPlanningSelects = () => planningSelects.forEach((item) => item.sync());
    document.addEventListener("click", (event) => {
      planningSelects.forEach(({ wrapper }) => {
        if (!wrapper.contains(event.target)) wrapper.classList.remove("open");
      });
    });
    setScenario();
    $("#planning-scenario").onchange = () => {
      if (window.lifeBoxExecutionActive) {
        $("#planning-scenario").value = activeScenario.id;
        syncPlanningSelects();
        $("#action-feedback").textContent =
          "Reinicie o transporte antes de trocar o cenário de demonstração.";
        return;
      }
      setScenario();
    };
    $("#planning-organ").onchange = renderProfile;
    $("#planning-science").onclick = science;
    $("#planning-calculate").onclick = () => calculate();
    $("#planning-custom").onchange = custom;
    $("#planning-table").onclick = (event) => {
      const id = event.target.dataset.viewPlan;
      if (id) showOnMap(lastResult.alternatives.find((item) => item.id === id));
    };
    $("#planning-back-optimal").onclick = () => showOnMap(lastResult.selected);
    document
      .querySelectorAll("[data-logistic]")
      .forEach((button) => (button.onclick = () => toggleLogistic(button)));
    document.addEventListener("click", (event) => {
      if (event.target.dataset.action === "reset") clearRecommendation();
      if (event.target.id === "apply-reoptimization") applyRecommendation();
    });
    window.lifeBoxRecalculate = (reason) => calculate(reason);
    window.lifeBoxResetLogistics = () => setScenario();
    window.lifeBoxClearReoptimizationRecommendation = clearRecommendation;
  }
  init().catch(console.error);
})();
