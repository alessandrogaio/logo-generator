# JEF Logo Generator

A dependency-free, browser-based generator for customised JEF logos. It keeps the geometry and four-line structure of the original JEF template while replacing the legacy PHP pipeline with modern JavaScript.

## Run locally

```bash
npm run dev
```

Then open <http://127.0.0.1:4173>.

## Test

```bash
npm test
```

No installation step is required. The application has no runtime or development dependencies.

## Output

The editor downloads the exact selected logo as SVG, PNG or JPG. Margins can be adjusted together or independently for each side. SVG and PNG preserve a transparent canvas; because JPG has no transparency support, transparent JPG exports are flattened onto white.

All processing happens locally in the browser.

## Font

The logo uses locally bundled Poppins Regular and Poppins ExtraBold. ExtraBold was identified by matching its glyph outlines exactly with the reference logo. Both weights are embedded directly into downloaded SVG files so SVG, PNG and JPG exports render consistently on other systems. Poppins is distributed under the SIL Open Font License; its licence is included in `assets/fonts/OFL.txt`.
