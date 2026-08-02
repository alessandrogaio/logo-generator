# Custom Logo Generator

A dependency-free, browser-based tool for creating custom logos with an adjustable four-line layout. The editor provides a live preview and exports the finished design directly from the browser.

## Run locally

```bash
npm run dev
```

Then open <http://127.0.0.1:4173>.

## Test (optional)

```bash
npm test
```

No installation step is required. The application has no runtime or development dependencies.

## Output

The editor downloads the exact selected logo as SVG, PNG or JPG. Margins can be adjusted together or independently for each side. SVG and PNG preserve a transparent canvas; because JPG has no transparency support, transparent JPG exports are flattened onto white. All processing happens locally in the browser.
