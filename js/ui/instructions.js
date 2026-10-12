/**
 * ARCHIVO: js/ui/instructions.js
 * QUÉ ES: Textos del “Modo explicar” (un párrafo por gesto).
 * PARA EXPLICAR: Al activar el botón, aparece un resumen oral de qué integral
 * corresponde a 1–5 dedos. Sirve de guion rápido durante la demo.
 */
const EXPLAIN = {
  1: "Con 1 dedo calculamos el área. Mostramos la integral definida (con signo) y, si la curva cruza el eje x, el área geométrica sumando las partes positivas.",
  2: "Con 2 dedos vemos el SÓLIDO LLENO al girar alrededor del eje x (discos): V = π ∫ [f(x)]² dx. Las partículas rellenan el interior.",
  3: "Con 3 dedos vemos el SÓLIDO LLENO al girar respecto al eje y (capas): V = 2π ∫ x f(x) dx. También es volumen, no una cáscara.",
  4: "Con 4 dedos vemos solo el CASCARÓN (superficie hueca), no el volumen: S = 2π ∫ |f| √(1+[f']²) dx. El interior queda vacío.",
  5: "Con 5 dedos medimos la longitud de arco de la curva en [a, b]: L = ∫ √(1+[f'(x)]²) dx.",
};

export function setExplainMode(visible, mode = 1) {
  const box = document.getElementById("explain-box");
  box.classList.toggle("visible", visible);
  box.textContent = EXPLAIN[mode] || "";
}

export function updateExplainForMode(mode, explainOn) {
  if (!explainOn) return;
  setExplainMode(true, mode);
}
