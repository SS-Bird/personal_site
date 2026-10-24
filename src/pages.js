// ---------------------------------------------------------------------------
// pages.js: the site's pages, ported from the old static site (text from docs/CONTENT.md).
// Each page is plain HTML placed on top of the fabric, plus the name of the
// linen it's printed on (one of config.fabrics).
// Photos live in public/photos (resized copies of originals/sewing_photos).
// ---------------------------------------------------------------------------

import { FONTS } from './fonts.js';

const photo = (file, alt, lazy = true) =>
  `<figure><img src="/photos/${file}.jpg" alt="${alt}"${lazy ? ' loading="lazy"' : ''} /></figure>`;

const footer = `
  <footer class="page-footer">
    <span>Sophie Bird</span>
    <a href="mailto:sophiebird825@gmail.com">sophiebird825@gmail.com</a>
  </footer>`;

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

export const pages = {
  '/': {
    title: 'Sophie Bird — Sewing',
    fabric: 'natural',
    html: `
      <article class="page">
        <h1>I am Sophie. Sometimes I sew things. Often historical things.</h1>
        <div class="home-gallery" aria-label="A selection of Sophie’s sewing projects">
          ${photo('IMG_0411', 'Sophie wearing a green stays and grey skirt in a historic kitchen', false)}
          ${photo('IMG_0083', 'A red historical bodice seen from behind', false)}
          ${photo('IMG_0202', 'A long blue skirt worn in the snow')}
          ${photo('IMG_0362', 'A colourful handmade top')}
          ${photo('IMG_0293', 'A printed pocket worn over a grey skirt')}
          ${photo('IMG_0405', 'A gathered linen historical shirt')}
          ${photo('IMG_0346', 'A handmade sleeveless top')}
          ${photo('IMG_0112', 'Close-up of historical stays and hand stitching')}
        </div>
        ${footer}
      </article>`,
  },

  '/1780s-ensemble': {
    title: '1780s Ensemble — Sophie Bird',
    fabric: 'oatmeal',
    html: `
      <article class="page">
        <h1>1780s Ensemble</h1>
        <p>This ensemble was made for my grade 11 personal project, but entirely self directed. The outfit would be appropriate for a working class woman from the 1780s. The stays are an adjusted version of the Redthreaded 1780s front lacing stays and are made with a cotton lining, two layers of mystery ‘linen’, plastic boning, leather binding and stiffened with gum tragacanthin. The rest of the ensemble was not made from a commercial patterned and made with linen.</p>
        <ul class="photo-list ensemble-photos">
          <li>${photo('IMG_0413', 'Close-up of green striped stays and linen shirt', false)}</li>
          <li>${photo('IMG_0406', 'Back view of the red wool bodice', false)}</li>
          <li>${photo('IMG_0305', 'Green stays worn with a white shift and grey skirt')}</li>
          <li>${photo('IMG_0136', 'Detail of the white linen shirt and green stays')}</li>
        </ul>
        <div class="getting-dressed">
          <h2>Getting Dressed</h2>
          <div class="dress-scroll" role="region" aria-label="Getting dressed, scroll horizontally through the process" tabindex="0">
            ${photo('IMG_0400', 'First layer: the white linen shift')}
            ${photo('IMG_0389', 'Tying on the green front-lacing stays over the shift')}
            ${photo('IMG_0136', 'The stays laced over the linen shift')}
            ${photo('IMG_0413', 'The stays with the pocket and skirt layers')}
            ${photo('IMG_0305', 'The finished outfit, worn together')}
            ${photo('IMG_0411', 'The completed 1780s-inspired ensemble')}
          </div>
        </div>
        ${footer}
      </article>`,
  },

  '/larp': {
    title: 'Larp! — Sophie Bird',
    fabric: 'sage',
    html: `
      <article class="page">
        <h1>Larp!</h1>
        ${footer}
      </article>`,
  },

  '/historical': {
    title: 'Other Historical Pieces — Sophie Bird',
    fabric: 'bleached',
    html: `
      <article class="page">
        <h1>Other Historical Pieces</h1>
        <ul class="project-list">
          <li>
            <h3>18th century men’s shirt</h3>
            <p>My entirely hand stitched 18th century men’s shirt. This is one of my absolute favorite creations. The classic piece is appropriate to decades (if not centuries) of history on top of being wearable day to day (if you can manage the sleeves).</p>
            <div class="feature-photo">${photo('IMG_0405', 'The gathered back and collar of a white linen historical shirt', false)}</div>
          </li>
          <li>
            <h3>1890s walking skirt</h3>
            <p>My 1890s walking skirt. This simple piece stars the wonderful bell-shaped silhouette of the 1890s and the practical bound hem of the Victorian era. The only hand stitching is the backside of the hem binding and the pockets.</p>
            <ul class="photo-list two-up">
              <li>${photo('IMG_0099', 'A full blue skirt with a white blouse')}</li>
              <li>${photo('IMG_0203', 'The blue skirt worn outdoors in winter')}</li>
            </ul>
          </li>
          <li>
            <h3>My 1910s wrap cape</h3>
            <p>I have a love hate relationship with this work. Given that it’s one of the first things I’ve sewn, and my first historic piece, it is riddled with mistakes. Yet, the over all outcome is pretty close to the goal. It was a good learning project.</p>
            <ul class="photo-list two-up">
              <li>${photo('IMG_0371', 'A handmade brown cape over a white blouse')}</li>
              <li>${photo('IMG_0409', 'Close-up of fabric from the handmade cape')}</li>
            </ul>
          </li>
        </ul>
        ${footer}
      </article>`,
  },

  '/modern': {
    title: 'Modern Pieces — Sophie Bird',
    fabric: 'chambray',
    html: `
      <article class="page">
        <h1>Modern Pieces</h1>
        <p>Some of the things I’ve made are actually useful! Modern clothes I wear everyday.</p>
        <p>The only thing pictured bellow that I didn’t make is the silky tank top. The backless top is a large alteration of a dress. Everything was patterned by heavily adjusting the patterns of my own clothes.</p>
        <p>The corset/stays in this dress began as a separate item (as is pictured in the “Other historical items” section). They were only the 3rd proper thing I sewed and the pattern was drafted through vibes and cardboard with a vaguely 18th century goal. They definitely have issues, but I love them.</p>
        <ul class="photo-list modern-photos">
          <li>${photo('IMG_0362', 'A colourful handmade backless top')}</li>
          <li>${photo('IMG_0346', 'A simple handmade sleeveless top')}</li>
          <li>${photo('IMG_0081', 'A handmade corset styled with modern clothes')}</li>
          <li>${photo('IMG_0130', 'A close view of a corset top and striped outer layer')}</li>
        </ul>
        ${footer}
      </article>`,
  },

  '/fonts': {
    title: 'Fonts — Sophie Bird',
    fabric: 'bleached',
    fontSpecimen: true, // main.js loads every font when this page opens
    html: `
      <article class="page">
        <h1>Fonts</h1>
        <p>Each sample below is set in a different font. Use the buttons to try one on the whole site, then pick your favourite in config.js.</p>
        ${fontSamples}
        ${footer}
      </article>`,
  },

  '/mending': {
    title: 'Mending — Sophie Bird',
    fabric: 'rose',
    html: `
      <article class="page">
        <h1>Mending</h1>
        <p>Creating something new is exciting, but maintaining something you love is better. When a piece it built to last and the owner shows it love, it can last a lifetime. Each stitch of repair or personalising adjustment adds an emotion value you can’t buy at target.</p>
        <p>These fixes don’t take long. They can be hidden or a feature. They are a sign of love.</p>
        <p>But sometimes it’s not about fixing, it’s about customizing. A little tailoring or needed decoration.</p>
        <p>This corporate bag, gifted to me at an event hosted by Capital One Cafe, made me sad in capitalism. Rather than toss it away (or donating it, which will likely leave it in landfill anyways), it’s become a project. The logo has been covered, it’s been monogramed, it’s been fished and the next planned addition is a sheep pocket.</p>
        <ul class="photo-list mend-photos">
          <li>${photo('IMG_0172', 'Careful handwork on a small black fabric detail')}</li>
          <li>${photo('IMG_0112', 'A close view of hand stitching and fabric layers')}</li>
          <li>${photo('IMG_1669', 'Fabric being mended by hand')}</li>
        </ul>
        ${footer}
      </article>`,
  },
};
