// ---------------------------------------------------------------------------
// main.js: renderer, camera, render-on-demand, resize, HTML layout, GUI.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'lil-gui';
import { config } from './config.js';
import { createFabric } from './fabric.js';
import { createTransitions } from './transition.js';
import { createRouter } from './router.js';
import { pages } from './pages.js';
import { clipByLine, intersectConvex, area } from './polygons.js';
import { FONTS, applyFonts } from './fonts.js';
import { stitchPhotos } from './photoStitches.js';
import './style.css';

// Debug overlays can be switched on from the URL, e.g. ?debug=wireframe,grid
for (const key of new URLSearchParams(window.location.search).get('debug')?.split(',') ?? []) {
  if (key in config.debug) config.debug[key] = true;
}

const els = {
  gl: document.querySelector('#gl'),
  content: document.querySelector('#content'),
  scroller: document.querySelector('#scroller'),
  header: document.querySelector('.site-header'),
  navLinks: document.querySelectorAll('.site-header nav a[data-link]'),
};

// --- Renderer ----------------------------------------------------------------
// alpha: true + a fully transparent clear color = the canvas is see-through
// wherever there's no cloth. That's how the header (an HTML element BEHIND
// the canvas) shows through the gap the folded corners leave.
const renderer = new THREE.WebGLRenderer({ canvas: els.gl, antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0);

// --- Scene & camera ------------------------------------------------------------
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(config.camera.fov, 1, 0.1, 100);

// We want the plane at z = 0 to fill exactly 2 world units of height.
// For a perspective camera, visible height at distance D is 2 * D * tan(fov/2),
// so D = 1 / tan(fov/2) gives a visible height of 2.
const VIEW_HEIGHT = 2;
const cameraDistance = 1 / Math.tan(THREE.MathUtils.degToRad(config.camera.fov / 2));
camera.position.set(0, 0, cameraDistance);

// OrbitControls: drag to look at the cloth from the side. Debug only.
const controls = new OrbitControls(camera, els.gl);
controls.enabled = false;

const fabric = createFabric(config);
scene.add(fabric.group);

// --- Render on demand ------------------------------------------------------------
// We only draw when something changed. requestRender() schedules ONE frame;
// calling it 10 times before that frame still draws once. When nothing
// changes, nothing runs, so idle costs ~0% GPU.
let renderQueued = false;
function requestRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    renderer.render(scene, camera);
  });
}
controls.addEventListener('change', requestRender);

// --- World → CSS pixels --------------------------------------------------------------
// Project a 3D point through the camera, exactly like the GPU does, then
// convert from "normalized device coordinates" (-1..1) to CSS pixels.
// (Lifted flaps are closer to the camera, so they look a little bigger:
// projecting handles that for us.)
const tmp = new THREE.Vector3();
function toScreen(p) {
  tmp.set(p.x, p.y, p.z ?? 0).project(camera);
  return { x: ((tmp.x + 1) / 2) * window.innerWidth, y: ((1 - tmp.y) / 2) * window.innerHeight };
}

// A polygon in CSS pixels → an SVG path string.
function toPath(poly) {
  if (!poly.length) return '';
  return 'M' + poly.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L') + ' Z';
}

// The lowest point (CSS px) any flap reaches over the text column, for a
// given fold state, plus a little breathing room. 0 if no flap is there.
function flapBottomOverText(state) {
  const leftPx = config.layout.contentLeft * window.innerWidth;
  const { flaps } = fabric.folds(fabric.measure(viewWidth(), VIEW_HEIGHT, state));
  let bottom = 0;
  for (const flap of Object.values(flaps)) {
    if (flap.length < 3) continue;
    // only the part of the flap that's over the text column (x ≥ leftPx)
    const overText = clipByLine(flap.map(toScreen), { x: leftPx, y: 0 }, { x: 1, y: 0 }, 1);
    for (const p of overText) bottom = Math.max(bottom, p.y + 16);
  }
  return Math.round(bottom);
}

