# CountCard web fonts

Place licensed **Colossalis** files here for heading typography:

- `Colossalis.woff2` (preferred)
- `Colossalis.woff` (fallback)

`apps/web/app/globals.css` registers `@font-face` for these paths. Until files are present, headings fall back to Georgia (see `@countcard/ui` `fontFamilies.heading`).

Body text uses the system Arial / sans-serif stack defined in `fontFamilies.body`.
