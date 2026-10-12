/**
 * ARCHIVO: js/viz/solid-particles.js
 * QUÉ ES: Sólido 3D con partículas (Three.js), gestos 2–4.
 * PARA EXPLICAR: Inspirado en el demo de la profesora, pero usando la función
 * asignada f(x) en [a,b]. Las partículas ilustran el volumen o la superficie;
 * NO calculan la integral (eso lo hace Simpson). Incluye ejes suaves tipo
 * marca de agua y rotación automática para apreciar el sólido.
 */
import { sampleCurve } from "../math/index.js";

/** Buffer máximo = Vol. X (64k). Vol. Y y superficie usan 32k. */
const MAX_N = 64000;
const N_VOLUME_X = 64000;
const N_DEFAULT = 32000;
const ROT_SPEED = 0.014;

let ready = false;
let scene, camera, renderer, points, geo, mat;
let axisGroup = null;
let pos, tgt, col, tcol;
let animId = 0;
let containerEl = null;
let titleEl = null;
let visible = false;
let rotY = 0;
let activeCount = N_DEFAULT;

function particleCountForMode(mode) {
  return mode === "volume_x" ? N_VOLUME_X : N_DEFAULT;
}

function mkCircleTex() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const cx = c.getContext("2d");
  const g = cx.createRadialGradient(64, 64, 0, 64, 64, 60);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.85)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  cx.fillStyle = g;
  cx.beginPath();
  cx.arc(64, 64, 60, 0, Math.PI * 2);
  cx.fill();
  return new THREE.CanvasTexture(c);
}

function makeAxisLabel(text, color) {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 64;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, 128, 64);
  ctx.font = "600 36px Nunito, Segoe UI, sans-serif";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.globalAlpha = 0.9;
  ctx.fillText(text, 64, 32);
  const tex = new THREE.CanvasTexture(c);
  const matSprite = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    opacity: 0.95,
  });
  const sprite = new THREE.Sprite(matSprite);
  sprite.scale.set(1.05, 0.52, 1);
  return sprite;
}

function makeWatermarkAxes(length = 4.2) {
  const group = new THREE.Group();
  group.name = "watermark-axes";

  const mkLine = (to, colorHex) => {
    const geoLine = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      to,
    ]);
    const matLine = new THREE.LineBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
    });
    return new THREE.Line(geoLine, matLine);
  };

  // Ejes del plano cartesiano — más marcados
  group.add(mkLine(new THREE.Vector3(length, 0, 0), 0xe84a7a)); // x
  group.add(mkLine(new THREE.Vector3(0, length, 0), 0x7a4fd4)); // y
  group.add(mkLine(new THREE.Vector3(0, 0, length), 0x2a8fd4)); // z
  group.add(mkLine(new THREE.Vector3(-length * 0.35, 0, 0), 0xe84a7a));
  group.add(mkLine(new THREE.Vector3(0, -length * 0.2, 0), 0x7a4fd4));
  group.add(mkLine(new THREE.Vector3(0, 0, -length * 0.35), 0x2a8fd4));

  // Rejilla del plano XZ — más visible
  const grid = new THREE.GridHelper(length * 1.6, 12, 0x9b7bb8, 0xb8a0b0);
  grid.material.transparent = true;
  grid.material.opacity = 0.48;
  grid.material.depthWrite = false;
  group.add(grid);

  const lx = makeAxisLabel("x", "rgba(220,50,100,0.98)");
  lx.position.set(length + 0.35, 0.05, 0);
  group.add(lx);

  const ly = makeAxisLabel("y", "rgba(100,60,200,0.98)");
  ly.position.set(0.1, length + 0.35, 0);
  group.add(ly);

  // z abajo del plano (no entre cámara y sólido) + color acorde a la rejilla
  const lz = makeAxisLabel("z", "rgba(155,123,184,0.95)");
  lz.position.set(0.15, -0.55, -(length + 0.25));
  lz.scale.set(0.85, 0.42, 1);
  group.add(lz);

  return group;
}

function setCol(i, c) {
  tcol[i * 3] = c.r;
  tcol[i * 3 + 1] = c.g;
  tcol[i * 3 + 2] = c.b;
}

