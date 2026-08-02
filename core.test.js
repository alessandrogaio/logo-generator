import assert from "node:assert/strict";
import test from "node:test";
import { INITIAL_LINES, LOGO_STYLES, VARIANTS, escapeXml, normaliseLines, normalisePadding, renderLogoSvg, safeFilename, textLayout } from "./core.js";

test("normalises four lines and forces uppercase", () => {
  assert.deepEqual(normaliseLines(["young", "european", "federalists", "Roma"]), ["YOUNG", "EUROPEAN", "FEDERALISTS", "ROMA"]);
});

test("starts with the three-line English reference wording", () => {
  assert.deepEqual(INITIAL_LINES, ["YOUNG", "EUROPEAN", "FEDERALIST", ""]);
});

test("fits three or four text lines to the full logo height", () => {
  const three = textLayout(false, 800);
  const four = textLayout(true, 800);
  const capRatio = 0.705;
  assert.ok(three.fontSize > four.fontSize);
  assert.ok(three.baselines[1] - three.baselines[0] > three.fontSize * capRatio);
  assert.ok(Math.abs(three.baselines[0] - three.fontSize * capRatio - 12) < 1e-9);
  assert.ok(Math.abs(four.baselines[0] - four.fontSize * capRatio - 12) < 1e-9);
  assert.ok(Math.abs(three.baselines[2] - 257) < 1e-9);
  assert.ok(Math.abs(four.baselines[3] - 257) < 1e-9);
});

test("escapes user-controlled SVG content", () => {
  const svg = renderLogoSvg(["<script>", "A&B", 'a"b', "Rome"], "official");
  assert.ok(!svg.includes("<script>"));
  assert.ok(svg.includes("&lt;SCRIPT&gt;"));
  assert.equal(escapeXml("A&B"), "A&amp;B");
});

test("renders every colour variant", () => {
  for (const [key, variant] of Object.entries(VARIANTS)) {
    const svg = renderLogoSvg([], key);
    assert.ok(svg.includes(variant.colours.mark));
    assert.ok(svg.startsWith("<svg"));
  }
});

test("renders normal, bold and text-only styles", () => {
  assert.match(renderLogoSvg([], "official", "normal"), /font-weight="400"/);
  assert.match(renderLogoSvg([], "official", "bold"), /font-weight="800"/);
  const textOnly = renderLogoSvg([], "official", "text");
  assert.ok(!textOnly.includes("<circle"));
  assert.match(textOnly, /viewBox="302 0 674 269"/);
  assert.deepEqual(Object.keys(LOGO_STYLES), ["normal", "bold", "text"]);
});

test("adds a smaller grey fourth line only when it has content", () => {
  const threeLines = renderLogoSvg(INITIAL_LINES, "official", "bold");
  const fourLines = renderLogoSvg(["YOUNG", "EUROPEAN", "FEDERALIST", "HESSEN"], "official", "bold");
  assert.equal((threeLines.match(/<text /g) || []).length, 3);
  assert.equal((fourLines.match(/<text /g) || []).length, 4);
  assert.match(fourLines, /fill="#717171">HESSEN<\/text>/);
  assert.match(threeLines, /font-size="[0-9.]+"/);
  assert.notEqual(threeLines.match(/font-size="([0-9.]+)"/)[1], fourLines.match(/font-size="([0-9.]+)"/)[1]);
});

test("can embed the Poppins font in standalone SVG output", () => {
  const svg = renderLogoSvg([], "official", "normal", "transparent", {}, {
    regular: "data:font/ttf;base64,cmVndWxhcg==",
    extraBold: "data:font/ttf;base64,ZXh0cmFib2xk"
  });
  assert.match(svg, /font-family:'JEF Poppins'/);
  assert.match(svg, /font-weight:400/);
  assert.match(svg, /font-weight:800/);
});

test("embeds only explicitly selected backgrounds", () => {
  assert.ok(!renderLogoSvg([], "official", "normal", "transparent").includes("<rect"));
  assert.match(renderLogoSvg([], "official", "normal", "light"), /<rect[^>]+fill="#FFFFFF"/);
  assert.match(renderLogoSvg([], "official", "text", "dark"), /x="302"[^>]+fill="#151917"/);
});

test("applies independent margins to dimensions and viewBox", () => {
  const svg = renderLogoSvg([], "official", "normal", "light", { top: 10, right: 20, bottom: 30, left: 40 });
  assert.match(svg, /width="1036" height="309" viewBox="-40 -10 1036 309"/);
  assert.match(svg, /<rect x="-40" y="-10" width="1036" height="309"/);
  assert.deepEqual(normalisePadding({ top: -5, right: 999, bottom: "12", left: null }), { top: 0, right: 120, bottom: 12, left: 0 });
});

test("creates a stable safe filename", () => {
  assert.equal(safeFilename(["", "", "", "Lombardía / Nord"]), "jef-logo-lombardia-nord");
});
