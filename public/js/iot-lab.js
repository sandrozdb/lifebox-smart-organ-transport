const tabs = [...document.querySelectorAll("[data-lab-tab]")];
const feedback = document.querySelector("#lab-feedback");

function selectTab(name, moveFocus = false) {
  const selected = tabs.find((tab) => tab.dataset.labTab === name);
  if (!selected) return;

  tabs.forEach((tab) => {
    const active = tab === selected;
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
    document.getElementById(tab.getAttribute("aria-controls")).hidden = !active;
  });

  if (moveFocus) selected.focus();
  if (window.location.hash !== `#${name}`) {
    window.history.replaceState(null, "", `#${name}`);
  }
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectTab(tab.dataset.labTab));
  tab.addEventListener("keydown", (event) => {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(event.key)) return;

    event.preventDefault();
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? tabs.length - 1
          : (index +
              (event.key === "ArrowRight" ? 1 : -1) +
              tabs.length) %
            tabs.length;

    selectTab(tabs[next].dataset.labTab, true);
  });
});

const requestedTab = window.location.hash.slice(1);
if (tabs.some((tab) => tab.dataset.labTab === requestedTab)) {
  selectTab(requestedTab);
}

function updatePreview() {
  const temperature = Number(
    document.querySelector("#preview-temperature").value,
  );
  const impact = Number(
    document.querySelector("#preview-impact-range").value,
  );
  const alert = temperature < 4 || temperature > 8 || impact >= 3.5;
  const format = (number) => number.toFixed(1).replace(".", ",");

  document.querySelector("#preview-temp").textContent = temperature.toFixed(1);
  document.querySelector("#preview-impact").textContent = impact.toFixed(1);
  document.querySelector("#temperature-output").textContent =
    `${format(temperature)} °C`;
  document.querySelector("#impact-output").textContent = `${format(impact)} g`;
  document.querySelector("#preview-status").textContent = alert
    ? "STATUS: ALERTA"
    : "STATUS: NORMAL";
  document.querySelector("#preview-green").classList.toggle("on", !alert);
  document.querySelector("#preview-red").classList.toggle("on", alert);
  document.querySelector("#preview-buzzer").textContent = alert
    ? "Buzzer em alerta"
    : "Buzzer inativo";
}

document
  .querySelectorAll("#preview-temperature, #preview-impact-range")
  .forEach((control) => control.addEventListener("input", updatePreview));

updatePreview();

async function readBackendStatus() {
  const backendStatus = document.querySelector("#lab-backend-status");
  const deviceStatus = document.querySelector("#lab-device-status");

  try {
    const response = await fetch("/api/iot/status", {
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const state = await response.json();
    const modeLabel =
      state.mode === "DEMO" ? "Demonstração" : "IoT (Wokwi ou real)";
    backendStatus.textContent = `Backend: ${modeLabel}`;
    backendStatus.classList.toggle("ok", true);
    backendStatus.classList.remove("alert");

    const source = state.deviceId === "LIFEBOX-REAL-001"
      ? "ESP32 real"
      : state.deviceId === "LIFEBOX-WOKWI-001"
        ? "Wokwi"
        : state.deviceId || "sem dispositivo";
    deviceStatus.textContent = state.online
      ? `Online: ${source}`
      : `Dispositivo offline · último: ${source}`;
    deviceStatus.classList.toggle("ok", Boolean(state.online));
    deviceStatus.classList.toggle("alert", !state.online);
  } catch (_error) {
    backendStatus.textContent = "Backend indisponível";
    backendStatus.classList.remove("ok");
    backendStatus.classList.add("alert");
    deviceStatus.textContent = "Não foi possível consultar a telemetria";
    deviceStatus.classList.remove("ok");
  }
}

document.querySelectorAll("[data-activate-mode]").forEach((button) => {
  button.addEventListener("click", async () => {
    const mode = button.dataset.activateMode;
    button.disabled = true;
    feedback.textContent = "Atualizando modo no backend...";
    feedback.classList.remove("error");

    try {
      const response = await fetch("/api/iot/mode", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.erro || data.error || "Não foi possível alterar o modo.");
      }

      feedback.textContent =
        mode === "DEMO"
          ? "Demonstração ativada. Abra o dashboard para executar os cenários."
          : "Modo IoT ativado. Inicie o Wokwi para receber telemetria.";
      await readBackendStatus();
    } catch (error) {
      feedback.textContent = error.message;
      feedback.classList.add("error");
    } finally {
      button.disabled = false;
    }
  });
});

readBackendStatus();
window.setInterval(readBackendStatus, 6000);
