# Personal site

Sophie Bird's sewing archive. The page is drawn as fabric: two linen pieces joined by a hand-stitched seam that fold, tug and unfold as you navigate. It's built with Vite, Three.js (custom GLSL shaders) and GSAP.

For now it only holds sewing content, and much of that is out of date as I don't have many recent photos. The content first lived on an older site made with a website builder, then on a plain HTML/CSS version, which this fabric version replaces.

It was vibecoded from a set of markdown files holding the design and content instructions (`CLAUDE.md` and `docs/`). The AI conversations behind it are recorded in `LLM Bibliography/`.

## Running it

```sh
npm install
npm run dev      # local dev server
npm run build    # static build in dist/
```

Light mode is the default. The debug panel (lil-gui) can switch theme, palette, fonts and every fold setting.

## Layout

| Path | Contents |
|---|---|
| `index.html`, `src/` | the site: shaders, fold geometry, animations, pages |
| `public/` | resized photos, plaid textures, name graphic |
| `docs/` | content and design briefs, layout sketch, old-site screenshot |
| `originals/` | full-size source photos |
| `LLM Bibliography/` | records of the AI-assisted sessions |
