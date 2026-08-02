import { INITIAL_LINES, LOGO_STYLES, VARIANTS, renderLogoSvg, safeFilename } from "./core.js";

const preview = document.querySelector("#preview");
const fields = document.querySelector("#line-fields");
const tabs = document.querySelector("#variant-tabs");
const styleTabs = document.querySelector("#style-tabs");
const paddingTabs = document.querySelector("#padding-tabs");
const paddingRange = document.querySelector("#padding-range");
const paddingValue = document.querySelector("#padding-value");
const paddingReset = document.querySelector("#padding-reset");
const variantName = document.querySelector("#variant-name");
const background = document.querySelector("#preview-background");
const svgButton = document.querySelector("#download-svg");
const pngButton = document.querySelector("#download-png");
const jpgButton = document.querySelector("#download-jpg");
const status = document.querySelector("#status");
let activeVariant = "official";
let activeStyle = "normal";
let activePaddingSide = "all";
const padding = { top: 0, right: 0, bottom: 0, left: 0 };
function fontDataUrl(path) {
  return fetch(path).then(response => {
    if (!response.ok) throw new Error("The logo font could not be loaded.");
    return response.blob();
  })
  .then(blob => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("The logo font could not be embedded."));
    reader.readAsDataURL(blob);
  }));
}

const embeddedFonts = Promise.all([
  fontDataUrl("./assets/fonts/Poppins-Regular.ttf"),
  fontDataUrl("./assets/fonts/Poppins-ExtraBold.ttf")
]).then(([regular, extraBold]) => ({ regular, extraBold }));

function currentLines() {
  return [...fields.querySelectorAll("input")].map(input => input.value);
}

function updatePreview() {
  preview.innerHTML = renderLogoSvg(currentLines(), activeVariant, activeStyle, "transparent", padding);
  variantName.textContent = VARIANTS[activeVariant].label;
}

INITIAL_LINES.forEach((value, index) => {
  const wrapper = document.createElement("div");
  wrapper.className = "line-field";
  const placeholder = index === 3 ? "Type optional text" : "";
  wrapper.innerHTML = `<label for="line-${index + 1}">Line ${index + 1}</label><input id="line-${index + 1}" name="line-${index + 1}" value="${value}" placeholder="${placeholder}" maxlength="24" autocomplete="off">`;
  wrapper.querySelector("input").addEventListener("input", event => {
    const start = event.target.selectionStart;
    event.target.value = event.target.value.toLocaleUpperCase();
    event.target.setSelectionRange(start, start);
    updatePreview();
  });
  fields.append(wrapper);
});

Object.entries(VARIANTS).forEach(([key, variant]) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "variant-tab";
  button.textContent = variant.label;
  button.setAttribute("aria-pressed", String(key === activeVariant));
  button.addEventListener("click", () => {
    activeVariant = key;
    tabs.querySelectorAll("button").forEach(tab => tab.setAttribute("aria-pressed", String(tab === button)));
    if (key === "white" && background.value === "light") {
      background.value = "dark";
      updateBackground();
    }
    updatePreview();
  });
  tabs.append(button);
});

Object.entries(LOGO_STYLES).forEach(([key, logoStyle]) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "style-tab";
  button.textContent = logoStyle.label;
  button.setAttribute("aria-pressed", String(key === activeStyle));
  button.addEventListener("click", () => {
    activeStyle = key;
    styleTabs.querySelectorAll("button").forEach(tab => tab.setAttribute("aria-pressed", String(tab === button)));
    updatePreview();
  });
  styleTabs.append(button);
});

["all", "top", "right", "bottom", "left"].forEach(side => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "padding-tab";
  button.textContent = side[0].toUpperCase() + side.slice(1);
  button.setAttribute("aria-pressed", String(side === activePaddingSide));
  button.addEventListener("click", () => {
    activePaddingSide = side;
    paddingTabs.querySelectorAll("button").forEach(tab => tab.setAttribute("aria-pressed", String(tab === button)));
    const value = side === "all" ? Math.round((padding.top + padding.right + padding.bottom + padding.left) / 4) : padding[side];
    paddingRange.value = value;
    paddingValue.value = `${value} px`;
  });
  paddingTabs.append(button);
});

paddingRange.addEventListener("input", () => {
  const value = Number(paddingRange.value);
  if (activePaddingSide === "all") {
    Object.keys(padding).forEach(side => { padding[side] = value; });
  } else {
    padding[activePaddingSide] = value;
  }
  paddingValue.value = `${value} px`;
  updatePreview();
});

paddingReset.addEventListener("click", () => {
  if (activePaddingSide === "all") {
    Object.keys(padding).forEach(side => { padding[side] = 0; });
  } else {
    padding[activePaddingSide] = 0;
  }
  paddingRange.value = 0;
  paddingValue.value = "0 px";
  updatePreview();
});

function updateBackground() {
  preview.className = `preview ${background.value}`;
}

background.addEventListener("change", updateBackground);

function download(blob, filename) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function svgBlob(lines, variant, logoStyle, canvas = "transparent") {
  const fontData = await embeddedFonts;
  return new Blob([renderLogoSvg(lines, variant, logoStyle, canvas, padding, fontData)], { type: "image/svg+xml;charset=utf-8" });
}

async function svgToRaster(svg, scale, type) {
  const image = new Image();
  const url = URL.createObjectURL(svg);
  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("The browser could not render the SVG."));
      image.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth * scale;
    canvas.height = image.naturalHeight * scale;
    const context = canvas.getContext("2d");
    if (type === "image/jpeg" && background.value === "transparent") {
      context.fillStyle = "#FFFFFF";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Image export failed.")), type, 0.92));
  } finally {
    URL.revokeObjectURL(url);
  }
}

svgButton.addEventListener("click", async () => {
  const lines = currentLines();
  svgButton.disabled = true;
  status.textContent = "Preparing SVG…";
  try {
    download(await svgBlob(lines, activeVariant, activeStyle, background.value), `${safeFilename(lines)}-${activeStyle}-${activeVariant}.svg`);
    status.textContent = "SVG downloaded.";
  } catch (error) {
    console.error(error);
    status.textContent = `Could not create the SVG: ${error.message}`;
  } finally {
    svgButton.disabled = false;
  }
});

async function downloadRaster(type) {
  const extension = type === "image/png" ? "png" : "jpg";
  const lines = currentLines();
  const button = type === "image/png" ? pngButton : jpgButton;
  button.disabled = true;
  status.textContent = `Rendering ${extension.toUpperCase()}…`;
  try {
    const svg = await svgBlob(lines, activeVariant, activeStyle, background.value);
    const raster = await svgToRaster(svg, 1, type);
    download(raster, `${safeFilename(lines)}-${activeStyle}-${activeVariant}.${extension}`);
    const transparencyNote = type === "image/jpeg" && background.value === "transparent" ? " Transparent canvas was flattened to white." : "";
    status.textContent = `${extension.toUpperCase()} downloaded.${transparencyNote}`;
  } catch (error) {
    console.error(error);
    status.textContent = `Could not create the image: ${error.message}`;
  } finally {
    button.disabled = false;
  }
}

pngButton.addEventListener("click", () => downloadRaster("image/png"));
jpgButton.addEventListener("click", () => downloadRaster("image/jpeg"));

updateBackground();
updatePreview();
