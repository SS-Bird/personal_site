# LLMBiblio

A record of the AI-assisted conversation that merged the fabric experiment into the Personal Site.

- **Date:** 24 October 2026
- **Model:** Claude Opus 5.5 (`claude-opus-5-5`), via Claude Code in VS Code
- **Prompts:** quoted in full, exactly as typed (typos included).
- **Responses:** summarised, not transcribed.

## State of the project

**Before the conversation:** two sites lived side by side in `Personal Site`:
- The old plain HTML/CSS sewing archive at the top level, with `DESIGN.md`, `CONTENT.md`, `AI_DIRECTORY.md`, `OLDWEB/` and `assets/`.
- The Vite + Three.js fabric site in the `fabric experiement` subfolder, untracked by git. It had already been ported from the old site's content, and dark mode was its default.

**After the conversation:** the fabric site is the only site, at the top of the repo, and light mode is the default.

| Path | Contents |
|---|---|
| `index.html`, `src/`, `public/` | the fabric site (moved up from `fabric experiement/`) |
| `docs/` | `CONTENT.md`, a rewritten `DESIGN.md`, the layout sketch, the old-site screenshot |
| `originals/` | full-size sewing photos (was `assets/sewing_photos`) |
| `CLAUDE.md`, `README.md` | the fabric brief plus a directory section; a merged overview |

Removed: the old HTML pages and `styles.css`, `AI_DIRECTORY.md` (merged into `CLAUDE.md`), and byte-identical duplicates of `name_written.svg` and the grey plaid texture.

---

## Conversation

### 1
> combine/delete redundancies from the fabric experiment and the Personal site. The fabric website will replace the old one. reorganise as appropriate. set teh default appearance to light mode. Commit the changes. Add a short entry to the LLM Bibliography folder following the format of the other entry

**Response:**
- **Replace:** moved the fabric site to the repo root and deleted the old static pages and stylesheet.
- **Duplicates:** removed exact copies of the name graphic and plaid scan. Moved an untracked saved-webpage folder (`Adobe Firefly_files`) to the Trash.
- **Reorganise:** briefs and reference images went to `docs/`, and full-size photos to `originals/`.
- **Docs:** merged `AI_DIRECTORY.md` into `CLAUDE.md` and rewrote the README. `DESIGN.md` now describes the fabric site and drops the old teal links and white panel.
- **Light mode:** set `theme: 'light'` in `src/config.js`.
- **Checked** that the site still builds, wrote this entry, and committed.
