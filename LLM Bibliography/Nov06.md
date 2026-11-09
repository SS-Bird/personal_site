# LLMBiblio

A record of the AI-assisted conversation that added the Sewing patches, the Projects, Resume and landing pages, and the `script/` folder for page writing, then reorganised the photos and filled in the Sewing pages.

- **Dates:** 6–9 November 2026
- **Model:** Claude Opus 5.5 (`claude-opus-5-5`), via Claude Code in VS Code
- **Prompts:** quoted in full, exactly as typed (typos included).
- **Responses:** summarised, not transcribed.

## State of the project

**Before the conversation:** the header nav listed every sewing page (Home, 1780s Ensemble, Larp!, Other Historical Pieces, Modern Pieces, Mending). The left fabric strip was empty. New tartan scans had just been added to `public/textures`.

**After the conversation:** the site opens on a landing page. The header lists Sewing, Projects and Resume. The sewing pages are subpages under `/sewing/...`, linked from greyscale tartan patches stitched onto the left strip. All page writing is in Markdown files in `script/`. Photos are sorted into one folder per page and resized for the web, every Sewing page uses the Larp linen, and moving between Sewing pages only swaps the right panel.

| Path | Change |
|---|---|
| `index.html` | new header links; a `#patches` container over the left strip |
| `src/pages.js` | sewing pages moved under `/sewing/`; `sewingPatches` list; landing, Projects and Resume pages; text now comes from `script/` |
| `script/`, `src/script.js` | new: one Markdown file per page, split into slots and turned into HTML with `marked` |
| `src/patches.js` | new: builds the patch links (frayed edge, tilt, which bit of tartan shows) |
| `src/photoStitches.js` | `stitch()` now sews on any element, so patches get the same stitching as photos |
| `src/main.js`, `src/fabric.js` | clip the patches to the strip's visible cloth; highlight the header's section link |
| `src/config.js` | `patches`: textures and their sizes, tilt, nudge, raw edge, fray, gap |
| `src/style.css` | patch styles; vertical labels on narrow screens; header copies fill the gap |
| `src/transition.js` | separate strip tug, so the strip can stay; clicks mid-change re-aim it |
| `public/photos/` | one folder per page, resized copies; originals kept in `originals/sewing_photos/` |
| `docs/CONTENT.md`, `docs/DESIGN.md` | new nav structure; a Patches section |

---

## Conversation

### 1
> I want to add more content to the site, so I want sewing to be only one thing on the header. Then I want 'patches' on the left fabric piece that navigate you to what are currently pages and will be subpages. The patches should be fabric scraps stitched on like the photos, with labels in the fabric scrap in the same font as the header is. I added new fabrics to the textures folder.
>
> add pages for projects and resume in the main header. Leave blank for now.

**Response:**
- **Header:** changed to Sewing · Projects · Resume. The name still links to `/`, which shows the Sewing page. Sewing stays underlined on its subpages.
- **Subpages:** moved to `/sewing/1780s-ensemble`, `/sewing/larp`, `/sewing/historical`, `/sewing/modern` and `/sewing/mending`.
- **Patches:** one scrap of tartan per subpage on the left strip, below its fold. Each has a frayed raw edge (a CSS `clip-path`), a seeded random tilt, a soft shadow, and the photos' red whip-stitching. Labels use the nav font. Like the page text, the patches are clipped to the visible cloth, so they disappear when the strip is pulled off.
- **Projects and Resume:** blank pages with a heading.
- **Checked** in headless Chrome: desktop, phone width, navigating by patch, and mid-transition.

### 2
> add space between the buttons, and greyscale them.
>
> add a landing page that you enter when you open it or when you click on the svg of my name.
>
> Give me a script folder with md pages that will 'fill in' all the slots with writing

