# Design direction

A quiet, text-first archive printed on cloth. The fabric does the decorating: keep the type and layout plain so the linen, folds and stitching carry the look. The fabric behaviour itself is specified in `CLAUDE.md`.

## Page frame

- The page is two linen pieces: a narrow left strip and the main panel, joined by a vertical seam.
- Under the fabric is a tiled plaid scan. The header (name and nav) sits on the plaid and peeks out from under the fabric's folded top edge.
- Page text and photos are printed on the main panel and disappear along a straight horizontal line under the flap when scrolling.

## Navigation

- One row of links in the order given in `CONTENT.md`, after the hand-written name.
- Uppercase, medium weight, generous letter spacing, large and white so they stand out on the plaid.
- No buttons, pills or accent colours. The row scrolls sideways in a loop beneath the fabric edge.

## Typography

- Headings and nav: Karla. Body: Crimson Pro.
- Headings are regular weight, around 30–34 px on desktop, with clear size steps for nested headings (about 26 px).
- Body text around 20–21 px on desktop, line height near 1.4, scaling down smoothly on smaller screens.
- Bold only short lead-ins such as dates.

## Colour

- Two themes. **Light (default):** Lamont "white guard" linens over the grey plaid. **Dark:** "dirty jewel" linens over the ochre plaid.
- Each page has its own linen colour; text colours come from the theme's palette (`src/config.js`).
- Links use the text colour, underlined. There is no separate link or accent colour.
- All stitching is one red thread: `#98200b`.

## Photos

- Photos are "sewn on": a squiggly edge thread with stitches out onto the cloth.
- Arrange photos in loose, offset grids alongside the text, following the old site's layouts (see `old-site-screenshot.png`) rather than uniform galleries.

## Content hierarchy and spacing

- Separate major sections with substantial vertical space (about 48–60 px), with a smaller clear gap between a heading and its content.
- Standard round bullets; nested bullets indented, with smaller hollow-circle markers.

## Responsive behaviour

- Single-column reading flow at every width.
- On small screens, shrink headings, body text and the name graphic, and stack photo grids into one column.
- No horizontal page overflow, except the deliberately scrollable header and photo strips.
