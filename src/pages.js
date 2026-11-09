// ---------------------------------------------------------------------------
// pages.js: the site's pages: layout and photos.
// The WRITING isn't here: it's in the Markdown files in /script, one per
// page, split into named slots (script.js). Each page below drops its slots
// in among the photos with ${s('slotName')}.
// Each page is plain HTML placed on top of the fabric, plus the name of the
// linen it's printed on (one of config.fabrics).
// Photos live in public/photos (resized copies of originals/sewing_photos).
//
// Site structure:
//   '/'          landing page (where the site opens; the name links here)
//   header nav:  Sewing · Projects · Resume        (index.html)
//   Sewing has subpages, reached by the patches sewn onto the left strip
//   (`sewingPatches` below, drawn by patches.js). Any page with
//   section: 'sewing' shows the patches.
// ---------------------------------------------------------------------------

import { FONTS } from './fonts.js';
import { script } from './script.js';

// ---- Photos ------------------------------------------------------------------
// photo(file, alt, options)
//   file: path inside public/photos, e.g. '1780s/IMG_0083.jpg'. Spaces in
//         folder names are fine: encodeURI turns them into %20 for the URL.
//   alt:  a description for people who can't see the photo.
//   at:   where it sits in a .collage grid, as 'columns / rows', e.g.
//         '1 / 6, 1 / 10' = grid columns 1 to 6, rows 1 to 10. The grid is 12
//         columns wide; rows are short (see .collage in style.css), so a
//         photo's height is set by how many rows it spans.
//   eager: load it straight away (for photos near the top of a page).
//          Otherwise loading="lazy" waits until it's about to scroll into view.
//   focus: which part of the photo to keep when its grid box crops it, as a
//          CSS object-position, e.g. 'center 70%' = keep the lower middle.
//          Without it, the middle of the photo is kept.
// Each <figure> gets sewn onto the cloth by photoStitches.js.
const place = (at) => {
  if (!at) return '';
  const [c, r] = at.split(',').map((x) => x.trim());
  return ` style="grid-column: ${c}; grid-row: ${r}"`;
};
const photo = (file, alt, { at, eager = false, focus } = {}) =>
  `<figure${place(at)}><img src="${encodeURI(`/photos/${file}`)}" alt="${alt}"${eager ? '' : ' loading="lazy"'}${focus ? ` style="object-position: ${focus}"` : ''} /></figure>`;

// A short looping clip, used like a GIF (an .mp4 is ~15x smaller than the
// same GIF). `muted` + `playsinline` are what let browsers autoplay it.
// `poster` is a still shown until it loads. With reduced motion, main.js
// stops it and shows play controls instead.
const clip = (file, poster, alt, { at } = {}) =>
  `<figure${place(at)} data-stitch-seed="${file}"><video src="${encodeURI(`/photos/${file}`)}" poster="${encodeURI(`/photos/${poster}`)}" aria-label="${alt}" autoplay loop muted playsinline preload="metadata"></video></figure>`;

// A row of photos that scrolls sideways. Each photo keeps its own shape.
const strip = (label, photos, size = '') =>
  `<div class="photo-strip ${size}" role="region" aria-label="${label}, scroll sideways for more" tabindex="0">${photos.join('')}</div>`;



// A page for comparing fonts (not in the nav: go to /fonts). Each sample is
// set in its own font; the buttons apply it to the site (see main.js).
const fontSamples = FONTS.map((f) => `
  <section class="font-sample" style="font-family: ${f.stack.replace(/"/g, '&quot;')}">
    <p class="font-name">${f.name} <span>· ${f.kind}</span></p>
    <h2>Other Historical Pieces</h2>
    <p>My entirely hand stitched 18th century men’s shirt. This is one of my absolute favorite creations.</p>
    <p class="font-nav-sample">Home &nbsp; 1780s Ensemble &nbsp; Larp! &nbsp; Mending</p>
    <p class="font-buttons">
      Use for:
      <button type="button" data-font-role="heading" data-font="${f.name}">headings</button>
      <button type="button" data-font-role="body" data-font="${f.name}">body</button>
      <button type="button" data-font-role="nav" data-font="${f.name}">nav</button>
      <button type="button" data-font-role="all" data-font="${f.name}">all</button>
    </p>
  </section>`).join('');

