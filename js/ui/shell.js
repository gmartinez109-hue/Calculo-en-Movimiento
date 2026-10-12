/**
 * ARCHIVO: js/ui/shell.js
 * QUÉ ES: Enlace entre la interfaz HTML y la lógica (botones, formulario, teclado).
 * PARA EXPLICAR: Rellena nombres del equipo, el formulario del problema asignado
 * (función, a, b, eje) y escucha clics/teclas 1–5. Guarda el problema en el
 * navegador. No calcula integrales: solo orquesta la UI.
 */
import { MODES } from "../math/index.js";

const STORAGE_KEY = "cim-assignment-v1";

export function bindShell({
  theme,
  assignment,
  onMode,
  onStartCamera,
  onSkipCamera,
  onReset,
  onApplyAssignment,
}) {
  document.getElementById("product-name").textContent = theme.productName;
  document.getElementById("product-tagline").textContent = theme.tagline;
  document.title = `${theme.productName} — Cálculo Integral`;

  const institution = theme.institution || theme.institutionShort || "Areandina";
  const course = theme.course || "Cálculo integral";
  const professor = theme.professor || "";
  const logoSrc = theme.institutionLogo || "assets/brand/areandina-u.png";

  const welcomeInstitution = document.getElementById("welcome-institution");
  if (welcomeInstitution) welcomeInstitution.textContent = institution;
  const welcomeCourse = document.getElementById("welcome-course");
  if (welcomeCourse) welcomeCourse.textContent = course;
  const welcomeLogo = document.getElementById("welcome-logo");
  if (welcomeLogo) welcomeLogo.src = logoSrc;

  const headerInstitution = document.getElementById("header-institution");
  if (headerInstitution) headerInstitution.textContent = institution;
  const headerCourse = document.getElementById("header-course");
  if (headerCourse) headerCourse.textContent = course;
  const headerLogo = document.getElementById("header-logo");
  if (headerLogo) headerLogo.src = logoSrc;

  // Nombres solo una vez: badges rosados en orden de la foto (welcome)
  const team = document.getElementById("team-list");
  if (team) {
    team.innerHTML = "";
    (theme.team || []).forEach((name) => {
      const span = document.createElement("span");
      span.className = "team-pill";
      span.textContent = name;
      team.appendChild(span);
    });
  }

  const welcomeProfessor = document.getElementById("welcome-professor");
  if (welcomeProfessor) {
    welcomeProfessor.textContent = professor ? `Docente: ${professor}` : "";
  }

  const footerInstitution = document.getElementById("footer-institution");
  if (footerInstitution) footerInstitution.textContent = institution;
  const footerCourse = document.getElementById("footer-course");
  if (footerCourse) footerCourse.textContent = course;
  const footerProfessor = document.getElementById("footer-professor");
  if (footerProfessor) {
    footerProfessor.textContent = professor ? `Docente: ${professor}` : "";
  }
  const footerTeam = document.getElementById("footer-team");
  if (footerTeam) footerTeam.textContent = "";
  const footerLogo = document.getElementById("footer-logo");
  if (footerLogo) footerLogo.src = logoSrc;

  bindWelcomeTeamPhoto(theme);

  fillAssignmentForm(assignment);
  document.getElementById("notes-display").textContent = assignment.notes || "";

  document.getElementById("assignment-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const next = readAssignmentForm(assignment);
    onApplyAssignment?.(next);
  });

  document.querySelectorAll("[data-mode]").forEach((btn) => {
    btn.addEventListener("click", () => onMode(Number(btn.dataset.mode)));
  });

  document.getElementById("btn-start-camera")?.addEventListener("click", onStartCamera);
  document.getElementById("btn-skip-camera")?.addEventListener("click", onSkipCamera);
  document.getElementById("btn-camera")?.addEventListener("click", onStartCamera);
  document.getElementById("btn-reset")?.addEventListener("click", onReset);

  window.addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea, select")) return;
    const n = Number(e.key);
    if (n >= 1 && n <= 5) onMode(n);
    if (e.key === "r" || e.key === "R") onReset();
  });
}

export function fillAssignmentForm(assignment) {
  const fn = document.getElementById("input-fn");
  const a = document.getElementById("input-a");
  const b = document.getElementById("input-b");
  const axis = document.getElementById("input-axis");
  if (!fn) return;
  fn.value = assignment.functionExpression || "";
  a.value = assignment.interval?.a ?? "";
  b.value = assignment.interval?.b ?? "";
  axis.value = assignment.axis === "y" ? "y" : "x";
}

export function readAssignmentForm(base) {
  const fn = document.getElementById("input-fn").value.trim();
  const a = Number(document.getElementById("input-a").value);
  const b = Number(document.getElementById("input-b").value);
  const axis = document.getElementById("input-axis").value === "y" ? "y" : "x";
  if (!fn) throw new Error("Escribe la función f(x).");
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new Error("a y b deben ser números.");
  }
  if (!(b > a)) throw new Error("Debe cumplirse b > a.");

  return {
    ...base,
    functionExpression: fn,
    displayLatex: `f(x) = ${fn}`,
    interval: { a, b },
    axis,
    notes: base.notes || "Escribe la función, [a, b] y el eje, y pulsa Aplicar problema.",
  };
}

export function saveAssignmentLocal(assignment) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignment));
  } catch {
    /* ignore */
  }
}

export function loadAssignmentLocal(fallback) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!parsed?.functionExpression || !parsed?.interval) return fallback;
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}

export function setActiveMode(mode) {
  document.querySelectorAll("[data-mode]").forEach((btn) => {
    btn.classList.toggle("active", Number(btn.dataset.mode) === Number(mode));
  });
  const info = MODES[mode];
  const chip = document.getElementById("gesture-chip");
  if (info) {
    chip.textContent = `${mode} dedo${mode === 1 ? "" : "s"} → ${info.short}`;
    chip.classList.remove("warn");
    chip.classList.add("ok");
  }
}

export function hideWelcome() {
  document.getElementById("welcome-overlay")?.classList.add("hidden");
}

export function showToast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.remove("show"), 2200);
}

function bindWelcomeTeamPhoto(theme) {
  const src = theme.teamPhoto;
  if (!src) return;

  const alt = theme.team?.length
    ? `Equipo: ${theme.team.join(" · ")}`
    : "Equipo del proyecto";

  const welcomeWrap = document.getElementById("welcome-team-photo-wrap");
  const welcomeImg = document.getElementById("welcome-team-photo");
  if (welcomeWrap && welcomeImg) {
    welcomeImg.src = src;
    welcomeImg.alt = alt;
    welcomeWrap.hidden = false;
  }
}
