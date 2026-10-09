# Design direction

Create a quiet, text-first page that feels like a simple, carefully maintained archive. Keep the interface mostly white, with restrained teal links and minimal decoration. The layout should resemble the reference screenshot's organization and proportions without copying its content.

## Page frame

- Use a very light, nearly white page background.
- Add a thin, pale-gray horizontal rule near the top edge, spanning almost the full viewport width with modest side margins.
- Center the main content in a wide, single-column panel. At a desktop viewport around 2,000 px wide, the panel is roughly 1,430 px wide; let it become fluid on smaller screens while preserving comfortable side gutters.
- Give the panel a white fill, a 1–2 px muted gray outline, and softly rounded corners (about 16 px). Avoid shadows and strong card styling.
- Leave a generous gap between the top rule/navigation and the panel. Keep the panel tall enough for long-form lists to continue naturally below the fold.

## Navigation

- Place a short row of three text links above the panel, aligned with its left edge.
- Use uppercase teal labels, medium weight, and generous horizontal spacing. Keep the links unboxed: no filled buttons, pills, or underlines at rest.
- On narrow screens, allow the links to wrap or scroll without clipping.

## Typography

- Use a clean sans-serif system font throughout, such as Arial, Helvetica, or a platform UI sans-serif.
- Render section headings in near-black, regular weight, around 30–34 px on desktop. Use clear size steps for nested headings (about 26 px for the next level).
- Use readable body text around 20–21 px on desktop, with a line height near 1.4. Scale down smoothly on smaller screens.
- Bold only short lead-ins such as dates; keep the rest of each list item regular weight.
- Render search syntax and other inline examples in a monospace face, with a soft pale-pink background and muted rose-red text.

## Color

- Main background and panel: white or near-white.
- Body text and headings: near-black (`#202124`).
- Borders and list markers: light neutral gray (`#b8bec0`).
- Navigation and ordinary links: subdued teal (`#287f88` or a similar low-saturation teal).
- Inline query examples: rose-red text (`#d94b68`) on a very pale pink background.
- Keep contrast readable and reserve accent colors for links and inline examples.

## Content hierarchy and spacing

- Give the panel generous inner padding, roughly 22 px on desktop; increase it as needed on wide screens and reduce it on mobile.
- Separate major content sections with substantial vertical space (roughly 48–60 px). Keep a smaller but clear gap between each heading and its list.
- Use standard round bullets. Indent nested bullets visibly beneath their parent items, and use smaller hollow-circle markers for the second level.
- Keep list rows compact enough to scan, with consistent vertical rhythm. Let long lines wrap naturally without introducing columns.
- Preserve the screenshot's hierarchy: major sections, subordinate headings, primary lists, and occasional nested details.

## Responsive behavior

- Keep the single-column reading flow at every viewport width.
- On small screens, reduce outer margins, panel padding, heading sizes, and body text while keeping them comfortable to read.
- Allow long list text to wrap; prevent horizontal overflow from inline examples and navigation links.

