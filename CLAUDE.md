I'm learning WebGL and want to build a small prototype website. No Blender: all fabric motion should come from code (Three.js + GLSL shaders). Please comment the code well and explain key concepts as you go, since I'm here to learn.

## The concept
A website where the page looks like fabric. When you navigate to a new page, the fabric content panel animates in. The top edge of the panel folds over toward the viewer, like a cuff or folded-over cloth, and the header stays visible on that folded flap. Layout reference: docs/layout-sketch.svg. In short:
- A narrow strip on the left (~15% width) and the main panel are two fabric pieces joined by a vertical seam. The seam can be a static visual line; no sewing animation needed.
- The top band (~20% of height) is folded over toward the viewer, with a soft, slightly uneven fold edge.
- The top-right corner has a small curl/dog-ear.

## Variation (important)
Each time the fold happens it should look slightly different, so it feels like real cloth rather than a canned animation. Do this by randomizing shader parameters per transition, for example:
- fold radius, fold height, slight tilt of the fold line
- low-frequency noise along the fold edge (waviness, small wrinkles)
- timing/easing, slight overshoot and settle
- corner curl amount
Also define 3–4 hand-tuned "presets" (e.g. crisp, soft, rumpled, lazy) and pick one at random, then add small random jitter on top. Keep all values in one config object so I can tweak them.

## Tech
- Vite + vanilla JS + Three.js. No React, no heavy frameworks.
- GSAP for animating shader uniforms (fold progress 0 → 1).
- The fabric is a subdivided PlaneGeometry deformed in a custom vertex shader (wrap the area above the fold line around a cylinder). Fragment shader: a procedural or small tiling fabric texture, plus simple lighting from computed normals so folds read as 3D, and a soft shadow under the flap.
- The header text, nav, and page content must be real HTML positioned over the canvas, NOT rendered in WebGL. The header should visually sit on the folded flap.
- 2–3 dummy pages with simple client-side navigation (View Transitions API or a tiny custom router). Clicking a nav link replays the fold with new random parameters.

## Performance (my laptop is modest)
- One canvas, one or two meshes, ideally one draw call each.
- Plane subdivision only as dense as needed (start ~64×64, make it a config value).
- Cap devicePixelRatio at 1.5.
- Render on demand: only run the render loop while an animation is playing, then stop. Idle should cost ~0% GPU.
- No post-processing, no shadow maps, no physics libraries.
- Handle resize so the fabric always fills the viewport at any aspect ratio.
- Respect prefers-reduced-motion with a simple crossfade fallback.

## How to work
1. Start with the minimum: a single plane with the fold shader and a slider (lil-gui) to scrub fold progress and tweak parameters. Stop and let me run it.
2. Then add the fabric look and lighting.
3. Then the randomized presets.
4. Then the HTML overlay and page navigation.
After each step, tell me what to look at and what concept I just learned (e.g. "uniforms", "vertex displacement", "normals").

## Directory
The steps above are done; the fabric prototype is now the site itself.
- `src/`, `public/`, `index.html`: the site. Every tweakable value is in `src/config.js`; page content is in `src/pages.js`.
- `docs/CONTENT.md`: the text that must appear on each page, and the nav order. Defer to it for content.
- `docs/DESIGN.md`: type, colour and layout rules. Defer to it for style choices.
- `docs/layout-sketch.svg`: the hand-drawn fabric layout. `docs/old-site-screenshot.png`: the old Squarespace site. Don't copy its look, but use it for how photos sit alongside text.
- `public/graphics/name_written.svg`: my hand-written name. It always stays at the top left.
- `originals/sewing_photos/`: full-size photos. The site uses resized copies in `public/photos/`.
- `LLM Bibliography/`: one file per AI-assisted session.