// The header's scroll box spans the gap between the two creases (at rest),
// measured at the height of the nav text. Its edges sit just under the
// cloth, so links slide out from under the fabric edge as you scroll, and
// the box's own straight edges are never visible.
const NAV_TOP = 34; // px: header padding-top + nav padding-top (style.css)
function headerEdges(rest) {
  const crossing = (bar) => {
    const a = toScreen(bar.pin);
    const b = toScreen({ x: bar.pin.x + bar.dir.x * bar.len, y: bar.pin.y + bar.dir.y * bar.len });
    return a.x + ((NAV_TOP - a.y) * (b.x - a.x)) / (b.y - a.y);
  };
  // the crease wobbles by up to waveAmp, so tuck the edges that much further in
  const margin = (config.fold.waveAmp / VIEW_HEIGHT) * window.innerHeight + 6;
  return {
    left: Math.max(0, crossing(rest.bars.strip) - margin),
    right: Math.min(window.innerWidth, crossing(rest.bars.main) + margin),
  };
}

// Lines the HTML up with the cloth.
function applyLayout(m) {
  const root = document.documentElement.style;
  const restState = { unfold: 1, drop: 1, tug: 0, lift: 0 };
  const rest = fabric.measure(viewWidth(), VIEW_HEIGHT, restState);
  // Where the text starts: the configured spot, or below the resting flap.
  const top = Math.max(config.layout.contentTop * window.innerHeight, flapBottomOverText(restState));
  // Where text scrolls out of view: a straight line just under the flap, so
  // it never disappears along the flap's diagonal edge (which would give
  // away that the curve is fake). As scrolling pushes the flap up, the line
  // rises with it, so the text looks like it's pushing the cloth.
  const textLine = flapBottomOverText({ unfold: 1, drop: 1, tug: 0, lift: config.scrollLift.progress });
  textLineY = textLine;
  const seamPx = toScreen({ x: m.seamX, y: 0 }).x;
  const edges = headerEdges(rest);
  root.setProperty('--seam-x', `${seamPx}px`);
  root.setProperty('--content-left', `${config.layout.contentLeft * 100}vw`);
  root.setProperty('--text-top', `${top}px`);
  root.setProperty('--header-left', `${edges.left}px`);
  root.setProperty('--header-width', `${Math.max(0, edges.right - edges.left)}px`);
  // By default the name starts halfway between the screen edge and the seam.
  setHeaderHome(Math.max(0, seamPx / 2 - edges.left));

  // The text is only VISIBLE where the front of the main panel shows:
  //   the flat part of the panel, minus wherever a flap lies on top of it.
  // With the "evenodd" fill rule, a second shape inside the first cuts a hole
  // in it, so path(flat) + path(flap) = flat minus flap. Each flap gets its
  // own element (#content for the main flap, #scroller inside it for the
  // strip's flap), because two holes that overlap would cancel out under
  // evenodd. Nested clips multiply, so both holes stay holes.
  // (clip-path also stops clicks in the hidden parts, so the header
  // underneath stays clickable.)
  const { flatMain, flaps } = fabric.folds(m);
  const flat = flatMain.map(toScreen);
  const cover = (flap) => (flap.length >= 3 ? intersectConvex(flap.map(toScreen), flat) : []);
  const mainCover = cover(flaps.main);
  const stripCover = cover(flaps.strip);

  els.content.style.clipPath = area(flat) > 1
    ? `path(evenodd, "${toPath(flat)} ${area(mainCover) > 1 ? toPath(mainCover) : ''}")`
    : 'inset(100%)'; // nothing visible

  // #scroller: everything below the text line, minus the strip's flap if it
  // lies over the text (it can, mid-tug).
  const W = window.innerWidth;
  const H = window.innerHeight;
  const below = [{ x: 0, y: textLine }, { x: W, y: textLine }, { x: W, y: H }, { x: 0, y: H }];
  const stripHole = area(stripCover) > 1 ? intersectConvex(stripCover, below) : [];
  els.scroller.style.clipPath = `path(evenodd, "${toPath(below)} ${area(stripHole) > 1 ? toPath(stripHole) : ''}")`;
}

