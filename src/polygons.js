// ---------------------------------------------------------------------------
// polygons.js: a little 2D geometry, for lining the HTML up with the cloth.
//
// A fold flips cloth across a straight line, which is a reflection. So
// "which part of the page shows the front of the cloth?" can be answered
// with polygons on the CPU, exactly matching what the shader draws (minus
// the small round bit at the crease).
// Points are plain { x, y } objects (THREE.Vector2 works too).
// ---------------------------------------------------------------------------

// Signed distance from a line given by a point on it and a unit normal.
function side(p, point, normal) {
  return (p.x - point.x) * normal.x + (p.y - point.y) * normal.y;
}

// Cut a convex polygon with a line. Keeps the part where the signed distance
// has the sign `keep` (+1 = the side the normal points to, -1 = the other).
// This is one step of the Sutherland–Hodgman clipping algorithm.
export function clipByLine(poly, point, normal, keep) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const sa = keep * side(a, point, normal);
    const sb = keep * side(b, point, normal);
    if (sa >= 0) out.push({ x: a.x, y: a.y });
    if ((sa >= 0) !== (sb >= 0)) {
      const t = sa / (sa - sb); // where the edge crosses the line
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  return out;
}

// Mirror a point across a line (what a 180° fold does to it).
export function reflect(p, point, normal) {
  const d = side(p, point, normal);
  return { x: p.x - 2 * d * normal.x, y: p.y - 2 * d * normal.y };
}

// The overlap of two convex polygons: clip `subject` by every edge of `clip`.
export function intersectConvex(subject, clip) {
  const cx = clip.reduce((s, p) => s + p.x, 0) / clip.length;
  const cy = clip.reduce((s, p) => s + p.y, 0) / clip.length;
  let out = subject;
  for (let i = 0; i < clip.length && out.length >= 3; i++) {
    const a = clip[i];
    const b = clip[(i + 1) % clip.length];
    let normal = { x: -(b.y - a.y), y: b.x - a.x };
    // point the normal toward the inside of `clip`
    if (side({ x: cx, y: cy }, a, normal) < 0) normal = { x: -normal.x, y: -normal.y };
    out = clipByLine(out, a, normal, 1);
  }
  return out.length >= 3 ? out : [];
}

export function area(poly) {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    a += p.x * q.y - q.x * p.y;
  }
  return Math.abs(a) / 2;
}
