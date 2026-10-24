// ===========================================================================
// fabric.vert.glsl: the VERTEX SHADER  (common.glsl is glued on above this)
//
// The GPU runs this once for every vertex of a fabric piece, all in parallel.
// Its only job: take a vertex and say where it ends up (gl_Position).
// We use that to bend a flat plane into folds. This is "vertex
// displacement": the geometry on the CPU stays flat and the GPU moves
// the points every frame.
//
// Three.js's ShaderMaterial automatically gives us:
//   attribute vec3 position;   // vertex position from the geometry
//   attribute vec2 uv;         // 0..1 coordinates across the plane
//   uniform mat4 modelMatrix, viewMatrix, projectionMatrix, ...
//
// "uniforms" are values we send from JavaScript that are the SAME for every
// vertex in a draw call (crease position, bar direction...). Changing a
// uniform is nearly free. No geometry is re-uploaded, which is why
// animating them is so cheap.
//
// "varyings" are values we pass on to the fragment shader. The GPU blends
// them across each triangle (interpolation).
//
// Two folds, used one after the other (never at the same time):
//   A. HALF FOLD: everything above a horizontal crease is folded down in
//      front. Pulling the crease up unfolds it.
//   B. CORNER FOLD: everything past a bar is flipped over the bar. (When a
//      page changes, the bar is swept away across the sheet: the "tug".)
// Both are the same idea: "wrap the cloth around a rod lying on the page".
// ===========================================================================

uniform float uLiftOffset;    // tiny extra height for folded cloth, so the two pieces' flaps don't flicker where they overlap

varying vec2  vFlatPos;       // where this point was BEFORE folding (texture, seam, shadow)
varying vec3  vNormal;        // which way the surface faces (for lighting)
varying float vBend;          // 1 if this point is curved around a rod

// --- Wrap around a rod --------------------------------------------------------
// Picture a rod of radius R lying on the page along the crease (its axis at
// height z = R). Cloth that is distance d past the crease wraps around it.
// Turning by angle theta uses up an arc of length R*theta (arc length =
// radius × angle). Cloth beyond that continues straight, along the rod's
// tangent at the point where it leaves.
//
// Works in a 2D cross-section. Returns (s, z):
//   s = new distance from the crease (negative = flipped back past it)
//   z = height toward the viewer
float gOnRod;   // set by wrap(): 1 if the point is on the curved part
float gAngle;   // set by wrap(): how far the cloth has turned at this point
vec2 wrap(float d, float R, float theta) {
  float arc = R * theta;
  if (d < arc) {
    float a = d / R;
    gOnRod = 1.0;
    gAngle = a;
    return vec2(R * sin(a), R * (1.0 - cos(a)));
  }
  gOnRod = 0.0;
  gAngle = theta;
  vec2 arcEnd  = vec2(R * sin(theta), R * (1.0 - cos(theta)));
  vec2 tangent = vec2(cos(theta), sin(theta));
  return arcEnd + (d - arc) * tangent;
}

void main() {
  // --- 1. Lay out the flat piece from uv ----------------------------------
  // The geometry is a 1x1 plane; we stretch it to this piece's rectangle here
  // so a window resize only needs a uniform update, not new geometry.
  vec3 p = vec3(
    mix(uRect.x, uRect.y, uv.x),
    mix(uRect.z, uRect.w, uv.y),
    0.0
  );
  vFlatPos = p.xy;
  gOnRod = 0.0;
  gAngle = 0.0;

  // Direction across the crease, toward the folded side (needed for the normal).
  vec2 across = vec2(0.0, 1.0);

  if (p.y > uCrease) {
    // --- 2A. HALF FOLD -------------------------------------------------------
    // Everything above the crease is folded all the way over (theta = PI) and
    // lies on top of the cloth below it, showing its back. Both pieces use
    // the same crease, so they look like one sheet.
    vec2 sz = wrap(p.y - uCrease, uCreaseRadius, PI);
    p.y = uCrease + sz.x;
    p.z = max(sz.y, 0.002) + uLiftOffset; // cloth can't pass through the page
  } else {
    // --- 2B. CORNER FOLD -----------------------------------------------------
    // d = signed distance from the bar (dot product with a unit normal),
    // nudged by the wave so the crease isn't ruler-straight.
    // d > 0 means "on the folding side".
    float t = barT(p.xy);
    float d = dot(p.xy - uBarStart, uBarNormal) - barWave(t);
    across = uBarNormal;

    if (d > 0.0) {
      vec2 sz = wrap(d, barRadius(t), uFoldAngle * PI);
      // Back to the foot of the crease, then out along the normal by s.
      vec2 foot = p.xy - d * uBarNormal;
      p.xy = foot + sz.x * uBarNormal;
      p.z = max(sz.y, 0.002) + uLiftOffset;
    }
  }

  // --- 3. Normal ----------------------------------------------------------------
  // A "normal" is a unit vector pointing straight out of the surface. Light
  // hitting the surface head-on (normal facing the light) = bright; at a
  // grazing angle = dark. Flat cloth faces the viewer: (0, 0, 1). Cloth that
  // has turned by angle a around the crease faces
  //   (-sin a) × (across the crease)  +  (cos a) × (toward viewer).
  // (That's the cross-section tangent (cos a, sin a) rotated by 90°.)
  // The fragment shader flips it for the back side.
  vNormal = vec3(-sin(gAngle) * across, cos(gAngle));
  vBend = gOnRod;

  // --- 4. Project to the screen -------------------------------------------
  // model → world → camera → clip space. Standard for every vertex shader.
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