// The patches on the left strip, top to bottom (order from docs/CONTENT.md).
// `fabric` is a key of config.patches.fabrics (the scans in public/textures).
export const sewingPatches = [
  { path: '/sewing/1780s-ensemble', label: '1780s Ensemble',          fabric: 'fenwick' },
  { path: '/sewing/larp',           label: 'Larp!',                   fabric: 'barraglom' },
  { path: '/sewing/historical',     label: 'Other Historical Pieces', fabric: 'ballantrae' },
  { path: '/sewing/modern',         label: 'Modern Pieces',           fabric: 'navy' },
  { path: '/sewing/mending',        label: 'Mending',                 fabric: 'cockburn' },
];

// A page that's only writing (no photos): its script's "body" slot.
const textPage = (title, fabric, file) => ({
  title,
  fabric,
  html: `
      <article class="page">
        ${script(file)('body')}
      </article>`,
});

// One loader per script file: e.g. mending('intro') = that slot's HTML.
const sewing = script('sewing');
const ensemble = script('sewing/1780s-ensemble');
const historical = script('sewing/historical');
const modern = script('sewing/modern');
const mending = script('sewing/mending');
const larp = script('sewing/larp');

export const pages = {
  // The landing page: one photo beside the writing (cropped below the Bicolline
  // logo; the uncropped one is on the Larp page).
  '/': {
    title: 'Sophie Bird',
    fabric: 'natural',
    html: `
      <article class="page landing">
        <div class="landing-text">${script('landing')('body')}</div>
        ${photo('landing page/Bicolline2025picture.jpg', 'Sophie laughing in a linen shirt and blue bodice at Bicolline', { eager: true })}
      </article>`,
  },

  '/sewing': {
    title: 'Sewing — Sophie Bird',
    section: 'sewing',
    fabric: 'sage',
    html: `
      <article class="page">
        ${sewing('intro')}
        <div class="collage" aria-label="A selection of Sophie’s sewing projects">
          ${photo('1780s/IMG_0411.jpg', 'Sophie in the 1780s ensemble: green stays, grey petticoat over yellow, in a historic kitchen', { at: '1 / 8, 1 / 7', eager: true })}
          ${photo('Larp/Bicolline2025picture.jpg', 'Sophie laughing in a linen shirt and blue bodice at a larp tavern', { at: '8 / 13, 1 / 5', eager: true })}
          ${photo('More Historical/IMG_0203.jpg', 'The blue 1890s walking skirt worn in the snow', { at: '8 / 13, 5 / 9' })}
          ${photo('Modern Pieces/IMG_0362.jpg', 'A colourful patchwork top', { at: '1 / 5, 7 / 12' })}
          ${photo('Modern Pieces/italy dress/IMG_0205.JPG', 'Sophie in a mint green dress in a stone garden', { at: '5 / 9, 7 / 12' })}
          ${photo('1780s/IMG_0083.jpg', 'The red 1780s jacket from behind', { at: '9 / 13, 9 / 12' })}
          ${photo('More Historical/IMG_0405.jpg', 'The gathered collar of the hand-stitched linen shirt', { at: '1 / 7, 12 / 17' })}
          ${photo('Modern Pieces/IMG_0344.JPG', 'The back of a sage green top, its straps crossed', { at: '7 / 13, 12 / 17' })}
        </div>
      </article>`,
  },

  '/sewing/1780s-ensemble': {
    section: 'sewing',
    title: '1780s Ensemble — Sophie Bird',
    fabric: 'sage',
    html: `
      <article class="page">
        ${ensemble('intro')}
        <div class="collage">
          ${photo('1780s/IMG_0411.jpg', 'The full ensemble: green stays, grey petticoat over a yellow one, in a historic kitchen', { at: '1 / 6, 1 / 10', eager: true })}
          ${photo('1780s/IMG_0083.jpg', 'The red jacket from behind, in the kitchen', { at: '6 / 13, 1 / 6', eager: true })}
          ${photo('1780s/IMG_0136.jpg', 'Close-up of the green stays laced over the linen shift', { at: '6 / 9, 6 / 10' })}
          ${photo('1780s/IMG_0406.jpg', 'The back of the red jacket', { at: '9 / 13, 6 / 10' })}
          ${clip('1780s/IMG_20220601_110158-animation.mp4', '1780s/IMG_20220601_110158-animation.jpg', 'Sophie twirling in the ensemble in a green field', { at: '1 / 5, 10 / 18' })}
          ${photo('1780s/IMG_1897.JPG', 'Sophie lying in the grass in the linen shift', { at: '5 / 9, 10 / 17' })}
          ${photo('1780s/IMG_2348.JPG', 'The green stays and shift outdoors, among trees', { at: '9 / 13, 11 / 18' })}
        </div>
        <section class="page-section">
          ${ensemble('getting-dressed')}
          ${strip('Getting dressed', [
            photo('1780s/getting dressed/IMG_0400.jpg', 'First layer: the linen shift'),
            photo('1780s/getting dressed/IMG_5590.jpg', 'Starting to lace the stays'),
            photo('1780s/getting dressed/IMG_0389.jpg', 'Lacing the stays up the front'),
            photo('1780s/getting dressed/IMG_5677.jpg', 'The stays laced, in the kitchen'),
            photo('1780s/getting dressed/IMG_0305.jpg', 'The stays finished over the shift'),
            photo('1780s/getting dressed/IMG_0315.JPG', 'Tying the petticoat’s waist tape over the stays'),
            photo('1780s/getting dressed/IMG_0293.jpg', 'The embroidered pocket tied over the petticoat'),
          ])}
        </section>
        <section class="page-section">
          ${ensemble('process')}
          ${ensemble('stays')}
          ${strip('Making the stays', [
            photo('1780s/process/stays/IMG_0655.jpg', 'The stays pattern drafted with boning channels'),
            photo('1780s/process/stays/IMG_0746.jpg', 'Pattern pieces laid out on dark fabric'),
            photo('1780s/process/stays/IMG_0756.jpg', 'The stays pieces cut out'),
            photo('1780s/process/stays/IMG_0822.jpg', 'The green outer pieces'),
            photo('1780s/process/stays/IMG_0987.jpg', 'Binding the edge of the stays'),
            photo('1780s/process/stays/IMG_0989 (1).jpg', 'The boned stays with eyelets for lacing'),
          ], 'small')}
          ${ensemble('jacket')}
          ${strip('Making the jacket', [
            photo('1780s/process/jacket/IMG_1433.jpg', 'Fitting a mock-up of the jacket'),
            photo('1780s/process/jacket/IMG_1460.jpg', 'The jacket pattern pieces'),
            photo('1780s/process/jacket/IMG_1509.jpg', 'The red jacket skirts over the yellow petticoat'),
            photo('1780s/process/jacket/IMG_1520.jpg', 'The red jacket pieces in progress'),
            photo('1780s/process/jacket/IMG_1521.jpg', 'The jacket’s pleated back skirts'),
          ], 'small')}
        </section>
      </article>`,
  },

  '/sewing/larp': {
    section: 'sewing',
    title: 'Larp! — Sophie Bird',
    fabric: 'sage',
    html: `
      <article class="page">
        ${larp('intro')}
        <div class="collage">
          ${photo('Larp/Bicolline2025picture.jpg', 'Sophie laughing in a linen shirt and blue bodice in a timber tavern', { at: '1 / 6, 1 / 11', eager: true })}
          ${photo('Larp/Bico2025_4.jpg', 'A crowd in costume at night at Bicolline', { at: '6 / 13, 1 / 6', eager: true })}
          ${photo('Larp/DSC09058.jpg', 'Sophie sitting on the grass at camp in a headscarf', { at: '6 / 10, 6 / 13' })}
          ${photo('Larp/IMG_7736 Copy.JPG', 'Sophie in costume in front of a canvas bell tent', { at: '10 / 13, 6 / 13' })}
        </div>
        <section class="page-section">
          ${larp('spooky')}
          <div class="collage">
            ${photo('Larp/halloween dress/IMG_0112.jpg', 'A white corset laced over a black and white striped skirt', { at: '1 / 7, 1 / 7' })}
            ${photo('Larp/halloween dress/IMG_0130.jpg', 'The back of the white corset and its lacing', { at: '7 / 13, 3 / 9' })}
          </div>
        </section>
      </article>`,
  },

  '/sewing/historical': {
    section: 'sewing',
    title: 'Other Historical Pieces — Sophie Bird',
    fabric: 'sage',
    html: `
      <article class="page">
        ${historical('intro')}
        <ul class="project-list">
          <li>
            ${historical('shirt')}
            <div class="collage">
              ${photo('More Historical/IMG_0405.jpg', 'The gathered back and collar of the white linen shirt', { at: '1 / 7, 1 / 7', eager: true })}
              ${photo('More Historical/63355638278__C7CD49A4-2DDF-4BEF-A394-E81E48DA608E.jpg', 'A mirror photo of the shirt worn with white stays', { at: '7 / 11, 1 / 9', eager: true })}
            </div>
          </li>
          <li>
            ${historical('skirt')}
            <div class="collage">
              ${photo('More Historical/IMG_0099.jpg', 'The blue walking skirt with a white blouse, indoors', { at: '1 / 6, 1 / 10' })}
              ${photo('More Historical/IMG_0202.jpg', 'The skirt in a snowy forest', { at: '6 / 13, 1 / 6' })}
              ${photo('More Historical/IMG_0203.jpg', 'The skirt in the snow, closer', { at: '7 / 11, 6 / 12' })}
            </div>
          </li>
          <li>
            ${historical('cape')}
            <div class="collage">
              ${photo('More Historical/IMG_0371.jpg', 'The brown wrap cape crossed over a white blouse', { at: '1 / 8, 1 / 7' })}
              ${photo('More Historical/IMG_0409.jpg', 'Wearing the wrap cape on a staircase', { at: '8 / 13, 1 / 8' })}
              ${photo('More Historical/IMG_0172.jpg', 'Black frog closures on the tweed', { at: '3 / 8, 7 / 11' })}
            </div>
          </li>
        </ul>
      </article>`,
  },

  '/sewing/modern': {
    section: 'sewing',
    title: 'Modern Pieces — Sophie Bird',
    fabric: 'sage',
    html: `
      <article class="page">
        ${modern('intro')}
        <div class="collage">
          ${photo('Modern Pieces/IMG_0362.jpg', 'A colourful patchwork top, front', { at: '1 / 8, 1 / 7' })}
          ${photo('Modern Pieces/IMG_5444.jpg', 'The patchwork top from behind, backless', { at: '8 / 13, 1 / 5' })}
          ${photo('Modern Pieces/IMG_0346.jpg', 'A sage green sleeveless top', { at: '8 / 13, 5 / 9' })}
          ${photo('Modern Pieces/IMG_0081.jpg', 'A corset top worn with trousers', { at: '1 / 6, 7 / 11' })}
          ${photo('Modern Pieces/IMG_0267.JPG', 'The sage green top with wide brown trousers, standing in the snow', { at: '6 / 9, 9 / 16' })}
          ${photo('Modern Pieces/IMG_0344.JPG', 'The back of the sage green top, its straps crossed', { at: '9 / 13, 9 / 13' })}
          ${photo('Modern Pieces/IMG_1961.jpg', 'A white zip pouch with embroidered wavy lines', { at: '1 / 5, 11 / 16' })}
        </div>
        <section class="page-section">
          ${modern('italy-dress')}
          <div class="collage">
            ${photo('Modern Pieces/italy dress/IMG_0205.JPG', 'Sophie in the mint green dress in a stone garden', { at: '1 / 6, 1 / 10' })}
            ${photo('Modern Pieces/italy dress/IMG_0141.JPG', 'Sophie and two friends in long dresses in front of a stone house', { at: '6 / 11, 1 / 8' })}
            ${photo('Modern Pieces/italy dress/IMG_3110.jpg', 'A mirror photo of the dress in progress', { at: '6 / 9, 8 / 13' })}
          </div>
        </section>
        <section class="page-section">
          ${modern('knitting')}
          <div class="collage">
            ${photo('Modern Pieces/Knitting/3BFC1268-B0F9-4D5F-8B99-0C586A4E6214.jpg', 'Sophie in the dark green knitted hat, with headphones over it', { at: '1 / 5, 1 / 9' })}
            ${photo('Modern Pieces/Knitting/51759039-F94F-405D-A2AC-2B7B470C952C.jpg', 'The top of the green hat', { at: '5 / 8, 1 / 8' })}
            ${photo('Modern Pieces/Knitting/IMG_0711.JPG', 'A green and cream sock being knitted', { at: '9 / 12, 2 / 9' })}
            ${photo('Modern Pieces/Knitting/IMG_7066.jpg', 'Sophie in an orange knitted short-sleeve sweater', { at: '1 / 7, 9 / 16' })}
            ${photo('Modern Pieces/Knitting/808700841.462237.jpg', 'The orange sweater, worn outdoors', { at: '7 / 13, 9 / 15' })}
          </div>
        </section>
      </article>`,
  },

  '/projects': textPage('Projects — Sophie Bird', 'chambray', 'projects'),
  '/resume': textPage('Resume — Sophie Bird', 'bleached', 'resume'),

  '/fonts': {
    title: 'Fonts — Sophie Bird',
    fabric: 'bleached',
    fontSpecimen: true, // main.js loads every font when this page opens
    html: `
      <article class="page">
        <h1>Fonts</h1>
        <p>Each sample below is set in a different font. Use the buttons to try one on the whole site, then pick your favourite in config.js.</p>
        ${fontSamples}
      </article>`,
  },

  '/sewing/mending': {
    section: 'sewing',
    title: 'Mending — Sophie Bird',
    fabric: 'sage',
    html: `
      <article class="page">
        ${mending('intro')}
        ${mending('video')}
        <div class="collage">
          ${photo('mending/IMG_1946.jpg', 'A mended seam on blue jeans', { at: '1 / 13, 1 / 5' })}
        </div>
        <section class="page-section">
          ${mending('more')}
          <div class="collage">
            ${photo('mending/IMG_1956.jpg', 'A grey sock darned at the toe in purple thread', { at: '1 / 5, 1 / 8' })}
            ${photo('mending/IMG_1405.jpg', 'Friends darning socks together on a sofa in a wood-panelled cabin', { at: '5 / 9, 1 / 8' })}
            ${photo('mending/IMG_1955.jpg', 'A woven darn on grey linen, close up', { at: '9 / 13, 1 / 5' })}
            ${photo('mending/IMG_1953.jpg', 'A square darn on linen in grey thread', { at: '9 / 13, 5 / 10' })}
            ${photo('mending/IMG_8897.jpg', 'Plaid trousers with a dark patch sewn over the knee', { at: '1 / 5, 8 / 16' })}
            ${photo('mending/IMG_1951.jpg', 'The canvas tote bag: its cup logo covered with embroidered waves, and an SB monogram', { at: '5 / 9, 9 / 16' })}
            ${photo('mending/IMG_1962.jpg', 'The back of the tote: a patch stamped with a red sheep, and a printed fish', { at: '9 / 13, 10 / 17' })}
          </div>
        </section>
      </article>`,
  },
};
