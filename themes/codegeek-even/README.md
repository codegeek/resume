# jsonresume-theme-codegeek-even

Wrapper around the upstream `jsonresume-theme-even` (not forked) that keeps its look (photo masthead, two-column sections, timeline, skill tags) but tightens the **print/PDF** layout. The on-screen HTML keeps Even's original spacing.

- Smaller masthead, photo and type scale; Letter page with 0.45in/0.5in margins.
- Company, dates and location on one line per role.
- Skills in three columns with compact tags.
- Job titles are never left alone at the bottom of a page.
- Spanish section labels, month names and "Actualidad" when `meta.language` is `es`.

## Options

`meta.themeOptions.condenseBefore: "YYYY"` renders roles that ended before that year as title, company, dates and location only.