// One function to call after ANY change: config → uniforms, HTML, one frame.
let refreshGui = () => {}; // set once the GUI exists (bottom of file)
function update() {
  const m = fabric.sync(viewWidth(), VIEW_HEIGHT);
  applyLayout(m);
  requestRender();
  refreshGui();
}

// Switch fabric (each page has its own linen colour).
function setFabric(name) {
  fabric.setFabric(name);
}

// Theme: colours for what's under the fabric and for the text on it.
function applyTheme() {
  const t = config.themes[config.theme];
  const root = document.documentElement.style;
  root.setProperty('--backdrop', t.base);
  root.setProperty('--base-image', t.baseImage);
  root.setProperty('--base-size', t.baseSize);
  root.setProperty('--header-ink', t.headerInk);
  root.setProperty('--nav-ink', t.navInk);
  root.setProperty('--ink', t.ink);
  root.setProperty('--muted', t.muted);
  root.setProperty('--stitch', config.look.stitchColor);
  root.setProperty('--marker', t.marker);
}
// Copy a palette from config.palettes into a theme (the current one by default).
function applyPalette(name, themeName = config.theme) {
  const p = config.palettes[name];
  if (!p) return;
  const t = config.themes[themeName];
  t.palette = name;
  Object.assign(t, { ink: p.ink, muted: p.muted, marker: p.marker });
  for (const [key, colours] of Object.entries(p.fabrics)) Object.assign(t.fabrics[key], colours);
}
// Fill in every theme's colours from its palette.
for (const [themeName, t] of Object.entries(config.themes)) applyPalette(t.palette, themeName);
applyTheme();

// --- Header: a sideways scroll that loops --------------------------------------
// The header sits under the cloth and is wider than the gap, so it scrolls
// sideways. To make it loop, there are 5 copies of the name + nav in a row.
// Whenever you scroll more than one copy's width away from the middle copy,
// we jump back by exactly one copy. The copies are identical, so the jump
// is invisible and the row seems endless.
const COPIES = 5;
const firstSet = els.header.querySelector('.header-set');
for (let i = 1; i < COPIES; i++) {
  const copy = firstSet.cloneNode(true);
  copy.setAttribute('aria-hidden', 'true');                         // screen readers: just the original
  copy.querySelectorAll('a').forEach((a) => a.setAttribute('tabindex', '-1')); // keyboard: just the original
  els.header.appendChild(copy);
}
const headerSets = els.header.querySelectorAll('.header-set');
els.navLinks = els.header.querySelectorAll('nav a[data-link]'); // all copies, for aria-current

const setWidth = () => headerSets[1].offsetLeft - headerSets[0].offsetLeft;
const MIDDLE = Math.floor(COPIES / 2);

els.header.addEventListener('scroll', () => {
  const w = setWidth();
  const home = w * MIDDLE;
  if (els.header.scrollLeft < home - w) els.header.scrollLeft += w;
  else if (els.header.scrollLeft > home + w) els.header.scrollLeft -= w;
});

// Puts the middle copy's name `pad` px in from the header's left edge.
let headerPad = -1;
function setHeaderHome(pad, force = false) {
  if (!force && Math.abs(pad - headerPad) < 0.5) return; // only when the layout changed
  headerPad = pad;
  els.header.scrollLeft = headerSets[MIDDLE].offsetLeft - pad;
}

