// ===========================================================================
// common.glsl: shared by BOTH shaders.
//
// fabric.js glues this text onto the front of the vertex and fragment
// shaders (a "shader chunk"). The vertex shader needs the fold math to move
// the cloth; the fragment shader needs the SAME math to work out where the
// flap's shadow falls. Sharing it keeps them in sync.
// ===========================================================================

#define PI 3.141592653589793

uniform vec4  uRect;          // this piece's flat rectangle: (xMin, xMax, yMin, yMax)

// --- half fold (each new sheet arrives folded once) ---
uniform float uCrease;        // y of the horizontal crease (at the top edge = nothing folded)
uniform float uCreaseRadius;

// --- corner fold ---
uniform vec2  uBarStart;      // the pin: the bar pivots here
uniform vec2  uBarDir;        // unit vector along the bar
uniform vec2  uBarNormal;     // unit vector across the bar, pointing to the side that gets folded
uniform float uBarLen;        // length used to measure "how far along the bar" (for the wave)
uniform float uFoldAngle;     // 0..1, multiplied by PI: how far the flap is flipped
uniform float uRadius;        // bar radius
uniform float uRadiusJitter;  // 0..1 variation of radius along the bar
uniform float uWaveAmp;       // crease unevenness amplitude
uniform float uWaveFreq;      // crease unevenness frequency
uniform float uSeed;          // shifts the noise so each fold differs

// --- 1D value noise --------------------------------------------------------
// GLSL has no built-in random(). A common trick: a hash function that turns
// a number into a "random-looking" number in 0..1 (same input → same output).
float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

// Value noise: random values at whole numbers, smoothly blended between.
// Gives a gentle, wobbly curve in -1..1, which is good for cloth irregularity.
float noise1(float x) {
  float i = floor(x);
  float f = fract(x);
  float u = f * f * (3.0 - 2.0 * f); // smoothstep curve, avoids sharp corners
  return mix(hash(i), hash(i + 1.0), u) * 2.0 - 1.0;
}

// Is the half fold happening? (Its crease sits at the top edge when it isn't.)
bool halfFoldActive() {
  return uCrease < uRect.w - 1e-5;
}

// How far along the bar a point is: 0 at the pin, 1 at the far end.
float barT(vec2 pos) {
  return clamp(dot(pos - uBarStart, uBarDir) / uBarLen, 0.0, 1.0);
}

// The crease wobble at that point. × t keeps the pinned end still.
float barWave(float t) {
  return noise1(t * uWaveFreq + uSeed) * uWaveAmp * t;
}

// The bar's radius wobbles a little too (soft in places, tighter in others).
float barRadius(float t) {
  return max(uRadius * (1.0 + uRadiusJitter * noise1(t * uWaveFreq * 0.7 + uSeed + 17.0)), 0.002);
}