**Response:**
- **Patches:** the gap went from 30 to 56 px. The scraps are greyscale through a CSS `saturate()` filter, set by `config.patches.saturation` (0 = grey, 1 = full colour).
- **Landing page:** `/` is now its own page with a short placeholder intro and links to the three sections. The site opens there and the name links there. No header link is highlighted and the strip is bare.
- **Script folder:** added `script/`, with one Markdown file per page (`script/sewing/mending.md` → `/sewing/mending`) and a `README.md` explaining how it works. Lines like `<!-- slot: intro -->` split a file into named slots, and `src/script.js` turns each slot into HTML (with the `marked` library) where `src/pages.js` places it among the photos. The existing text was moved in, so the pages look the same. Page text was removed from `docs/CONTENT.md`, which now points to `script/`.
- **Checked** in headless Chrome: the landing page, a page built from several slots, and clicking the name.

### 3 (8 November)
> I added and rearranged the photos, update the web acccordingly.
> link this video in the mending section: Titled Jean Maintence. https://youtu.be/-e0CSq_eQAQ

**Response:**
- **Photo sizes:** 15 new photos were full-size (up to 3527×5290, 5.5 MB). Copied them to `originals/sewing_photos/` first, then resized the web copies to 1400–1600 px. The 3.4 MB twirl GIF became a 210 KB looping MP4 (the GIF is kept in `originals/`). It doesn't play by itself for visitors who ask for reduced motion.
- **Pages:** each page now uses the photos in its folder. 1780s has a main collage, a Getting Dressed strip in dressing order, and a new Process section with Stays and Jacket strips. Larp has its six photos, Other Historical has the shirt, skirt and cape (the frog closures went with the cape), Modern has its pieces plus Italy dress and Sweater subsections, and Mending has the jeans repair and the darn. The Sewing collage was rebuilt from the new folders.
- **Layout code:** replaced the per-page photo CSS with one `.collage` grid. Each photo's position is now written next to it in `src/pages.js`.
- **Script:** new slots for the new sections (`process`, `stays`, `jacket`, `italy-dress`, `sweater`, Mending's `video`). Links to other sites open in a new tab.
- **Checked** in headless Chrome: all 59 photos and the video load, desktop layouts, and phone width.

### 4 (8 November)
> make the right photo larger in the sweater section, and I changed that section to be called knitting and added the sock photo
> I changed one photo in getting dressed
> add that photo in the landing page, trim it so the bico logo is cut off (the logo will be seen on the other page)
> add this link besides the video link https://docs.google.com/document/d/1TtdOLMQupR-tcvL2h49483VXz0_37RH40FYStT2FrzQ/edit?usp=sharing

**Response:**
- **Knitting:** renamed the Sweater section and its script slot to Knitting. The sweater photo on the right is now twice as wide, and the sock moved here from the main Modern collage.
- **Getting Dressed:** swapped IMG_5750 for IMG_0315, resized to 1600 px.
- **Landing page:** the Bicolline portrait now sits beside the intro. The copy in `landing page/` is cropped across the bottom to remove the logo; the Larp page keeps the full photo.
- **Mending:** added the Google Doc next to the video, labelled from its title ("AH113 Final Asgmt") as "AH113 final assignment".

### 5 (8 November)
> make all the sewing pages the colour of the larp page
> I added some text for the home page, move the home page photo left.
> remove the footer replace it with the Contact section of the landing page.

**Response:**
- **Colour:** every Sewing page (the Sewing page and all five subpages) now uses the Larp linen, `sage`.
- **Landing photo:** moved to the left of the text. It's still after the text in the HTML, so screen readers read the writing first.
- **Footer → Contact:** removed the footer. Every page now ends with the section of `script/landing.md` headed "Contact", found by its heading (`scriptSection` in `src/script.js`). The landing page shows it only once, in its own text. The block is hidden while there's no Contact heading.
- **Note:** the new home-page text hadn't been saved to disk yet, so `landing.md` was left untouched to avoid overwriting it.

### 6 (8 November)
> on the sewing pages, only move the right side of the fabric and allow the user to change the opening page while the page is already changing

**Response:**
- **Strip stays:** the left strip now has its own tug (`config.tug.stripProgress`), fold angle and wobble seed. Between two Sewing pages on the same linen, only the right panel is pulled off and comes back. The strip and its patches stay put, and just the patch underline moves. Going to or from a non-Sewing page still moves both pieces.
- **Re-aiming:** clicking a link during a page change no longer waits for the whole change to finish and then plays another. The cloth carries on from wherever it is, at a steady speed, goes off, and comes back with the latest page. Clicking back to the page that's leaving lets the cloth settle back with no swap. During the very first unfold, a click puts the new page straight onto the arriving sheet.
- **Checked** by sampling the tug values every 100 ms in headless Chrome: Sewing → Sewing, re-aiming on the way out, clicking back, and re-aiming during the return from Projects.

### 7 (8 November)
> only have the contact section on the landing page, not the sewing or projects
> make the large shirt photo smaller and add the new photo to this section then delete this note
> add the new photos

**Response:**
- **Contact:** removed from every page except the landing page, where it's part of the landing text. Removed the code that copied it to other pages.
- **Shirt:** made the collar photo smaller and put the new mirror photo (shirt with white stays) beside it. Deleted the note from `script/sewing/historical.md`. Also moved the new paragraph about Bernadette Banner's guide and the buttonholes from under the page title into the shirt section.
- **New photos:** two of the sage green top (full length, and the back) joined the main Modern collage, and two of the green hat open the Knitting section, matching the order in the text. Resized one 2049 px photo to 1600 px.

### 8 (8 November)
> put re-jeaneration above the photos
> add the new photos
> change the bottom right photo on the sewing landing page

**Response:**
- **Mending:** the Re-Jeaneration section (the `video` slot) now comes before the photos. The three new photos (patched plaid trousers, a woven darn, a darned sock) were added around the jeans and linen darns.
- **Sewing page:** the bottom-right photo is now the patched plaid trousers instead of the linen darn, so Mending is still represented. A new `focus` option for `photo()` keeps the patch in view when the photo is cropped.

### 9 (8 November)
> don't add a photo from mending on the sewing landing page at all, they don't hold up next to the others

**Response:** replaced the patched-trousers photo in the bottom-right of the Sewing collage with the back of the sage green top (`Modern Pieces/IMG_0344.JPG`). No Mending photos are on the Sewing page now.

### 10 (8 November)
> section off the spooky dress with its block of text under the larp stuff

**Response:** gave "A spooky dress" its own script slot (`spooky`) and page section. It now comes after the Bicolline collage, with the two white-corset photos under its text. Those photos had been moved to `Larp/halloween dress/`, so their paths were updated. Checked that every photo on every page loads.

### 11 (8 November)
> add the new mending photos, all photos go under the new section except for the large wide blue photo which can go under re-jeaneration

**Response:** the wide jeans photo now sits directly under Re-Jeaneration. A new `more` slot follows it, then a collage with every other Mending photo: the plaid trousers and the three darns, then the three new ones (both sides of the reworked tote bag, and friends on a sofa). The new section wasn't saved to `mending.md` yet, so the file was left untouched. The slot line is still to be added there.

### 12 (8 November)
> saved

**Response:** added the `<!-- slot: more -->` line above "## Mends" in `mending.md`, and updated the two outdated notes there. The sofa photo turned out to be the sock-darning workshop, so its description changed and it now sits next to the darned sock. The bag photos moved to the bottom, nearer the bag paragraph.

### 13 (9 November)
> update hte LLM bibliography, commit and push

**Response:** added this entry, widened the dates and the before/after summary to cover 6–9 November, then committed everything and pushed to `origin/main`.

### 14 (9 November)
> I just added a bit of text, but that has to be pushed

**Response:** committed and pushed the new writing: an AI Note on the landing page, the shirt paragraphs moved into the Other Historical intro, and a new line on the Assisi Wedding dress. The text was left as written.
