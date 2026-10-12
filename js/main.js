/**
 * ARCHIVO: js/main.js
 * QUÉ ES: “Cerebro” o coordinador de la aplicación.
 * PARA EXPLICAR: Arranca el programa, carga el problema y el tema visual, conecta
 * la cámara/gestos con los cálculos y las gráficas. Cuando eliges un gesto (1–5)
 * o un botón, aquí se pide el resultado matemático y se actualiza la pantalla.
 * También permite aplicar una nueva función y reiniciar.
 */
import { loadConfig, applyTheme } from "./config-loader.js";
import { runMode, MODES, sampleCurve } from "./math/index.js";
import { runMathChecks } from "./math/__checks.js";
import { showPlotForMode, renderPlot2D } from "./viz/plot-2d.js";
import { hideParticleSolid } from "./viz/solid-particles.js";
import { createGestureEngine } from "./gesture-engine.js";
import {
  bindShell,
  setActiveMode,
  hideWelcome,
  showToast,
  fillAssignmentForm,
  loadAssignmentLocal,
  saveAssignmentLocal,
} from "./ui/shell.js";
import { renderResults, clearResults } from "./ui/results.js";

let assignment = null;
let theme = null;
let currentMode = null;
let gestureEngine = null;

function setStatus(text) {
  const el = document.getElementById("status-text");
  if (el) el.textContent = text;
}

function applyMode(mode, source = "manual") {
  try {
    const result = runMode(mode, assignment);
    currentMode = mode;
    setActiveMode(mode);
    renderResults(result, assignment);
    showPlotForMode(mode, assignment, result);
    showToast(
      source === "gesture"
        ? `Gesto confirmado: ${mode} → ${MODES[mode].short}`
        : `Modo ${mode}: ${MODES[mode].short}`
    );
    if (source === "manual") {
      setStatus(`Modo activo: ${MODES[mode].short}`);
    }
  } catch (err) {
    console.error(err);
    showToast(err.message || "Error en el cálculo");
    setStatus(err.message || "Error en el cálculo");
  }
}

function applyAssignment(next) {
  try {
    sampleCurve(next, 10);
    assignment = next;
    saveAssignmentLocal(assignment);
    document.getElementById("notes-display").textContent = assignment.notes || "";
    fillAssignmentForm(assignment);
    gestureEngine?.resetStability();
    if (currentMode) {
      applyMode(currentMode, "manual");
    } else {
      hideParticleSolid();
      renderPlot2D(assignment, null, "plot2d");
      document.getElementById("plot3d").classList.add("hidden");
      document.getElementById("plot2d").classList.remove("hidden");
    }
    showToast("Problema aplicado");
    setStatus(`f(x)=${assignment.functionExpression} en [${assignment.interval.a}, ${assignment.interval.b}]`);
  } catch (err) {
    console.error(err);
    showToast(err.message || "No se pudo aplicar el problema");
  }
}

function resetApp() {
  currentMode = null;
  clearResults();
  document.querySelectorAll("[data-mode]").forEach((b) => b.classList.remove("active"));
  const chip = document.getElementById("gesture-chip");
  chip.textContent = "Esperando gesto o botón";
  chip.classList.remove("ok");
  gestureEngine?.resetStability();
  hideParticleSolid();
  renderPlot2D(assignment, null, "plot2d");
  document.getElementById("plot3d").classList.add("hidden");
  document.getElementById("plot2d").classList.remove("hidden");
  setStatus("Reiniciado — elige 1 a 5 (sostén el gesto 1.5 s)");
  showToast("Aplicación reiniciada");
}

async function startCamera() {
  hideWelcome();
  const video = document.getElementById("webcam");
  try {
    await gestureEngine.start(video);
    showToast("Cámara activada — sostén el gesto 1 segundo");
  } catch (err) {
    console.error(err);
    showToast("Sin cámara — usa botones 1–5");
    document.getElementById("camera-placeholder").textContent =
      "Cámara no disponible. Usa los botones o las teclas 1–5.";
  }
}

function skipCamera() {
  hideWelcome();
  setStatus("Modo manual — botones o teclas 1–5");
  showToast("Puedes usar botones o teclado");
}

async function boot() {
  const cfg = await loadConfig();
  theme = cfg.theme;
  assignment = loadAssignmentLocal(cfg.assignment);
  // Notas de UI siempre desde config (producto final; evita texto viejo en localStorage)
  assignment.notes = cfg.assignment.notes || "";
  applyTheme(theme);

  sampleCurve(assignment, 10);

  gestureEngine = createGestureEngine({
    onFingers: (n) => applyMode(n, "gesture"),
    onStatus: setStatus,
  });

  bindShell({
    theme,
    assignment,
    onMode: (m) => applyMode(m, "manual"),
    onStartCamera: startCamera,
    onSkipCamera: skipCamera,
    onReset: resetApp,
    onApplyAssignment: applyAssignment,
  });

  clearResults();
  renderPlot2D(assignment, null, "plot2d");
  document.getElementById("plot3d").classList.add("hidden");

  const checks = runMathChecks();
  const failed = checks.filter((c) => !c.ok);
  console.table(checks);
  if (failed.length) {
    console.warn("Algunas autopruebas matemáticas fallaron", failed);
  } else {
    console.info("Autopruebas matemáticas OK");
  }

  setStatus("Listo — aplica el problema y usa cámara o 1–5");
}

boot().catch((err) => {
  console.error(err);
  document.body.innerHTML = `<p style="padding:2rem;font-family:sans-serif">Error al cargar: ${err.message}. Abre el proyecto con un servidor local (no file://).</p>`;
});
