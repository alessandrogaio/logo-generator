# Custom Logo Generator

A dependency-free, browser-based tool for creating custom logos with an adjustable four-line layout. The editor provides a live preview and exports the finished design directly from the browser.

## Run locally

No dependency installation is required after cloning the repository. The project
uses only Node.js to start the included local web server.

### Linux

Make sure Node.js is installed, then run the following command from the project
directory:

```bash
npm run dev
```

### Windows

Open PowerShell and install the latest Node.js LTS release with Windows Package
Manager:

```powershell
winget install OpenJS.NodeJS.LTS
```

When the installation finishes, close and reopen PowerShell so that the `node`
and `npm` commands are available. Move to the project directory and start the
local server:

```powershell
cd "C:\path\to\logo-generator"
npm run dev
```

On either operating system, open <http://127.0.0.1:4173> in your browser after
the server starts.

## Test (optional)

```bash
npm test
```

## Output

The editor downloads the exact selected logo as SVG, PNG or JPG. Margins can be adjusted together or independently for each side. SVG and PNG preserve a transparent canvas; because JPG has no transparency support, transparent JPG exports are flattened onto white. All processing happens locally in the browser.
