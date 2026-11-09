// ---------------------------------------------------------------------------
// script.js: loads the page writing from the Markdown files in /script.
//
// import.meta.glob is a Vite feature: at build time it finds every file
// matching the pattern and bundles it in. `query: '?raw'` gives each file
// as a plain string (like the shaders in fabric.js), and `eager: true`
// loads them all up front instead of on demand. In dev, saving a file
// reloads the page.
//
// Each file is split into named "slots" at lines like
//   <!-- slot: intro -->
// and each slot is turned from Markdown into HTML with `marked`.
// See script/README.md for how to write them.
// ---------------------------------------------------------------------------
import { marked } from 'marked';

const files = import.meta.glob(['/script/**/*.md', '!/script/README.md'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

// A slot marker on a line of its own. The ( ) "captures" the slot's name, so
// String.split keeps it: 'a <!-- slot: x --> b' → ['a ', 'x', ' b'].
const SLOT_LINE = /^[ \t]*<!--\s*slot:\s*([\w-]+)\s*-->[ \t]*$/m;

// Links that start with "/" go to another page of this site: mark them so
// the router (router.js) handles them without a full page reload.
// Links to other sites (http...) open in a new tab, so the site stays open.
// rel="noopener" stops the new tab from being able to control this one.
function markInternalLinks(html) {
  return html
    .replace(/<a href="(\/[^"]*)"/g, '<a href="$1" data-link')
    .replace(/<a href="(https?:[^"]*)"/g, '<a href="$1" target="_blank" rel="noopener"');
}

// '/sewing/larp' → the slots of script/sewing/larp.md, as HTML strings.
// Returns a function: slot('intro') → that slot's HTML ('' if missing).
export function script(name) {
  const path = `/script/${name}.md`;
  const text = files[path];
  if (text === undefined && import.meta.env.DEV) console.warn(`[script] missing ${path}`);

  const parts = (text ?? '').split(SLOT_LINE);
  const slots = {};
  // Writing before the first marker counts as the "body" slot.
  if (parts[0].trim()) slots.body = parts[0];
  for (let i = 1; i < parts.length; i += 2) slots[parts[i]] = parts[i + 1];

  return (slot) => {
    if (!(slot in slots)) {
      if (import.meta.env.DEV && text !== undefined) console.warn(`[script] ${path} has no slot "${slot}"`);
      return '';
    }
    return markInternalLinks(marked.parse(slots[slot]));
  };
}
