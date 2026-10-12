/**
 * ARCHIVO: js/ui/results.js
 * QUÉ ES: Panel de “Resultado” con KaTeX.
 * PARA EXPLICAR: Muestra f(x) real, la integral tipográfica y el valor numérico
 * con unidades — lo que la profesora quiere ver en la demo.
 */
import {
  buildModeLatex,
  renderKatex,
} from "../math/latex.js";

function formatNumber(value) {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs !== 0 && (abs < 1e-4 || abs >= 1e6)) return value.toExponential(4);
  return value.toLocaleString("es-CO", { maximumFractionDigits: 6 });
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

export function renderResults(result, assignment) {
  const units = assignment.units?.[result.unitsKey] || "";
  setText("result-title", result.title);
  setText("result-concept", result.concept);

  const formulaLatex = buildModeLatex(result, assignment);
  renderKatex(document.getElementById("result-formula"), formulaLatex, true);

  const valueText = `${formatNumber(result.displayValue)} ${units}`.trim();
  setText("result-value", valueText);
  setText("result-method", result.method || "");
  setText("result-note", result.note || "");

  const extra = document.getElementById("result-extra");
  if (result.mode === "area" && extra) {
    extra.innerHTML = `
      <div><dt>Integral con signo</dt><dd>${formatNumber(result.signedIntegral)} ${units}</dd></div>
      <div><dt>Área geométrica</dt><dd>${formatNumber(result.geometricArea)} ${units}</dd></div>
      <div><dt>Raíces detectadas</dt><dd>${result.roots?.length ? result.roots.map(formatNumber).join(", ") : "ninguna"}</dd></div>
    `;
    extra.classList.remove("hidden");
  } else if (extra) {
    extra.innerHTML = "";
    extra.classList.add("hidden");
  }

  if (result.estimateError != null) {
    setText("result-error", `Error estimado (n vs 2n): ${formatNumber(result.estimateError)}`);
  } else {
    setText("result-error", "");
  }
}

export function clearResults() {
  setText("result-title", "Sin cálculo aún");
  setText("result-concept", "Elige un gesto o botón (1–5)");
  const formulaEl = document.getElementById("result-formula");
  if (formulaEl) formulaEl.textContent = "—";
  setText("result-value", "—");
  setText("result-method", "");
  setText("result-note", "");
  setText("result-error", "");
  document.getElementById("result-extra")?.classList.add("hidden");
}