function ensureInit(containerId = "plot3d") {
  if (ready) return;
  if (typeof THREE === "undefined") {
    throw new Error("Three.js no está cargado");
  }

  containerEl = document.getElementById(containerId);
  if (!containerEl) throw new Error("No existe el contenedor 3D");

  containerEl.innerHTML = "";
  containerEl.classList.add("plot3d-particles");

  titleEl = document.createElement("div");
  titleEl.className = "plot3d-title";
  titleEl.textContent = "Sólido 3D";
  containerEl.appendChild(titleEl);

  const w = Math.max(containerEl.clientWidth, 320);
  const h = Math.max(containerEl.clientHeight, 320);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 200);
  camera.position.set(0, 1.2, 7.5);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(w, h);
  // Tono claro translúcido acorde al concepto pastel
  renderer.setClearColor(0xf7eaf3, 0.55);
  containerEl.appendChild(renderer.domElement);

  const tex = mkCircleTex();
  geo = new THREE.BufferGeometry();
  pos = new Float32Array(MAX_N * 3);
  tgt = new Float32Array(MAX_N * 3);
  col = new Float32Array(MAX_N * 3);
  tcol = new Float32Array(MAX_N * 3);

  for (let i = 0; i < MAX_N * 3; i++) {
    pos[i] = (Math.random() - 0.5) * 8;
    col[i] = 0.8;
  }

  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.setDrawRange(0, activeCount);

  mat = new THREE.PointsMaterial({
    size: 0.038,
    map: tex,
    vertexColors: true,
    transparent: true,
    opacity: 0.92,
    blending: THREE.NormalBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  points = new THREE.Points(geo, mat);
  scene.add(points);

  axisGroup = makeWatermarkAxes(4.2);
  scene.add(axisGroup);

  window.addEventListener("resize", onResize);
  ready = true;
  animate();
}

function onResize() {
  if (!ready || !containerEl) return;
  const w = Math.max(containerEl.clientWidth, 320);
  const h = Math.max(containerEl.clientHeight, 320);
  camera.aspect = w / h;
  renderer.setSize(w, h);
  if (visible) fitCameraToTargets();
  else camera.updateProjectionMatrix();
}

function animate() {
  animId = requestAnimationFrame(animate);
  if (!ready) return;

  const posAttr = geo.getAttribute("position");
  const colAttr = geo.getAttribute("color");

  for (let i = 0; i < activeCount; i++) {
    for (let j = 0; j < 3; j++) {
      const idx = i * 3 + j;
      posAttr.array[idx] += (tgt[idx] - posAttr.array[idx]) * 0.08;
      colAttr.array[idx] += (tcol[idx] - colAttr.array[idx]) * 0.06;
    }
  }
  posAttr.needsUpdate = true;
  colAttr.needsUpdate = true;

  if (visible) {
    rotY += ROT_SPEED;
    points.rotation.y = rotY;
    points.rotation.x = Math.sin(rotY * 0.35) * 0.12;
    // Ejes fijos (marca de agua): no rotan con el sólido
    renderer.render(scene, camera);
  }
}

/**
 * mode: volume_x | volume_y | surface
 * Visual:
 *   2 volume_x → sólido LLENO (discos, rosa)
 *   3 volume_y → sólido LLENO (capas, lavanda)
 *   4 surface  → CASCARÓN hueco (solo superficie, cian)
 */
function morphSolid(assignment, modeResult) {
  const { f, a, b } = sampleCurve(assignment, 2);
  const mode = modeResult?.mode || "volume_x";
  const axis = modeResult?.axis === "y" ? "y" : "x";
  const C = new THREE.Color();
  const span = Math.max(b - a, 1e-6);

  let maxR = 0.05;
  const probe = 100;
  for (let i = 0; i <= probe; i++) {
    const x = a + (span * i) / probe;
    const y = f(x);
    if (!Number.isFinite(y)) continue;
    maxR = Math.max(maxR, Math.abs(y), Math.abs(x));
  }
  // Escala base moderada; luego la cámara se ajusta al bounding box
  const scale = 4.2 / (maxR * 2 || 1);
  const xMid = (a + b) / 2;

  // Muchos puntos finos
  if (mode === "surface") {
    mat.size = 0.032;
    mat.opacity = 0.9;
  } else if (mode === "volume_y") {
    mat.size = 0.036;
    mat.opacity = 0.93;
  } else {
    mat.size = 0.038;
    mat.opacity = 0.94;
  }
  mat.blending = THREE.NormalBlending;

  activeCount = particleCountForMode(mode);
  geo.setDrawRange(0, activeCount);

  for (let i = 0; i < activeCount; i++) {
    const x = a + span * Math.random();
    const fx = f(x);
    if (!Number.isFinite(fx)) {
      tgt[i * 3] = tgt[i * 3 + 1] = tgt[i * 3 + 2] = 0;
      continue;
    }

    const theta = Math.random() * Math.PI * 2;
    let px;
    let py;
    let pz;
    let shade;

    if (mode === "volume_y") {
      // LLENO: capas cilíndricas alrededor del eje y
      const R = Math.abs(x);
      const rr = R * Math.sqrt(Math.random()); // relleno del disco
      px = rr * Math.cos(theta);
      py = fx;
      pz = rr * Math.sin(theta);
      shade = Math.min(1, rr / (maxR || 1));
      C.setHSL(0.74 - shade * 0.06, 0.88, 0.52 + shade * 0.18); // lavanda vivo
    } else if (mode === "surface") {
      // CASCARÓN: solo la cáscara (hueco por dentro)
      if (axis === "y") {
        const R = Math.abs(x);
        const rr = R * (0.988 + 0.012 * Math.random());
        px = rr * Math.cos(theta);
        py = fx;
        pz = rr * Math.sin(theta);
        shade = Math.min(1, Math.abs(fx - a) / span);
      } else {
        const R = Math.abs(fx);
        const rr = R * (0.988 + 0.012 * Math.random());
        px = x;
        py = rr * Math.cos(theta);
        pz = rr * Math.sin(theta);
        shade = Math.min(1, (x - a) / span);
      }
      C.setHSL(0.52 - shade * 0.05, 0.9, 0.5 + shade * 0.14); // cian vivo
    } else {
      // LLENO: discos alrededor del eje x — 64k puntos
      const R = Math.abs(fx);
      const rr = R * Math.sqrt(Math.random()); // relleno del disco
      px = x;
      py = rr * Math.cos(theta);
      pz = rr * Math.sin(theta);
      shade = Math.min(1, rr / (maxR || 1));
      C.setHSL(0.95 - shade * 0.08, 0.9, 0.52 + shade * 0.16); // rosa vivo
    }

    tgt[i * 3] = (px - (mode === "volume_y" || (mode === "surface" && axis === "y") ? 0 : xMid)) * scale;
    tgt[i * 3 + 1] = py * scale;
    tgt[i * 3 + 2] = pz * scale;
    setCol(i, C);
  }

  fitCameraToTargets();
}

/** Ajusta la cámara para que el sólido quepa completo en el contenedor. */
function fitCameraToTargets() {
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  for (let i = 0; i < activeCount; i++) {
    const x = tgt[i * 3];
    const y = tgt[i * 3 + 1];
    const z = tgt[i * 3 + 2];
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) continue;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }

  if (!Number.isFinite(minX)) {
    camera.position.set(0, 1.2, 7.5);
    camera.lookAt(0, 0, 0);
    camera.fov = 50;
    camera.updateProjectionMatrix();
    return;
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const cz = (minZ + maxZ) / 2;
  const sizeX = Math.max(maxX - minX, 0.2);
  const sizeY = Math.max(maxY - minY, 0.2);
  const sizeZ = Math.max(maxZ - minZ, 0.2);
  const radius = 0.5 * Math.sqrt(sizeX * sizeX + sizeY * sizeY + sizeZ * sizeZ);

  camera.fov = 50;
  const fovRad = (camera.fov * Math.PI) / 180;
  const aspect = Math.max(camera.aspect || 1, 0.5);
  const fitHeight = radius / Math.tan(fovRad / 2);
  const fitWidth = radius / (Math.tan(fovRad / 2) * aspect);
  // Margen breve: sólido completo, sin quedar demasiado pequeño
  const dist = Math.max(fitHeight, fitWidth) * 1.18;

  camera.position.set(cx, cy + radius * 0.08, cz + dist);
  camera.lookAt(cx, cy, cz);
  camera.updateProjectionMatrix();
}

function solidCaption(modeResult) {
  const mode = modeResult?.mode || "volume_x";
  if (mode === "surface") {
    return modeResult?.title || "Área superficial";
  }
  if (mode === "volume_y") {
    return modeResult?.title || "Volumen eje y (sólido lleno)";
  }
  return modeResult?.title || "Volumen eje x (sólido lleno)";
}

export function showParticleSolid(assignment, modeResult) {
  ensureInit("plot3d");
  visible = true;
  containerEl?.classList.remove("hidden");
  if (titleEl) titleEl.textContent = solidCaption(modeResult);
  requestAnimationFrame(() => {
    morphSolid(assignment, modeResult);
    onResize();
    if (renderer && scene && camera) renderer.render(scene, camera);
  });
}

export function hideParticleSolid() {
  visible = false;
}