// Scrolling over the header. The page text's scroll box covers the whole
// window (clipped to the visible cloth), and browsers don't always respect
// that clipping when deciding what a wheel or trackpad scroll should move,
// so above the right-hand piece the page box was "catching" the scroll.
// So we decide ourselves: if the pointer is over the header's box and above
// the text line (where page text never shows), the header scrolls, both
// for sideways trackpad swipes and for a mouse wheel's up/down.
let textLineY = 0; // updated by applyLayout
window.addEventListener('wheel', (event) => {
  if (event.target.closest?.('.lil-gui')) return;
  const r = els.header.getBoundingClientRect();
  const { clientX: x, clientY: y } = event;
  if (x < r.left || x > r.right || y < r.top || y > Math.min(r.bottom, textLineY)) return;
  const sideways = Math.abs(event.deltaX) > Math.abs(event.deltaY);
  const unit = event.deltaMode === 1 ? 16 : 1; // some mice report lines, not pixels
  els.header.scrollLeft += (sideways ? event.deltaX : event.deltaY) * unit;
  event.preventDefault();
}, { passive: false, capture: true });

// --- Page scroll lifts the right-hand piece ------------------------------------------
els.scroller.addEventListener('scroll', () => {
  const lift = Math.min(1, els.scroller.scrollTop / config.scrollLift.distance);
  if (lift === config.scrollLift.progress) return;
  config.scrollLift.progress = lift;
  update();
});

// --- Fonts -------------------------------------------------------------------------
// When fonts change, the header's copies change width, so re-centre it.
function setFonts() {
  applyFonts(config.fonts);
  document.fonts.ready.then(() => setHeaderHome(headerPad, true));
}
setFonts();

// Buttons on the /fonts page.
els.scroller.addEventListener('click', (event) => {
  const button = event.target.closest('[data-font-role]');
  if (!button) return;
  const { fontRole, font } = button.dataset;
  for (const role of fontRole === 'all' ? ['heading', 'body', 'nav'] : [fontRole]) config.fonts[role] = font;
  setFonts();
  refreshGui();
});

const viewWidth = () => VIEW_HEIGHT * camera.aspect;

// --- Resize ------------------------------------------------------------------------
function onResize() {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, config.renderer.maxPixelRatio));
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  update(); // the cloth is sized in the shader, so this is all a resize needs
}
window.addEventListener('resize', onResize);
onResize();

// --- Pages & navigation --------------------------------------------------------------
const transitions = createTransitions({ config, els, update, setFabric, onShow: () => stitchPhotos(els.scroller) });
const currentPage = () => pages[window.location.pathname] ?? pages['/'];

createRouter((path) => {
  els.navLinks.forEach((a) => {
    a.toggleAttribute('aria-current', new URL(a.href).pathname === path);
  });
  transitions.go(pages[path] ?? pages['/']);
});

// --- Debug GUI (closed by default; click its title to open) -------------------------
const gui = new GUI({ title: 'Fabric debug' }).close();

const actions = {
  replayArrival: () => transitions.replayArrival(currentPage()),
  replayChange: () => transitions.go(currentPage()),
  resetCamera: () => { controls.reset(); camera.position.set(0, 0, cameraDistance); camera.lookAt(0, 0, 0); requestRender(); },
};

gui.add(actions, 'replayArrival').name('▶ first-open animation');
gui.add(actions, 'replayChange').name('▶ page-change animation');

// These sliders scrub the animation by hand.
const scrub = gui.addFolder('Scrub');
scrub.add(config.unfold, 'progress', 0, 1, 0.001).name('unfold');
scrub.add(config.fold, 'cornerDrop', 0, 1.2, 0.001).name('corner drop (1 = rest)');
scrub.add(config.tug, 'progress', 0, 1, 0.001).name('tug off (page change)');
scrub.add(config.seam, 'opacity', 0, 1, 0.01).name('seam opacity');

