/**
 * ARCHIVO: js/math/surface.js
 * QUÉ ES: Cálculo del gesto 4 — área superficial de revolución.
 * PARA EXPLICAR: Integra la “cáscara” al girar la curva.
 *   Eje x: S = 2π ∫ |f(x)| √(1+[f'(x)]²) dx
 *   Eje y: S = 2π ∫ |x| √(1+[f'(x)]²) dx
 * Usa la derivada numérica de parser.js + Simpson.
 */
import { simpson } from "./integrate.js";
import { derivative } from "./parser.js";

export function computeSurface(f, a, b, axis = "x", n = 800) {
  const ax = axis === "y" ? "y" : "x";

  const integrandX = (x) => {
    const y = f(x);
    const dy = derivative(f, x);
    return Math.abs(y) * Math.sqrt(1 + dy * dy);
  };

  const integrandY = (x) => {
    const dy = derivative(f, x);
    return Math.abs(x) * Math.sqrt(1 + dy * dy);
  };

  const integrand = ax === "x" ? integrandX : integrandY;
  const res = simpson(integrand, a, b, n);
  const value = 2 * Math.PI * res.value;

  return {
    mode: "surface",
    title: `Área superficial — eje ${ax}`,
    concept: "Área superficial de revolución",
    formula:
      ax === "x"
        ? "S = 2π ∫_a^b |f(x)| √(1+[f'(x)]²) dx"
        : "S = 2π ∫_a^b |x| √(1+[f'(x)]²) dx",
    value,
    displayValue: value,
    unitsKey: "surface",
    method: `Simpson (n=${res.n}) + derivada numérica centrada`,
    estimateError: res.estimateError != null ? 2 * Math.PI * res.estimateError : null,
    axis: ax,
    note: `Área superficial (cascarón hueco) al girar la curva alrededor del eje ${ax}. No es un volumen lleno.`,
  };
}
