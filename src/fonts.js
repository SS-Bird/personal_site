// ---------------------------------------------------------------------------
// fonts.js: fonts to try out. Pick them in the debug panel ("Fonts"), or
// compare them all on the /fonts page.
//
// Google fonts are only downloaded when first used (a <link> tag is added
// then), so trying fonts doesn't slow down normal page loads.
// ---------------------------------------------------------------------------

// name: what's shown; stack: CSS font-family with fallbacks; google: load it from Google Fonts
export const FONTS = [
  // the site's current font
  { name: 'Arial', stack: 'Arial, Helvetica, sans-serif', kind: 'sans' },
  { name: 'Inter', stack: '"Inter", Arial, sans-serif', kind: 'sans', google: true },
  { name: 'DM Sans', stack: '"DM Sans", Arial, sans-serif', kind: 'sans', google: true },
  { name: 'Work Sans', stack: '"Work Sans", Arial, sans-serif', kind: 'sans', google: true },
  { name: 'Karla', stack: '"Karla", Arial, sans-serif', kind: 'sans', google: true },
  { name: 'Jost', stack: '"Jost", Arial, sans-serif', kind: 'sans', google: true },
  { name: 'Space Grotesk', stack: '"Space Grotesk", Arial, sans-serif', kind: 'sans', google: true },

  { name: 'Georgia', stack: 'Georgia, "Times New Roman", serif', kind: 'serif' },
  { name: 'EB Garamond', stack: '"EB Garamond", Georgia, serif', kind: 'serif', google: true },
  { name: 'Cormorant Garamond', stack: '"Cormorant Garamond", Georgia, serif', kind: 'serif', google: true },
  { name: 'Libre Baskerville', stack: '"Libre Baskerville", Georgia, serif', kind: 'serif', google: true },
  { name: 'Crimson Pro', stack: '"Crimson Pro", Georgia, serif', kind: 'serif', google: true },
  { name: 'Lora', stack: '"Lora", Georgia, serif', kind: 'serif', google: true },
  { name: 'Spectral', stack: '"Spectral", Georgia, serif', kind: 'serif', google: true },
  { name: 'Fraunces', stack: '"Fraunces", Georgia, serif', kind: 'serif', google: true },
  { name: 'IM Fell English', stack: '"IM Fell English", Georgia, serif', kind: 'historical', google: true },
  { name: 'Playfair Display', stack: '"Playfair Display", Georgia, serif', kind: 'display', google: true },
  { name: 'DM Serif Display', stack: '"DM Serif Display", Georgia, serif', kind: 'display', google: true },

  { name: 'Courier Prime', stack: '"Courier Prime", "Courier New", monospace', kind: 'typewriter', google: true },
  { name: 'Special Elite', stack: '"Special Elite", "Courier New", monospace', kind: 'typewriter', google: true },
  { name: 'IBM Plex Mono', stack: '"IBM Plex Mono", "Courier New", monospace', kind: 'mono', google: true },

  { name: 'Caveat', stack: '"Caveat", cursive', kind: 'handwritten', google: true },
  { name: 'Reenie Beanie', stack: '"Reenie Beanie", cursive', kind: 'handwritten', google: true },
  { name: 'Homemade Apple', stack: '"Homemade Apple", cursive', kind: 'handwritten', google: true },
];

const byName = Object.fromEntries(FONTS.map((f) => [f.name, f]));
const loaded = new Set();

function googleUrl(names) {
  const families = names.map((n) => `family=${n.replace(/ /g, '+')}`).join('&');
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

// Add the Google Fonts stylesheet for any of these fonts not loaded yet.
export function loadFonts(names) {
  const todo = names.filter((n) => byName[n]?.google && !loaded.has(n));
  if (!todo.length) return;
  todo.forEach((n) => loaded.add(n));
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = googleUrl(todo);
  document.head.appendChild(link);
}

export const stackFor = (name) => byName[name]?.stack ?? byName.Arial.stack;

// Point the CSS variables at the chosen fonts (style.css uses them).
export function applyFonts(choice) {
  loadFonts([choice.heading, choice.body, choice.nav]);
  const root = document.documentElement.style;
  root.setProperty('--font-heading', stackFor(choice.heading));
  root.setProperty('--font-body', stackFor(choice.body));
  root.setProperty('--font-nav', stackFor(choice.nav));
}
