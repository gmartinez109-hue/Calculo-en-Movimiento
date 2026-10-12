/**
 * ARCHIVO: js/math/volume.js
 * QUÉ ES: Cálculo de los gestos 2 y 3 — volúmenes de revolución.
 * PARA EXPLICAR:
 *   • Eje x (2 dedos): método de discos  V = π ∫_a^b [f(x)]² dx
 *   • Eje y (3 dedos): capas cilíndricas V = 2π ∫_a^b x f(x) dx
 * El número lo da Simpson; la figura 3D solo ilustra el sólido.
 */
import { simpson } from "./integrate.js";

export function computeVolume(f, a, b, axis = "x", n = 800) {
  const ax = axis === "y" ? "y" : "x";

  if (ax === "x") {
    const integrand = (x) => {
      const y = f(x);
      return y * y;
    };
    const res = simpson(integrand, a, b, n);
    const value = Math.PI * res.value;
    return {
      mode: "volume_x",
      title: "Volumen eje x — sólido lleno (discos)",
      concept: "Método de discos · sólido lleno",
      formula: "V = π ∫_a^b [f(x)]² dx",
      value,
      displayValue: value,
      unitsKey: "volume",
      method: `Discos + Simpson (n=${res.n})`,
      estimateError: res.estimateError != null ? Math.PI * res.estimateError : null,
      axis: "x",
      note: "Se gira la región bajo y = f(x) alrededor del eje x.",
    };
  }

  const integrand = (x) => x * f(x);
  const res = simpson(integrand, a, b, n);
  const value = 2 * Math.PI * res.value;
  return {
    mode: "volume_y",
    title: "Volumen eje y — sólido lleno (capas)",
    concept: "Método de capas · sólido lleno",
    formula: "V = 2π ∫_a^b x f(x) dx",
    value,
    displayValue: value,
    unitsKey: "volume",
    method: `Capas cilíndricas + Simpson (n=${res.n})`,
    estimateError: res.estimateError != null ? 2 * Math.PI * res.estimateError : null,
    axis: "y",
    note: "Capas: radio x y altura f(x).",
  };
}
