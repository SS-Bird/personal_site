// ---------------------------------------------------------------------------
// config.js: every tweakable number lives here.
//
// World units: the camera is set up so the visible area is exactly 2 units
// tall (y from -1 to +1). Width = 2 * aspect ratio. So "radius: 0.03" means
// "3% of half the screen height", whatever the window size.
// ---------------------------------------------------------------------------

export const config = {
  renderer: {
    // Retina screens report devicePixelRatio 2 or 3. Rendering at 3x means
    // 9x the pixels to shade, so we cap it (spec: 1.5).
    maxPixelRatio: 1.5,
  },

  camera: {
    // A narrow field of view = less perspective distortion. The page looks
    // nearly flat, but things that come toward the viewer still get a bit
    // bigger, which helps the fold read as 3D.
    fov: 30,
  },

  layout: {
    stripFraction: 0.18,   // width of the left strip, as a fraction of the screen width
    mainPinFraction: 0.22, // the main piece is pinned along this much of the top, from the right edge
    contentLeft: 0.34,     // where the page text starts (fraction of screen width)...
    contentTop: 0.2,       // ...and height. If the resting flap reaches lower than this,
                           // the text starts just below the flap instead, so text
                           // always disappears along a straight line when scrolling.
  },

  geometry: {
    // How many quads each piece is split into. The vertex shader can only
    // move vertices, so a curve needs enough of them to look smooth.
    // Toggle "wireframe" in the GUI to see them. The strip is narrow, so it
    // needs fewer columns.
    main:  { segmentsX: 64, segmentsY: 96 },
    strip: { segmentsX: 12, segmentsY: 96 },
  },

  // First open only: the sheet arrives folded once (top part folded down in
  // front), and its crease is pulled up until it lies flat.
  unfold: {
    progress: 0,       // 0 = folded, 1 = crease pulled up to the top edge (flat)
    startDepth: 0.7,   // where the crease starts, as a fraction of screen height from the top
    radius: 0.077,     // roundness of that crease
  },

  // The inner corners falling over their bars.
  fold: {
    cornerDrop: 0,      // 0 = corners up (cloth flat), 1 = resting position
    foldDepth: 0.1575,  // how far below the top the bars meet the seam at rest (fraction of screen height)
    foldAngle: 0.8,     // 1 = flap flipped all the way flat, 0.8 = lifted a little off the page
    radius: 0.015,      // radius of the bar the cloth wraps around (thickness of the fold)
    radiusJitter: 0.29, // how much the radius varies along the bar (0 = perfectly even)
    waveAmp: 0.022,     // how far the crease wanders off a straight line (unevenness)
    waveFreq: 3.0,      // how many "bumps" of unevenness along the bar
    seed: 0,            // changes the noise pattern; re-randomized for every new sheet
  },

  // Page change: the inner corners are tugged down and outward until both
  // pieces have peeled off the screen: the right piece down and right, the
  // left strip down and left.
  tug: {
    progress: 0,        // 0 = resting, 1 = both pieces pulled completely off
    direction: {        // which way each corner is dragged (x, y)
      strip: [-1, -0.8],
      main: [1, -0.8],
    },
  },

  // Scrolling down a page pushes the main piece's fallen corner back up
  // until it lies flat; scrolling back to the top lets it fall again.
  scrollLift: {
    progress: 0,       // 0 = page at the top (corner down), 1 = scrolled far enough (flat)
    distance: 500,     // px of scrolling to go from 0 to 1
  },

  seam: {
    opacity: 0,         // hidden while unfolding (looks like one sheet), fades in as the corners drop
    restOpacity: 0.9,
  },

  // Themes: the colours of the fabric AND of what's underneath it.
  // Switch with `theme` (or Colours → theme in the debug panel).
  //   light: Lamont "white guard" linens over the grey plaid
  //   dark:  "dirty jewel" linens over the ochre plaid
  // Each theme uses one of the palettes below for its fabric + text colours;
  // switching theme switches palette too.
  theme: 'light',   // default
  themes: {
    light: {
      palette: 'Lamont · white guard',
      base: '#8e8e8c',      // what's under the fabric (shows while the pattern loads)
      // Tiled fabric scans in public/textures: 'plaid-ochre.jpg' or 'plaid-grey.jpg'
      baseImage: 'url(/textures/plaid-grey.jpg)',
      baseSize: '480px',
      headerInk: '#ffffff', // name + nav, on the base
      navInk: '#ffffff',
      // ink / muted / marker and the fabric colours come from the palette.
      // scale: thread size multiplier per fabric (bigger = finer threads)
      fabrics: {
        natural:  { scale: 1.45 }, oatmeal:  { scale: 1.45 }, sage:     { scale: 1.45 },
        bleached: { scale: 1.45 }, chambray: { scale: 1.45 }, rose:     { scale: 1.45 },
      },
    },
    dark: {
      palette: 'Dirty jewels',
      base: '#a68f3e',
      baseImage: 'url(/textures/plaid-ochre.jpg)',
      baseSize: '480px',
      headerInk: '#ffffff',
      navInk: '#ffffff',
      fabrics: {
        natural:  { scale: 1.45 }, oatmeal:  { scale: 1.45 }, sage:     { scale: 1.45 },
        bleached: { scale: 1.45 }, chambray: { scale: 1.45 }, rose:     { scale: 1.45 },
      },
    },
  },

  // Fonts (any name from src/fonts.js). Try them in the debug panel or on /fonts.
  fonts: {
    heading: 'Karla',
    body: 'Crimson Pro',
    nav: 'Karla',
  },

  // Ready-made colour sets for the fabric and its text. Each theme names one
  // above; the debug panel (Colours → palette) lets you try others.
  // The Lamont ones are drawn from the Lamont tartan: navy, bottle green and
  // black, with fine white guard lines. Navy and green sit opposite the ochre
  // plaid underneath, and the red stitching ties the two together.
  // Where a fabric's warp and weft differ (e.g. navy × green), it's a "shot"
  // fabric: the two colours blend where they cross, like tartan.
  // Keys are the page fabric names from pages.js:
  //   natural = Home, oatmeal = 1780s Ensemble, sage = Larp!,
  //   bleached = Other Historical Pieces, chambray = Modern Pieces, rose = Mending
  palettes: {
    'Dirty jewels': { // jewel colours greyed and darkened, each woven with a
                      // near-black weft so they look worn and smoky
      ink: '#e9e3d6', muted: '#ada79b', marker: '#837e74',
      fabrics: {
        natural:  { color: '#2b3448', weftColor: '#1b1e26' }, // smoky sapphire
        oatmeal:  { color: '#2a3f35', weftColor: '#1a201d' }, // dull emerald
        sage:     { color: '#3b2d3d', weftColor: '#1f1a20' }, // dusty amethyst
        bleached: { color: '#151517', weftColor: '#1b1b1e' }, // near-black (as in Lamont · modern)
        chambray: { color: '#253b3e', weftColor: '#191f21' }, // tarnished peacock
        rose:     { color: '#42262a', weftColor: '#211819' }, // old garnet
      },
    },
    'Lamont · modern': { // deep, saturated tartan dyes
      ink: '#f1eee6', muted: '#b9b8b0', marker: '#8e8c84',
      fabrics: {
        natural:  { color: '#1e2a4a', weftColor: '#25335a' }, // navy
        oatmeal:  { color: '#173f2e', weftColor: '#1d4a36' }, // bottle green
        sage:     { color: '#1e2a4a', weftColor: '#173f2e' }, // navy × green
        bleached: { color: '#17181b', weftColor: '#222429' }, // black
        chambray: { color: '#173f2e', weftColor: '#17181b' }, // green × black
        rose:     { color: '#1e2a4a', weftColor: '#17181b' }, // navy × black
      },
    },
    'Lamont · ancient': { // the same sett in faded, vegetable-dye tones
      ink: '#f3efe4', muted: '#c8c4b8', marker: '#9fa39a',
      fabrics: {
        natural:  { color: '#3d5f6e', weftColor: '#45697a' }, // faded blue
        oatmeal:  { color: '#3e6252', weftColor: '#466c5b' }, // teal green
        sage:     { color: '#3d5f6e', weftColor: '#3e6252' }, // blue × teal
        bleached: { color: '#2e3436', weftColor: '#363d40' }, // soft black
        chambray: { color: '#4f6f5f', weftColor: '#3d5f6e' }, // sea green × blue
        rose:     { color: '#3a4f63', weftColor: '#2e3436' }, // slate × black
      },
    },
    'Lamont · weathered': { // muted, leaning toward the ochre underneath
      ink: '#eee8da', muted: '#c2baa8', marker: '#9a9282',
      fabrics: {
        natural:  { color: '#3b4a52', weftColor: '#44535b' }, // slate
        oatmeal:  { color: '#46502f', weftColor: '#4f5935' }, // moss
        sage:     { color: '#3b4a52', weftColor: '#46502f' }, // slate × moss
        bleached: { color: '#2b2a27', weftColor: '#34322e' }, // peat
        chambray: { color: '#55603f', weftColor: '#3b4a52' }, // lichen × slate
        rose:     { color: '#3a3f4a', weftColor: '#2b2a27' }, // dusk × peat
      },
    },
    'Lamont · white guard': { // light: the tartan's white lines, with navy text
      ink: '#1c2333', muted: '#4e5766', marker: '#7d8593',
      fabrics: {
        natural:  { color: '#e9e6dc', weftColor: '#f1eee6' }, // white
        oatmeal:  { color: '#d6ddd4', weftColor: '#e0e5dc' }, // green-white
        sage:     { color: '#d5dbe4', weftColor: '#e9e6dc' }, // blue-white × white
        bleached: { color: '#efece4', weftColor: '#f5f3ed' }, // bright white
        chambray: { color: '#cfd8d0', weftColor: '#d5dbe4' }, // pale green × pale blue
        rose:     { color: '#dadde6', weftColor: '#e9e6dc' }, // pale navy × white
      },
    },
    'Original': { // the colours before the Lamont palettes
      ink: '#ece6da', muted: '#b9b2a6', marker: '#8d877d',
      fabrics: {
        natural:  { color: '#3a3836', weftColor: '#45423e' }, // charcoal
        oatmeal:  { color: '#4a3b2f', weftColor: '#56473a' }, // umber
        sage:     { color: '#2f3d33', weftColor: '#3a483d' }, // forest
        bleached: { color: '#3b4248', weftColor: '#465058' }, // slate
        chambray: { color: '#283447', weftColor: '#334057' }, // indigo
        rose:     { color: '#4a2a2c', weftColor: '#573537' }, // oxblood
      },
    },
  },

  look: {
    // All stitching (the seam and the photos) is one red thread, a little
    // darker than the red in the plaid underneath (#9d4737).
    stitchColor: '#98200b',
    threadDensity: 141,   // threads per world unit (× each fabric's scale)
    patternContrast: 0.93, // 0 = flat colour, 1 = full weave texture
    lightDir: [-0.35, 0.5, 1.0], // light comes from the top-left, in front of the page
    shadowStrength: 0.36, // how dark the shadow under a flap is
  },

  animation: {
    // first open: the sheet unfolds, then the corners drop
    unfold: { duration: 1.6, ease: 'power2.inOut' },
    pause: 0.15,        // seconds between unfolding and the corners dropping
    drop: { duration: 1.0, ease: 'power2.in' }, // "in" = starts slow, speeds up, like falling
    // page change
    tug: { duration: 1.1, ease: 'power2.in' },        // old cloth dragged off by its corners, speeding up
    betweenSheets: 0.15, // seconds of empty screen between the two
    tugReturn: { duration: 1.1, ease: 'power2.out' }, // new cloth dragged back in by its corners, settling
    reducedMotionFade: 0.35, // crossfade length when the user prefers reduced motion
  },

  debug: {
    wireframe: false,   // show the triangles
    grid: false,        // draw a grid on the cloth so you can see it stretch/bend
    bendTint: false,    // tint cloth that's wrapped around a crease red
  },
};
