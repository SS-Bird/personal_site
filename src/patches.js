// ---------------------------------------------------------------------------
// patches.js: the Sewing section's sub-navigation, as scraps of tartan
// stitched onto the left strip.
//
// Each patch is a plain HTML link (so it's keyboard- and screen-reader-
// friendly, and the router picks it up via data-link). It's built from:
//
//   <a class="patch">                 the stitch line is this box's edge
//     <span class="patch-scrap">      soft shadow under the cloth
//       <span class="patch-cloth">    the tartan scan, cut with a ragged edge
//     <span class="patch-label">      the text, in the nav font
//     <svg class="photo-stitches">    added by photoStitches.js, same as photos
//
// Why a separate "scrap" and "cloth"? The ragged edge is a clip-path, and
// clip-path cuts away everything outside it, including any shadow on the
// same element. So the shadow (a CSS filter) goes on the parent: filters
// run after the children are drawn, so it follows the ragged shape.
//
// All the randomness (tilt, nudge, fray, which bit of tartan shows) is
// seeded by the patch's path, so a patch looks the same on every visit.
// ---------------------------------------------------------------------------
import { seededRandom } from './photoStitches.js';

// A rectangle with a ragged, frayed outline, as a CSS clip-path polygon.
// Points go round the edge clockwise; each is pushed inward by 0..depth px.
// Mixing % (along the edge) and px (inward) means the fray stays the same
// size however big the patch is.
function frayedEdge(rand, depth, steps = 16) {
  const r = () => (rand() * depth).toFixed(1);
  const pts = [];
  for (let i = 0; i < steps; i++) {
    const t = ((i / steps) * 100).toFixed(1);
    const u = (100 - (i / steps) * 100).toFixed(1);
    pts.push([`${t}% ${r()}px`, `calc(100% - ${r()}px) ${t}%`, `${u}% calc(100% - ${r()}px)`, `${r()}px ${u}%`]);
  }
  // pts[i] holds one point per side; regroup them side by side (top, right, bottom, left)
  const sides = [0, 1, 2, 3].map((s) => pts.map((p) => p[s]));
  return `polygon(${sides.flat().join(', ')})`;
}

const between = (rand, lo, hi) => lo + rand() * (hi - lo);

// Fill `list` with patches for `page`. Pages outside the Sewing section get
// a bare strip. If the patches are already there (moving between Sewing
// pages, where the strip stays on screen), only the underline moves, unless
// `force` (the debug panel changed how they look).
export function renderPatches(list, page, patches, config, force = false) {
  const here = window.location.pathname;
  if (page.section !== 'sewing') {
    list.innerHTML = '';
    delete list.dataset.section;
    return;
  }
  if (list.dataset.section === 'sewing' && !force) {
    list.querySelectorAll('.patch').forEach((a) => {
      if (a.getAttribute('href') === here) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    return;
  }
  list.dataset.section = 'sewing';
  const c = config.patches;
  list.innerHTML = patches.map((p) => {
    const rand = seededRandom(p.path);
    const fabric = c.fabrics[p.fabric] ?? Object.values(c.fabrics)[0];
    // CSS custom properties carry the per-patch values into style.css.
    const style = [
      `--tilt: ${between(rand, -c.tilt, c.tilt).toFixed(2)}deg`,
      `--nudge: ${between(rand, -c.nudge, c.nudge).toFixed(1)}px`,
      `--overhang: ${c.overhang}px`,
      `--patch-image: url(${fabric.src})`,
      `--patch-size: ${fabric.size}px`,
      // background-position in %: 15–85% shows the middle of the scan, never its edges
      `--patch-x: ${between(rand, 15, 85).toFixed(1)}%`,
      `--patch-y: ${between(rand, 15, 85).toFixed(1)}%`,
      `--fray: ${frayedEdge(rand, c.fray)}`,
      `--patch-saturation: ${c.saturation}`,
    ].join('; ');
    const current = p.path === here ? ' aria-current="page"' : '';
    return `
      <a class="patch" href="${p.path}" data-link data-stitch-seed="${p.path}" style="${style}"${current}>
        <span class="patch-scrap" aria-hidden="true"><span class="patch-cloth"></span></span>
        <span class="patch-label">${p.label}</span>
      </a>`;
  }).join('');
  list.style.gap = `${c.gap}px`;
}