const shape = gui.addFolder('Fold shape').close();
shape.add(config.fold, 'foldDepth', 0.02, 0.6, 0.0025).name('depth at seam');
shape.add(config.layout, 'mainPinFraction', 0, 0.7, 0.01).name('pinned width');
shape.add(config.layout, 'stripFraction', 0.05, 0.4, 0.01).name('strip width');
shape.add(config.fold, 'foldAngle', 0, 1.05, 0.01).name('angle (× 180°)');
shape.add(config.fold, 'radius', 0.005, 0.15, 0.001).name('bar radius');
shape.add(config.fold, 'radiusJitter', 0, 1, 0.01).name('radius jitter');
shape.add(config.fold, 'waveAmp', 0, 0.05, 0.001).name('wave amount');
shape.add(config.fold, 'waveFreq', 0.5, 10, 0.1).name('wave frequency');
shape.add(config.fold, 'seed', 0, 100, 0.01);
shape.add(config.unfold, 'startDepth', 0.1, 0.9, 0.01).name('first fold position');
shape.add(config.unfold, 'radius', 0.005, 0.15, 0.001).name('first fold radius');

// --- Colours menu: every colour on the page, live ---------------------------------
// Everything here edits config.themes[config.theme] (and the stitch colour)
// directly. "copy colours as code" puts the result on your clipboard so you
// can paste it into config.js to keep it.
const PATTERNS = {
  'ochre plaid': 'url(/textures/plaid-ochre.jpg)',
  'grey plaid': 'url(/textures/plaid-grey.jpg)',
  none: 'none',
};
const colours = gui.addFolder('Colours');
let colourMenu = null;
function buildColoursMenu() {
  colourMenu?.destroy();
  colourMenu = colours.addFolder('Edit');
  const t = config.themes[config.theme];

  const under = colourMenu.addFolder('Under the fabric');
  under.addColor(t, 'base').name('colour');
  const pattern = {
    name: Object.keys(PATTERNS).find((k) => PATTERNS[k] === t.baseImage) ?? 'none',
    size: parseInt(t.baseSize, 10) || 480,
  };
  under.add(pattern, 'name', Object.keys(PATTERNS)).name('pattern').onChange((v) => { t.baseImage = PATTERNS[v]; });
  under.add(pattern, 'size', 100, 1200, 10).name('pattern size (px)').onChange((v) => { t.baseSize = `${v}px`; });

  const header = colourMenu.addFolder('Header');
  header.addColor(t, 'headerInk').name('name');
  header.addColor(t, 'navInk').name('nav links');

  const text = colourMenu.addFolder('Text on the fabric');
  text.addColor(t, 'ink').name('text & links');
  text.addColor(t, 'muted').name('small text');
  text.addColor(t, 'marker').name('list bullets');

  colourMenu.addColor(config.look, 'stitchColor').name('stitching (all)');

  // One folder per page. Editing a page's fabric shows it straight away.
  const fabricsFolder = colourMenu.addFolder('Fabric per page');
  for (const page of Object.values(pages)) {
    if (page.fontSpecimen) continue;
    const fab = t.fabrics[page.fabric];
    const label = page.title.split(' — ')[0].replace('Sophie Bird', 'Home');
    const folder = fabricsFolder.addFolder(`${label} (${page.fabric})`).close();
    const preview = () => setFabric(page.fabric);
    folder.addColor(fab, 'color').name('warp threads').onChange(preview);
    folder.addColor(fab, 'weftColor').name('weft threads').onChange(preview);
    folder.add(fab, 'scale', 0.3, 3, 0.05).name('thread scale').onChange(preview);
  }
}
const paletteChoice = { palette: config.themes[config.theme].palette };
colours.add(config, 'theme', Object.keys(config.themes)).onChange(() => {
  paletteChoice.palette = config.themes[config.theme].palette; // each theme keeps its own palette
  setFabric(fabric.currentFabric());
  buildColoursMenu();
});
colours.add(paletteChoice, 'palette', Object.keys(config.palettes)).onChange((name) => {
  applyPalette(name);
  setFabric(fabric.currentFabric());
  buildColoursMenu(); // so the pickers show the palette's colours
});
colours.add({
  copy: () => {
    const code = JSON.stringify({ theme: config.theme, colours: config.themes[config.theme], stitchColor: config.look.stitchColor }, null, 2);
    navigator.clipboard?.writeText(code);
    console.log(code);
  },
}, 'copy').name('📋 copy colours as code');
buildColoursMenu();

