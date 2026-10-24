// ---------------------------------------------------------------------------
// fabric.js: builds the two fabric pieces (left strip + main panel), and
// works out where their folds are.
//
// Both pieces use the same shaders; each gets its own material so it can
// have its own uniforms (its rectangle and its bar). That's 2 meshes =
// 2 draw calls, within the performance budget.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import commonShader from './shaders/common.glsl?raw';   // ?raw = Vite imports the file as a string
import vertexShader from './shaders/fabric.vert.glsl?raw';
import fragmentShader from './shaders/fabric.frag.glsl?raw';
import { clipByLine, reflect } from './polygons.js';

// side: 'strip' (left piece, pinned top-left) or 'main' (pinned along the top right)
function createPiece(config, side) {
  const seg = config.geometry[side];

  // A 1x1 plane; its real size and position are set in the vertex shader.
  const geometry = new THREE.PlaneGeometry(1, 1, seg.segmentsX, seg.segmentsY);

  // Uniforms: name → { value }. Three.js uploads these to the GPU each frame.
  // Changing .value is all you need to do to animate the shader.
  const uniforms = {
    uRect:            { value: new THREE.Vector4() },
    uCrease:          { value: 0 },
    uCreaseRadius:    { value: 0 },
    uBarStart:        { value: new THREE.Vector2() },
    uBarDir:          { value: new THREE.Vector2() },
    uBarNormal:       { value: new THREE.Vector2() },
    uBarLen:          { value: 1 },
    uFoldAngle:       { value: 1 },
    uRadius:          { value: 0 },
    uRadiusJitter:    { value: 0 },
    uWaveAmp:         { value: 0 },
    uWaveFreq:        { value: 0 },
    uSeed:            { value: 0 },
    uLiftOffset:      { value: side === 'strip' ? 0.004 : 0 },
    uColorA:          { value: new THREE.Color() },
    uColorB:          { value: new THREE.Color() },
    uSeamColor:       { value: new THREE.Color() },
    uThreadDensity:   { value: 100 },
    uPatternContrast: { value: 1 },
    uLightDir:        { value: new THREE.Vector3(0, 0, 1) },
    uShadowStrength:  { value: 0 },
    uSeamX:           { value: 0 },
    uSeamOpacity:     { value: 0 },
    uShowGrid:        { value: 0 },
    uShowBend:        { value: 0 },
  };

  const material = new THREE.ShaderMaterial({
    // The shared chunk goes in front of each shader's own code.
    vertexShader: commonShader + vertexShader,
    fragmentShader: commonShader + fragmentShader,
    uniforms,
    // Draw both sides: folded cloth shows us its BACK.
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);

  // Three.js skips drawing objects whose bounding box is off-screen
  // ("frustum culling"). It computes that box from the FLAT 1x1 geometry and
  // doesn't know our shader moves vertices, so we turn culling off.
  mesh.frustumCulled = false;

  return { side, mesh, uniforms, material };
}

export function createFabric(config) {
  const pieces = [createPiece(config, 'strip'), createPiece(config, 'main')];
  const fabrics = () => config.themes[config.theme].fabrics;
  let currentFabric = Object.keys(fabrics())[0];

  const group = new THREE.Group();
  pieces.forEach((p) => group.add(p.mesh));

  // A line (crease / bar) is a point on it, a unit direction along it, and a
  // unit normal pointing at the side that folds.
  function makeLine(point, dir, normal, len) {
    return { pin: point, dir, normal, len };
  }

  // A resting bar from its pin. drop 0 → 1: the far end slides down the
  // seam, from the top edge to foldDepth.
  function restBar(pin, drop, m) {
    const end = new THREE.Vector2(m.seamX, m.top - m.depth * drop);
    const dir = end.clone().sub(pin);
    const len = Math.max(dir.length(), 1e-5);
    dir.divideScalar(len);
    // Perpendicular to dir, flipped if needed so it points toward the inner
    // top corner (nudged upward so it's never ambiguous when the bar lies
    // flat along the top edge).
    const normal = new THREE.Vector2(-dir.y, dir.x);
    if (normal.dot(new THREE.Vector2(m.seamX, m.top + 1).sub(pin)) < 0) normal.negate();
    return makeLine(pin, dir, normal, len);
  }

  // The tug: drag the inner corner from where it rests (the flap's tip) to
  // `target`. When you fold a corner onto a point, the crease is exactly
  // halfway between them, at right angles: the "perpendicular bisector".
  // As the target runs off-screen, the crease sweeps across the whole sheet.
  function tugBar(rest, corner, target) {
    const normal = corner.clone().sub(target).normalize(); // points at the corner = folding side
    const mid = corner.clone().add(target).multiplyScalar(0.5);
    const dir = new THREE.Vector2(-normal.y, normal.x);
    if (dir.dot(rest.dir) < 0) dir.negate();
    // Start measuring "along the bar" from the point nearest the old pin, so
    // the wave pattern doesn't jump when the tug begins.
    const start = mid.clone().addScaledVector(dir, rest.pin.clone().sub(mid).dot(dir));
    return makeLine(start, dir, normal, rest.len);
  }

  // The animation state measure() uses by default: whatever config says now.
  const currentState = () => ({
    unfold: config.unfold.progress,
    drop: config.fold.cornerDrop,
    tug: config.tug.progress,
    lift: config.scrollLift.progress,
  });

  // Works out where everything is in world units. Used by sync() for the
  // uniforms, and by main.js to line the HTML up with the cloth. Pass a
  // `state` to measure some other moment (main.js asks for the resting one).
  function measure(viewWidth, viewHeight, state = currentState()) {
    const f = config.fold;
    const m = {
      height: viewHeight,
      left: -viewWidth / 2,
      right: viewWidth / 2,
      top: viewHeight / 2,
      bottom: -viewHeight / 2,
    };
    m.seamX = m.left + config.layout.stripFraction * viewWidth;
    m.depth = f.foldDepth * viewHeight;
    m.crease = m.top - config.unfold.startDepth * viewHeight * (1 - state.unfold);
    m.rects = {
      strip: [m.left, m.seamX, m.bottom, m.top],
      main: [m.seamX, m.right, m.bottom, m.top],
    };

    // Pins: the strip at its top-left corner; the main piece along the top
    // right, so its bar starts mainPinFraction in from the right edge.
    const mainPinX = Math.max(m.right - config.layout.mainPinFraction * viewWidth, m.seamX + 0.05);
    const pins = {
      strip: new THREE.Vector2(m.left, m.top),
      main: new THREE.Vector2(mainPinX, m.top),
    };
    const corner = new THREE.Vector2(m.seamX, m.top); // both pieces' inner top corner

    const tug = state.tug;
    // Where each corner is dragged to: far enough along its direction that the
    // crease (halfway there) ends up past the whole screen.
    const reach = 2.1 * Math.hypot(viewWidth, viewHeight);
    const farFor = (side) => {
      const [tx, ty] = config.tug.direction[side];
      return corner.clone().add(new THREE.Vector2(tx, ty).normalize().multiplyScalar(reach));
    };

    // Scrolling the page "pushes up" the main piece's corner: its drop is
    // scaled down as `lift` goes 0 → 1, until it lies flat. The strip stays.
    const lift = THREE.MathUtils.smoothstep(state.lift ?? 0, 0, 1);
    const drops = { strip: state.drop, main: state.drop * (1 - lift) };

    m.bars = {};
    m.shapeStrength = {};
    for (const side of ['strip', 'main']) {
      const rest = restBar(pins[side], drops[side], m);
      if (tug <= 0) {
        m.bars[side] = rest;
      } else {
        const tip = new THREE.Vector2().copy(reflect(corner, rest.pin, rest.normal)); // where the corner rests
        m.bars[side] = tugBar(rest, corner, tip.lerp(farFor(side), tug));
      }
    }

    // Tugging pulls the flaps flat (otherwise a lifted flap swept that far
    // would swing up into the camera).
    m.foldAngle = THREE.MathUtils.lerp(f.foldAngle, 1, THREE.MathUtils.smoothstep(tug, 0, 0.25));

    // Wave and radius jitter fade out when the corners are up (the bar lies
    // along the top edge, and a wobble would poke over it) and as the tug
    // drags the crease away.
    for (const side of ['strip', 'main']) m.shapeStrength[side] = drops[side] * (1 - tug);
    return m;
  }

  // Where each piece's flap lies, as 3D polygons, plus the flat part of the
  // main panel. main.js projects these to the screen to clip the page text.
  //
  // Cloth that started distance d past the crease ends up (straight part of
  // wrap() in the vertex shader) at
  //   s = R sinθ + (d − Rθ) cosθ   across the crease
  //   z = R(1 − cosθ) + (d − Rθ) sinθ   toward the viewer
  // That's a linear function of d, so straight edges stay straight and we can
  // just move the polygon's corners. We err on the side of covering a bit
  // more (smaller radius, crease nudged by the wave) so text never pokes
  // out from under a flap.
  function folds(m) {
    const half = m.crease < m.top;
    const result = { flaps: {} };
    for (const side of ['strip', 'main']) {
      const [x0, x1, y0, y1] = m.rects[side];
      const rect = [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }];
      const bar = m.bars[side];
      const line = half
        ? { point: { x: 0, y: m.crease }, normal: { x: 0, y: 1 }, R: config.unfold.radius, theta: Math.PI, slack: 0 }
        : {
            point: bar.pin, normal: bar.normal, theta: m.foldAngle * Math.PI,
            R: Math.max(config.fold.radius * (1 - config.fold.radiusJitter * m.shapeStrength[side]), 0.002),
            slack: config.fold.waveAmp * m.shapeStrength[side],
          };
      const { point, normal, R, theta, slack } = line;
      if (side === 'main') result.flatMain = clipByLine(rect, point, normal, -1);

      const c = Math.cos(theta);
      const s = Math.sin(theta);
      result.flaps[side] = clipByLine(rect, point, normal, 1).map((p) => {
        const d = (p.x - point.x) * normal.x + (p.y - point.y) * normal.y + slack;
        const across = R * s + (d - R * theta) * c - slack;
        const z = Math.max(R * (1 - c) + (d - R * theta) * s, 0);
        const footX = p.x - (d - slack) * normal.x;
        const footY = p.y - (d - slack) * normal.y;
        return new THREE.Vector3(footX + across * normal.x, footY + across * normal.y, z);
      });
    }
    return result;
  }

  // Pick a fabric from the current theme by name.
  function setFabric(name) {
    if (fabrics()[name]) currentFabric = name;
  }

  // Copy config values into uniforms. Call after any config change.
  function sync(viewWidth, viewHeight) {
    const f = config.fold;
    const m = measure(viewWidth, viewHeight);
    const fabric = fabrics()[currentFabric];
    const look = config.look;

    for (const piece of pieces) {
      const u = piece.uniforms;
      const b = m.bars[piece.side];
      u.uRect.value.set(...m.rects[piece.side]);

      u.uCrease.value = m.crease;
      u.uCreaseRadius.value = config.unfold.radius;

      u.uBarStart.value.copy(b.pin);
      u.uBarDir.value.copy(b.dir);
      u.uBarNormal.value.copy(b.normal);
      u.uBarLen.value = Math.min(b.len, m.height);
      u.uFoldAngle.value = m.foldAngle;
      u.uRadius.value = f.radius;
      u.uRadiusJitter.value = f.radiusJitter * m.shapeStrength[piece.side];
      u.uWaveAmp.value = f.waveAmp * m.shapeStrength[piece.side];
      u.uWaveFreq.value = f.waveFreq;
      u.uSeed.value = f.seed + (piece.side === 'strip' ? 31.7 : 0); // different wobble per piece

      u.uColorA.value.set(fabric.color);
      u.uColorB.value.set(fabric.weftColor);
      u.uSeamColor.value.set(look.stitchColor);
      u.uThreadDensity.value = look.threadDensity * (fabric.scale ?? 1);
      u.uPatternContrast.value = look.patternContrast;
      u.uLightDir.value.set(...look.lightDir).normalize();
      u.uShadowStrength.value = look.shadowStrength;

      u.uSeamX.value = m.seamX;
      u.uSeamOpacity.value = config.seam.opacity;
      u.uShowGrid.value = config.debug.grid ? 1 : 0;
      u.uShowBend.value = config.debug.bendTint ? 1 : 0;
      piece.material.wireframe = config.debug.wireframe;
    }
    return m;
  }

  // Swap in new planes with a different subdivision (for the GUI).
  function rebuildGeometry() {
    for (const piece of pieces) {
      const seg = config.geometry[piece.side];
      piece.mesh.geometry.dispose(); // free the old GPU buffers
      piece.mesh.geometry = new THREE.PlaneGeometry(1, 1, seg.segmentsX, seg.segmentsY);
    }
  }

  return { group, sync, measure, folds, setFabric, currentFabric: () => currentFabric, rebuildGeometry };
}
