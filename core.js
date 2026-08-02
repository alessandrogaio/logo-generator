export const INITIAL_LINES = ["YOUNG", "EUROPEAN", "FEDERALIST", ""];

export const VARIANTS = {
  official: {
    label: "Official green",
    colours: { mark: "#00CC66", cutout: "#FFFFFF", line1: "#00CC66", line2: "#00CC66", line3: "#00CC66", line4: "#717171" }
  },
  white: {
    label: "White on dark",
    colours: { mark: "#FFFFFF", cutout: "#000000", line1: "#FFFFFF", line2: "#FFFFFF", line3: "#FFFFFF", line4: "#B8B8B8" }
  },
  black: {
    label: "Black",
    colours: { mark: "#000000", cutout: "#FFFFFF", line1: "#000000", line2: "#000000", line3: "#000000", line4: "#717171" }
  },
  grey: {
    label: "Neutral grey",
    colours: { mark: "#717171", cutout: "#FFFFFF", line1: "#717171", line2: "#717171", line3: "#717171", line4: "#717171" }
  }
};

export const LOGO_STYLES = {
  normal: { label: "Normal", fontWeight: 400, textOnly: false },
  bold: { label: "Bold", fontWeight: 800, textOnly: false },
  text: { label: "Text only", fontWeight: 400, textOnly: true }
};

export function normaliseLines(lines) {
  return INITIAL_LINES.map((fallback, index) => String(lines[index] ?? fallback).trim().toLocaleUpperCase());
}

export function safeFilename(lines) {
  const section = normaliseLines(lines)[3]
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `jef-logo-${section || "custom"}`;
}

export function escapeXml(value) {
  return String(value).replace(/[<>&"']/g, character => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;"
  })[character]);
}

export function normalisePadding(padding = {}) {
  const clamp = value => Math.min(120, Math.max(0, Number(value) || 0));
  return {
    top: clamp(padding.top),
    right: clamp(padding.right),
    bottom: clamp(padding.bottom),
    left: clamp(padding.left)
  };
}

export function textLayout(hasFourthLine, fontWeight) {
  const lineCount = hasFourthLine ? 4 : 3;
  const verticalPadding = 12;
  const availableHeight = 269 - verticalPadding * 2;
  const capHeightRatio = fontWeight === 800 ? 0.705 : 0.697;
  const gapToCapRatio = 0.4;
  const capHeight = availableHeight / (lineCount + gapToCapRatio * (lineCount - 1));
  const fontSize = capHeight / capHeightRatio;
  const lineStep = capHeight * (1 + gapToCapRatio);
  return {
    fontSize,
    baselines: Array.from({ length: lineCount }, (_, index) => verticalPadding + capHeight + lineStep * index)
  };
}

export function renderLogoSvg(lines, variantKey = "official", styleKey = "normal", background = "transparent", padding = {}, embeddedFonts = {}) {
  const normalisedValues = normaliseLines(lines);
  const values = normalisedValues.map(escapeXml);
  const variant = VARIANTS[variantKey] || VARIANTS.official;
  const logoStyle = LOGO_STYLES[styleKey] || LOGO_STYLES.normal;
  const layout = textLayout(Boolean(normalisedValues[3]), logoStyle.fontWeight);
  const c = variant.colours;
  const margin = normalisePadding(padding);
  const content = logoStyle.textOnly ? { x: 302, width: 674 } : { x: 0, width: 976 };
  const dimensions = {
    width: content.width + margin.left + margin.right,
    height: 269 + margin.top + margin.bottom,
    viewBox: `${content.x - margin.left} ${-margin.top} ${content.width + margin.left + margin.right} ${269 + margin.top + margin.bottom}`
  };
  const mark = logoStyle.textOnly ? "" : `
  <circle cx="134.649" cy="134.649" r="134.649" fill="${c.mark}"/>
  <path d="M67.324 101.841h145.275V68.179H67.324Z" fill="${c.cutout}"/>
  <path d="M33.662 151.507h145.275v-33.661H33.662Z" fill="${c.cutout}"/>
  <path d="M67.324 201.115h145.275v-33.662H67.324Z" fill="${c.cutout}"/>`;
  const backgroundColour = background === "dark" ? "#151917" : background === "light" ? "#FFFFFF" : null;
  const backgroundRect = backgroundColour
    ? `<rect x="${content.x - margin.left}" y="${-margin.top}" width="${dimensions.width}" height="${dimensions.height}" fill="${backgroundColour}"/>`
    : "";
  const fonts = typeof embeddedFonts === "string" ? { extraBold: embeddedFonts } : embeddedFonts;
  const fontRules = [
    fonts.regular && `@font-face{font-family:'JEF Poppins';src:url('${fonts.regular}') format('truetype');font-style:normal;font-weight:400}`,
    fonts.extraBold && `@font-face{font-family:'JEF Poppins';src:url('${fonts.extraBold}') format('truetype');font-style:normal;font-weight:800}`
  ].filter(Boolean).join("");
  const fontFace = fontRules ? `<style>${fontRules}</style>` : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${dimensions.width}" height="${dimensions.height}" viewBox="${dimensions.viewBox}" role="img" aria-label="JEF ${values[3]} logo">
  <title>JEF ${values[3]} logo</title>
  ${fontFace}
  ${backgroundRect}
  ${mark}
  <g font-family="'JEF Poppins', Poppins, Arial, sans-serif" font-size="${layout.fontSize.toFixed(3)}" font-weight="${logoStyle.fontWeight}">
    <text x="302.289" y="${layout.baselines[0].toFixed(3)}" fill="${c.line1}">${values[0]}</text>
    <text x="302.289" y="${layout.baselines[1].toFixed(3)}" fill="${c.line2}">${values[1]}</text>
    <text x="302.289" y="${layout.baselines[2].toFixed(3)}" fill="${c.line3}">${values[2]}</text>
    ${normalisedValues[3] ? `<text x="302.289" y="${layout.baselines[3].toFixed(3)}" fill="${c.line4}">${values[3]}</text>` : ""}
  </g>
</svg>`;
}