// Texture and lighting (same for every page).
const look = gui.addFolder('Fabric look').close();
look.add(config.look, 'threadDensity', 30, 300, 1).name('thread density');
look.add(config.look, 'patternContrast', 0, 1.5, 0.01).name('texture strength');
look.add(config.look, 'shadowStrength', 0, 1, 0.01).name('shadow');
look.add(config.look.lightDir, '0', -1, 1, 0.01).name('light x');
look.add(config.look.lightDir, '1', -1, 1, 0.01).name('light y');

const fontsFolder = gui.addFolder('Fonts').close();
const fontNames = FONTS.map((f) => f.name);
fontsFolder.add(config.fonts, 'heading', fontNames).onChange(setFonts);
fontsFolder.add(config.fonts, 'body', fontNames).onChange(setFonts);
fontsFolder.add(config.fonts, 'nav', fontNames).onChange(setFonts);
fontsFolder.add({ open: () => { history.pushState({}, '', '/fonts'); window.dispatchEvent(new PopStateEvent('popstate')); } }, 'open').name('▶ compare all fonts (/fonts)');

const scrollFolder = gui.addFolder('Scroll lift').close();
scrollFolder.add(config.scrollLift, 'distance', 50, 800, 10).name('scroll distance (px)');
scrollFolder.add(config.scrollLift, 'progress', 0, 1, 0.001).name('lift');

const anim = gui.addFolder('Timing').close();
const eases = ['power2.inOut', 'power2.in', 'power2.out', 'power3.out', 'sine.inOut', 'back.out(1.4)', 'bounce.out'];
for (const key of ['unfold', 'drop', 'tug']) {
  anim.add(config.animation[key], 'duration', 0.2, 4, 0.1).name(`${key} duration`);
  anim.add(config.animation[key], 'ease', eases).name(`${key} ease`);
}
anim.add(config.animation, 'pause', 0, 1, 0.01).name('pause before drop');
anim.add(config.animation, 'betweenSheets', 0, 1, 0.01).name('gap between sheets');

const dbg = gui.addFolder('Debug').close();
dbg.add(config.debug, 'wireframe');
dbg.add(config.debug, 'grid');
dbg.add(config.debug, 'bendTint').name('tint curves');
dbg.add(controls, 'enabled').name('orbit camera (drag)').onChange((on) => {
  // The canvas normally ignores the mouse so you can click the header under it.
  document.body.classList.toggle('orbiting', on);
});
dbg.add(actions, 'resetCamera').name('reset camera');
dbg.add(config.geometry.main, 'segmentsX', 4, 256, 1).name('main segments X').onFinishChange(fabric.rebuildGeometry);
dbg.add(config.geometry.main, 'segmentsY', 4, 256, 1).name('main segments Y').onFinishChange(fabric.rebuildGeometry);
dbg.add(config.geometry.strip, 'segmentsX', 2, 64, 1).name('strip segments X').onFinishChange(fabric.rebuildGeometry);
dbg.add(config.geometry.strip, 'segmentsY', 4, 256, 1).name('strip segments Y').onFinishChange(fabric.rebuildGeometry);

// Any GUI change → colours into CSS, config into uniforms + HTML → one frame.
gui.onChange(() => {
  applyTheme();
  update();
});

// Move the sliders along while an animation plays. (lil-gui's .listen() would
// do this too, but it polls every frame forever, even when idle. This only
// runs when update() does.)
refreshGui = () => gui.controllersRecursive().forEach((c) => c.updateDisplay());

// Dev only: poke at things from the browser console, e.g.
//   __fabric.config.tug.progress = 0.4; __fabric.update()
if (import.meta.env.DEV) window.__fabric = { config, update, transitions, applyTheme };
