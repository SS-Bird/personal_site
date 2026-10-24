// ---------------------------------------------------------------------------
// photoStitches.js: sews the photos onto the fabric.
//
// Each photo gets an SVG drawn just around it: a squiggly thread along its
// edge, plus short diagonal stitches going from that edge out onto the
// cloth, like a patch that's been whip-stitched on. It's plain SVG on top of
// the HTML (not WebGL), so it's crisp and scrolls with the photo.
//
// The squiggle is random but repeatable: each photo's file name seeds the
// random numbers, so a photo looks the same every time you visit.
// ---------------------------------------------------------------------------

const SVG_NS = 'http://www.w3.org/2000/svg';
const MARGIN = 14; // px around the photo the drawing can use

// A small seeded random number generator ("mulberry32"): same seed → same
// sequence. Math.random() can't be seeded, so we roll our own.
function seededRandom(seedText) {
  let a = 0;
  for (const ch of seedText) a = (Math.imul(a, 31) + ch.charCodeAt(0)) | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Walk around the rectangle's edge. For a distance `s` along the edge,
// returns the point there, the direction along the edge, and the outward
// direction (pointing away from the photo).
function perimeterPoint(s, w, h) {
  if (s < w) return { x: s, y: 0, tx: 1, ty: 0, nx: 0, ny: -1 };
  s -= w;
  if (s < h) return { x: w, y: s, tx: 0, ty: 1, nx: 1, ny: 0 };
  s -= h;
  if (s < w) return { x: w - s, y: h, tx: -1, ty: 0, nx: 0, ny: 1 };
  s -= w;
  return { x: 0, y: h - s, tx: 0, ty: -1, nx: -1, ny: 0 };
}

function draw(figure) {
  const w = figure.clientWidth;
  const h = figure.clientHeight;
  if (w < 4 || h < 4) return;

  let svg = figure.querySelector(':scope > svg.photo-stitches');
  if (!svg) {
    svg = document.createElementNS(SVG_NS, 'svg');
    svg.classList.add('photo-stitches');
    svg.setAttribute('aria-hidden', 'true');
    figure.appendChild(svg);
  }
  if (svg.dataset.size === `${w}x${h}`) return; // already drawn at this size
  svg.dataset.size = `${w}x${h}`;
  svg.setAttribute('viewBox', `${-MARGIN} ${-MARGIN} ${w + 2 * MARGIN} ${h + 2 * MARGIN}`);

  const rand = seededRandom(figure.querySelector('img')?.getAttribute('src') ?? 'photo');
  const perimeter = 2 * (w + h);

  // 1. The squiggly border: points every few px around the edge, nudged in
  //    and out by two overlapping sine waves (so it doesn't look regular)
  //    plus a little randomness.
  const f1 = 0.05 + rand() * 0.03;
  const f2 = 0.13 + rand() * 0.05;
  const p1 = rand() * 6.28;
  const p2 = rand() * 6.28;
  const points = [];
  for (let s = 0; s < perimeter; s += 5) {
    const p = perimeterPoint(s, w, h);
    const off = 1.3 * Math.sin(s * f1 + p1) + 0.7 * Math.sin(s * f2 + p2) + (rand() - 0.5) * 0.8;
    points.push(`${(p.x + p.nx * off).toFixed(1)},${(p.y + p.ny * off).toFixed(1)}`);
  }
  let d = `M${points[0]} L${points.slice(1).join(' ')} Z`;

  // 2. Stitches from the border out onto the cloth: each starts just inside
  //    the photo edge and leans along the edge as it goes out (diagonal),
  //    with a slight curve. Spacing, length and lean vary per stitch.
  for (let s = rand() * 10; s < perimeter; s += 17 + rand() * 7) {
    const p = perimeterPoint(s, w, h);
    const inside = 2.5;
    const out = 7 + rand() * 3;
    const lean = 4 + rand() * 3;
    const bend = (rand() - 0.5) * 2.5;
    const x0 = p.x - p.nx * inside;
    const y0 = p.y - p.ny * inside;
    const x1 = p.x + p.nx * out + p.tx * lean;
    const y1 = p.y + p.ny * out + p.ty * lean;
    // control point of a quadratic curve, pushed sideways a bit = a soft wiggle
    const cx = (x0 + x1) / 2 + p.tx * bend;
    const cy = (y0 + y1) / 2 + p.ty * bend;
    d += ` M${x0.toFixed(1)},${y0.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
  }

  let path = svg.querySelector('path');
  if (!path) {
    path = document.createElementNS(SVG_NS, 'path');
    svg.appendChild(path);
  }
  path.setAttribute('d', d);
}

// Redraw a photo's stitches whenever its size changes (images loading,
// window resizing, layout changes): a ResizeObserver tells us when.
const observer = new ResizeObserver((entries) => entries.forEach((e) => draw(e.target)));

// Call after putting a page's HTML on the screen.
export function stitchPhotos(root) {
  observer.disconnect();
  root.querySelectorAll('.page figure').forEach((figure) => {
    observer.observe(figure);
    draw(figure);
  });
}
