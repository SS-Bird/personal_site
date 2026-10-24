// ===========================================================================
// fabric.frag.glsl: the FRAGMENT SHADER  (common.glsl is glued on above this)
//
// Runs once per pixel the mesh covers, and outputs that pixel's color.
//   1. Procedural linen, computed from the pixel's flat position (no images).
//   2. Lighting from the normal the vertex shader computed.
//   3. A soft shadow on the flat cloth next to a fold.
//   4. Seam stitches, then debug overlays.
// ===========================================================================

uniform vec3  uColorA;           // warp (lengthwise thread) colour
uniform vec3  uColorB;           // weft (crosswise thread) colour
uniform float uThreadDensity;    // threads per world unit
uniform float uPatternContrast;  // 0 = flat colour, 1 = full texture
uniform vec3  uLightDir;         // direction TOWARD the light (normalized in JS)
uniform float uShadowStrength;
uniform vec3  uSeamColor;
uniform float uSeamX;            // x (flat coordinates) of the sewn edge of this piece
uniform float uSeamOpacity;
uniform float uShowGrid;
uniform float uShowBend;

varying vec2  vFlatPos;
varying vec3  vNormal;
varying float vBend;

// Anti-aliasing for procedural patterns: when a thread gets narrower than a
// pixel or so, drawing it would shimmer (moiré). fwidth tells us how much q
// changes per pixel, so fade the detail out as that approaches 1.
float detailFade(vec2 q) {
  float w = max(fwidth(q.x), fwidth(q.y));
  return 1.0 - smoothstep(0.35, 0.9, w);
}

// --- Linen (plain weave) -------------------------------------------------------
// Warp threads run vertically, weft threads horizontally. Plain weave goes
// over one, under one, so which thread is on top makes a checkerboard.
// (A plain weave looks the same from the back, so front and back match.)
vec3 linen(vec2 pos) {
  vec2 q = pos * uThreadDensity;
  vec2 cell = floor(q);
  vec2 f = fract(q);

  float warpOnTop = mod(cell.x + cell.y, 2.0);
  bool warp = warpOnTop > 0.5;

  // A thread is round, so it's brightest along its middle and darker at its
  // edges, and dips where it ducks under a crossing thread.
  float acrossThread = warp ? f.x : f.y;
  float alongThread  = warp ? f.y : f.x;
  float threadId     = warp ? cell.x : cell.y + 1000.0;
  float profile = sin(acrossThread * PI);
  float dip = 0.75 + 0.25 * sin(alongThread * PI);

  // Slubs: real linen thread is lumpy. Brightness drifts slowly along each
  // thread (mostly even, with the odd thick/thin stretch), and every thread
  // is a slightly different shade.
  float alongCoord = warp ? q.y : q.x;
  float slub = noise1(alongCoord * 0.08 + hash(threadId) * 50.0);
  slub = sign(slub) * pow(abs(slub), 3.0);
  float tone = 0.87 + 0.2 * profile * dip + 0.14 * slub + 0.07 * (hash(threadId) - 0.5);

  vec3 thread = mix(uColorB, uColorA, warpOnTop) * tone;

  // When the pattern is too small to draw, show its average colour instead.
  vec3 average = mix(uColorB, uColorA, 0.5);
  return mix(average, thread, detailFade(q) * uPatternContrast);
}

