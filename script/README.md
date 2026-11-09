# Script

The writing for every page. Edit these files and the site updates (the dev server reloads on save).

Each file is one page. Its path matches the page's address:

| File | Page |
|---|---|
| `landing.md` | `/` (the page you land on, and where the name links) |
| `sewing.md` | `/sewing` |
| `sewing/1780s-ensemble.md` | `/sewing/1780s-ensemble` |
| `sewing/larp.md` | `/sewing/larp` |
| `sewing/historical.md` | `/sewing/historical` |
| `sewing/modern.md` | `/sewing/modern` |
| `sewing/mending.md` | `/sewing/mending` |
| `projects.md` | `/projects` |
| `resume.md` | `/resume` |

## Slots

A page has one or more **slots**: places in its layout where writing goes, between the photos. A slot starts with a line like this and runs until the next one:

```
<!-- slot: intro -->
```

Keep the slot lines exactly as they are (they're how the site knows where each piece of writing goes). Everything between them is ordinary Markdown:

- `# Heading` for the page title, `## Heading` and `### Heading` for smaller ones
- a blank line between paragraphs
- `**bold**`, `*italic*`, `[link text](/sewing)` (links starting with `/` stay inside the site; other links, like a YouTube video, open in a new tab)
- `- item` for bullet lists

Anything inside `<!-- ... -->` is a note to yourself and never shows on the page. A slot left empty shows nothing.

Photos and their layout are not here: they're in `src/pages.js`. Page titles (the browser tab) are there too.
