/**
 * ARCHIVO: js/math/latex.js
 * QUÉ ES: Convierte f(x) y las integrales de cada gesto a LaTeX (KaTeX).
 * PARA EXPLICAR: En la franja de resultados se ve la función real del problema
 * (ej. x²), no solo “f(x)” genérico.
 */

function needsParens(latex) {
  return /[+\-]/.test(latex);
}

function wrap(latex) {
  return needsParens(latex) ? `\\left(${latex}\\right)` : latex;
}

/** Expresión de aula → LaTeX simple (x^2, sin(x), sqrt(x), …). */
export function exprToLatex(expr) {
  let s = String(expr || "").trim();
  if (!s) return "f(x)";

  s = s.replace(/\s+/g, "");
  s = s.replace(/π/g, "pi");
  s = s.replace(/pi/gi, "\\pi");

  // abs(u) → |u|
  s = s.replace(/abs\(([^)]+)\)/gi, (_, inner) => `\\left|${exprToLatex(inner)}\\right|`);
  // sqrt(u)
  s = s.replace(/sqrt\(([^)]+)\)/gi, (_, inner) => `\\sqrt{${exprToLatex(inner)}}`);

  const fnMap = {
    sen: "\\sin",
    sin: "\\sin",
    cos: "\\cos",
    tan: "\\tan",
    ln: "\\ln",
    log: "\\log",
    exp: "\\exp",
  };
  s = s.replace(/\b(sen|sin|cos|tan|ln|log|exp)\(/gi, (m, name) => {
    const key = name.toLowerCase();
    return `${fnMap[key] || `\\mathrm{${key}}`}(`;
  });

  // potencias
  s = s.replace(/\^\(([^)]+)\)/g, "^{$1}");
  s = s.replace(/\^([a-zA-Z0-9\\]+)/g, "^{$1}");

  s = s.replace(/\*/g, "\\cdot ");
  return s;
}

export function numToLatex(n) {
  if (!Number.isFinite(Number(n))) return String(n);
  const v = Number(n);
  if (Number.isInteger(v)) return String(v);
  return String(v);
}

export function buildFxLatex(assignment) {
  const body = exprToLatex(assignment?.functionExpression || "");
  return `f(x) = ${body}`;
}

export function buildIntervalLatex(assignment) {
  const a = numToLatex(assignment?.interval?.a);
  const b = numToLatex(assignment?.interval?.b);
  return `[${a}, ${b}]`;
}

/** Integral / fórmula del modo con la f(x) real y [a,b] numéricos. */
export function buildModeLatex(result, assignment) {
  const fx = exprToLatex(assignment?.functionExpression);
  const a = numToLatex(assignment?.interval?.a);
  const b = numToLatex(assignment?.interval?.b);
  const fxw = wrap(fx);
  const axis = result?.axis === "y" ? "y" : "x";

  switch (result?.mode) {
    case "area":
      return `\\displaystyle \\int_{${a}}^{${b}} ${fxw}\\,dx`;
    case "volume_x":
      return `\\displaystyle V = \\pi \\int_{${a}}^{${b}} \\left(${fxw}\\right)^{2}\\,dx`;
    case "volume_y":
      return `\\displaystyle V = 2\\pi \\int_{${a}}^{${b}} x\\,${fxw}\\,dx`;
    case "surface":
      return axis === "y"
        ? `\\displaystyle S = 2\\pi \\int_{${a}}^{${b}} |x|\\sqrt{1+[f'(x)]^{2}}\\,dx`
        : `\\displaystyle S = 2\\pi \\int_{${a}}^{${b}} \\left|${fxw}\\right|\\sqrt{1+[f'(x)]^{2}}\\,dx`;
    case "arc":
      return `\\displaystyle L = \\int_{${a}}^{${b}} \\sqrt{1+[f'(x)]^{2}}\\,dx`;
    default:
      return result?.formula ? String(result.formula) : "—";
  }
}

export function renderKatex(el, latex, displayMode = false) {
  if (!el) return;
  if (typeof katex === "undefined") {
    el.textContent = latex;
    return;
  }
  try {
    katex.render(latex, el, {
      throwOnError: false,
      displayMode,
      strict: "ignore",
      output: "html",
    });
  } catch {
    el.textContent = latex;
  }
}