// --- Shadow next to a fold ---------------------------------------------------------
// Distance from a point to a rectangle's edge: negative inside, positive outside.
float sdRect(vec2 p, vec4 r) {
  vec2 center = vec2(r.x + r.y, r.z + r.w) * 0.5;
  vec2 halfSize = vec2(r.y - r.x, r.w - r.z) * 0.5;
  vec2 d = abs(p - center) - halfSize;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

// Two parts, combined:
//   CONTACT: right where the cloth lifts off the page at the crease, very
//     little light gets in. Darkest at the crease, fading within a few radii.
//     This joins the shading on the curve smoothly to the shadow on the flat.
//   CAST: the flap hanging above blocks the light. For a point q on the flat
//     cloth, look a little TOWARD the light. If there's flap cloth up there,
//     q is in its shadow. Higher flap = longer, softer shadow.
float foldShadow(vec2 q) {
  vec2 linePoint; vec2 n; float R; float theta; float wave = 0.0;
  if (halfFoldActive()) {
    linePoint = vec2(0.0, uCrease); n = vec2(0.0, 1.0); R = uCreaseRadius; theta = PI;
  } else {
    linePoint = uBarStart; n = uBarNormal; theta = uFoldAngle * PI;
    float t = barT(q);
    wave = barWave(t);
    R = barRadius(t);
  }

  // Only flat cloth receives this shadow. Checking which side of the crease
  // we're on per PIXEL gives a clean edge that follows the crease exactly.
  float dHere = dot(q - linePoint, n) - wave;
  if (dHere > 0.0) return 0.0;

  float contact = 1.0 - smoothstep(0.0, 2.5 * R, -dHere);

  float c = cos(theta);
  float s = sin(theta);
  if (c > -0.2) return contact * 0.6; // flap sticking up: no overhang to cast a shadow

  // The flat part of the flap sits at s(d) = R sinθ + (d − Rθ) cosθ for cloth
  // that started at distance d past the crease (see wrap() in the vertex
  // shader). Run that backwards to find which d lies over a given point.
  float dAbove = (dHere - R * s) / c + R * theta;
  float height = R * (1.0 - c) + max(dAbove - R * theta, 0.0) * s;

  vec2 qs = q + normalize(uLightDir.xy) * max(height, 2.0 * R) * 0.5;
  float d2 = dot(qs - linePoint, n) - wave;
  float dFlap = (d2 - R * s) / c + R * theta;
  vec2 original = qs + (dFlap - d2) * n; // where that flap cloth was before folding

  float inside = -sdRect(original, uRect);
  float blur = 0.008 + height * 0.3;
  float castShadow = smoothstep(-blur, blur, inside) * step(0.0, dFlap);
  return max(castShadow, contact * 0.8);
}

// --- Hand stitches across the seam -------------------------------------------------
// Short diagonal stitches, like a whip stitch. Each one is a thin line with
// a slight wobble, and each is a little different (spacing, length, slant),
// because hands aren't machines.
float seamStitches(vec2 p) {
  const float spacing = 0.034;  // world units between stitches
  const float slope = 0.75;     // how diagonal (along-seam rise per unit across)
  float u = p.x - uSeamX;       // across the seam
  float v = p.y;                // along the seam

  // Slant the coordinate so each stitch is a horizontal line in (u, w).
  float w = v - slope * u;
  float i = floor(w / spacing + 0.5);       // which stitch we're nearest
  float jitter = hash(i * 7.31) - 0.5;
  float centre = (i + jitter * 0.3) * spacing;
  float halfLength = 0.0075 * (0.85 + 0.3 * hash(i * 3.17));
  float tilt = (hash(i * 1.93) - 0.5) * 0.25;  // each stitch slants a bit differently

  // A gentle squiggle along the thread.
  float wobble = sin(u * 420.0 + hash(i) * 6.28) * 0.0009;
  float dist = abs(w - centre - tilt * u - wobble) / sqrt(1.0 + slope * slope);

  // Thin (~1 px) anti-aliased line, and only near the seam.
  float px = dist / fwidth(w);
  float line = 1.0 - smoothstep(0.35, 1.1, px);
  float ends = 1.0 - smoothstep(halfLength - 0.0015, halfLength, abs(u));
  return line * ends;
}

void main() {
  bool backSide = !gl_FrontFacing; // gl_FrontFacing: are we looking at the triangle's front?

  // --- 1. Fabric ---
  vec3 col = linen(vFlatPos);

  // --- 2. Lighting ---
  // "Lambert" diffuse lighting: brightness = how directly the surface faces
  // the light = dot(normal, lightDir). We divide by the flat cloth's value so
  // flat cloth shows its true colour and curves get lighter or darker.
  // The 0.62 is "ambient" light that comes from everywhere, so the side of a
  // curve facing away from the light is dimmer but never black.
  vec3 N = normalize(vNormal) * (backSide ? -1.0 : 1.0);
  float lambert = dot(N, uLightDir) / uLightDir.z;
  col *= 0.62 + 0.38 * clamp(lambert, 0.0, 1.3);

  // --- 3. Shadow next to a fold (foldShadow skips cloth that's folded up) ---
  if (!backSide) col *= 1.0 - uShadowStrength * foldShadow(vFlatPos);

  // --- 4. Seam ---
  // Measured in FLAT coordinates, so the stitches stay on the cloth even when
  // it's folded. distance / fwidth = distance in PIXELS: crisp thin lines.
  float seamDist = abs(vFlatPos.x - uSeamX);
  float seamLine = 1.0 - smoothstep(0.5, 1.3, seamDist / fwidth(vFlatPos.x));
  col = mix(col, uSeamColor, max(seamLine * 0.35, seamStitches(vFlatPos)) * uSeamOpacity);

  // --- Debug: grid in flat coordinates (shows how the cloth moves) ---
  vec2 gridCoord = vFlatPos / 0.1;
  vec2 g = abs(fract(gridCoord - 0.5) - 0.5) / fwidth(gridCoord);
  float line = 1.0 - min(min(g.x, g.y), 1.0);
  col = mix(col, col * 0.55, line * uShowGrid);

  // --- Debug: red tint on curved cloth ---
  col = mix(col, vec3(0.9, 0.35, 0.3), vBend * 0.55 * uShowBend);

  gl_FragColor = vec4(col, 1.0);

  // Three.js does its color math in "linear" space; this converts the result
  // to the screen's sRGB, so '#e4dccb' in config looks like '#e4dccb'.
  #include <colorspace_fragment>
}
