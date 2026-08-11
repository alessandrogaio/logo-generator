import { INITIAL_LINES, LOGO_STYLES, renderLogoSvg, safeFilename } from "./core.js";

const preview = document.querySelector("#preview");
const fields = document.querySelector("#line-fields");
const styleTabs = document.querySelector("#style-tabs");
const circleTabs = document.querySelector("#circle-tabs");
const logoColour = document.querySelector("#logo-colour");
const textColour = document.querySelector("#text-colour");
const supplementColour = document.querySelector("#supplement-colour");
const officialPreset = document.querySelector("#official-preset");
const paddingTabs = document.querySelector("#padding-tabs");
const paddingRange = document.querySelector("#padding-range");
const paddingValue = document.querySelector("#padding-value");
const paddingReset = document.querySelector("#padding-reset");
const background = document.querySelector("#preview-background");
const svgButton = document.querySelector("#download-svg");
const pngButton = document.querySelector("#download-png");
const jpgButton = document.querySelector("#download-jpg");
const status = document.querySelector("#status");
let activeStyle = "normal";
let showCircle = true;
let activePaddingSide = "all";
const padding = { top: 0, right: 0, bottom: 0, left: 0 };
const colours = { mark: "#00CC66", line1: "#00CC66", line2: "#00CC66", line3: "#00CC66", line4: "#000000" };
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
  preview.innerHTML = renderLogoSvg(currentLines(), "official", activeStyle, "transparent", padding, {}, showCircle, colours);
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

function setColour(input, keys) {
  const value = input.value.toUpperCase();
  keys.forEach(key => { colours[key] = value; });
  input.parentElement.querySelector("output").value = value;
  updatePresetState();
  updatePreview();
}

function updatePresetState() {
  const isOfficial = colours.mark === "#00CC66" && colours.line1 === "#00CC66";
  officialPreset.setAttribute("aria-pressed", String(isOfficial));
  officialPreset.textContent = isOfficial ? "Colour: Official green" : "Restore official green";
}

logoColour.addEventListener("input", () => setColour(logoColour, ["mark"]));
textColour.addEventListener("input", () => setColour(textColour, ["line1", "line2", "line3"]));
supplementColour.addEventListener("input", () => setColour(supplementColour, ["line4"]));

officialPreset.addEventListener("click", () => {
  logoColour.value = "#00cc66";
  textColour.value = "#00cc66";
  setColour(logoColour, ["mark"]);
  setColour(textColour, ["line1", "line2", "line3"]);
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

circleTabs.querySelectorAll("button").forEach(button => {
  button.addEventListener("click", () => {
    showCircle = button.dataset.circle === "yes";
    circleTabs.querySelectorAll("button").forEach(tab => tab.setAttribute("aria-pressed", String(tab === button)));
    updatePreview();
  });
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

async function svgBlob(lines, logoStyle, canvas = "transparent") {
  const fontData = await embeddedFonts;
  return new Blob([renderLogoSvg(lines, "official", logoStyle, canvas, padding, fontData, showCircle, colours)], { type: "image/svg+xml;charset=utf-8" });
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
    download(await svgBlob(lines, activeStyle, background.value), `${safeFilename(lines)}-${activeStyle}.svg`);
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
    const svg = await svgBlob(lines, activeStyle, background.value);
    const raster = await svgToRaster(svg, 1, type);
    download(raster, `${safeFilename(lines)}-${activeStyle}.${extension}`);
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
