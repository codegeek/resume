# jsonresume-theme-codegeek-ats

Local JSON Resume theme tuned for automated resume parsers (ATS) and a compact print.

- Single column; DOM order matches reading order. No grid, tables, icons, images or page header/footer text.
- Standard section titles: Summary, Skills, Experience, Education (Spanish labels when `meta.language` is `es`).
- One heading line per role: `Title | Company | Location | Mon YYYY - Mon YYYY`.
- Dates are formatted from the literal `YYYY-MM[-DD]` string parts, so no timezone shift.
- Bullets are literal `•` characters; ligatures and letter-spacing are disabled so PDF text extraction keeps words intact.
- Arial/Helvetica, 10.5pt body, US Letter with 0.55in/0.6in margins.

## Options (`meta.atsTheme`, all optional)

| key | default | effect |
| --- | --- | --- |
| `language` | `meta.language` or `en` | `en` or `es` section labels and month names |
| `condenseBefore` | none | roles that ended before this year render as a one-line entry under "Earlier Experience" |
| `hideSkillLevel` | `true` | omit `skills[].level` |
| `showCompanyUrl` | `false` | link company names to `work[].url` |

## Usage

```sh
npx resumed render resume.json -t jsonresume-theme-codegeek-ats -o out/resume-ats.html
node scripts/render-pdf.mjs out/resume-ats.html out/resume-ats.pdf
```
