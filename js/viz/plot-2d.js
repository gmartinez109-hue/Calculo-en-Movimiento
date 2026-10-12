/**
 * ARCHIVO: js/viz/plot-2d.js
 * QUÉ ES: Gráficas 2D con Plotly (gestos 1 área y 5 arco) y conmutador 2D/3D.
 * PARA EXPLICAR: Dibuja f(x) en [a,b], sombrea el área o resalta el arco.
 * Si el gesto es 2, 3 o 4, pasa a las partículas 3D (solid-particles.js).
 * La gráfica ayuda a “ver” el concepto; el número sale del motor matemático.
 */
import { sampleCurve } from "../math/index.js";
import { showParticleSolid, hideParticleSolid } from "./solid-particles.js";

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export function renderPlot2D(assignment, modeResult, targetId = "plot2d") {
  const { xs, ys, a, b } = sampleCurve(assignment, 360);
  const line = cssVar("--plot-line", "#d4789a");
  const fill = cssVar("--plot-fill", "rgba(212,120,154,0.35)");
  const arc = cssVar("--plot-arc", "#9b7bb8");

  const traces = [
    {
      x: xs,
      y: ys,
      type: "scatter",
      mode: "lines",
      name: "f(x)",
      line: { color: line, width: 3 },
    },
  ];

  if (modeResult?.mode === "area") {
    traces.push({
      x: [...xs, b, a],
      y: [...ys, 0, 0],
      type: "scatter",
      fill: "toself",
      fillcolor: fill,
      line: { width: 0 },
      name: "Región",
      hoverinfo: "skip",
    });
  }

  if (modeResult?.mode === "arc") {
    traces[0].line = { color: arc, width: 5 };
  }

  const layout = {
    margin: { l: 50, r: 20, t: 30, b: 45 },
    paper_bgcolor: "rgba(247, 234, 243, 0.55)",
    plot_bgcolor: "rgba(247, 234, 243, 0.35)",
    title: { text: modeResult?.title || "Gráfica 2D", font: { size: 14 } },
    xaxis: { title: "x", zeroline: true },
    yaxis: { title: "y", zeroline: true },
    showlegend: false,
    annotations: [
      {
        x: a,
        y: 0,
        text: "a",
        showarrow: false,
        yshift: -14,
        font: { size: 12 },
      },
      {
        x: b,
        y: 0,
        text: "b",
        showarrow: false,
        yshift: -14,
        font: { size: 12 },
      },
    ],
  };

  window.Plotly.react(targetId, traces, layout, {
    displayModeBar: false,
    responsive: true,
  });
}

export function showPlotForMode(mode, assignment, modeResult) {
  const plot2d = document.getElementById("plot2d");
  const plot3d = document.getElementById("plot3d");
  const m = Number(mode);
  const needs3d = m === 2 || m === 3 || m === 4;

  if (needs3d) {
    plot2d.classList.add("hidden");
    plot3d.classList.remove("hidden");
    showParticleSolid(assignment, modeResult);
  } else {
    hideParticleSolid();
    plot3d.classList.add("hidden");
    plot2d.classList.remove("hidden");
    renderPlot2D(assignment, modeResult, "plot2d");
  }
}
