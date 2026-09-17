/*
 * colour.mjs – oklch, sRGB and the WCAG ratio, once.
 *
 * build.js, lint.js and diagram-core.mjs all have to answer the same two
 * questions: what is the relative luminance of this colour, and can a room
 * see one of them on the other. Before this file the chain lived in
 * diagram-core.mjs as four private arrows for the column-contrast warning,
 * and the moment an author-supplied accent needed measuring there would have
 * been a second copy in build.js and a third in lint.js.
 *
 * This is the third module lint.js is allowed to import, for the reason the
 * other two are: zero dependencies, zero Node APIs, pure functions, nothing
 * pulled in behind it. It must not import anything of its own.
 *
 * **diagram-core.mjs keeps its own copy of the chain, and must.** It is not
 * imported by the browser, it is *spliced* into it: diagramCoreScript() in
 * build.js reads that file as text, strips the word `export` off every
 * declaration and wraps the result in an IIFE as window.PSI_DG. An `import`
 * line survives that strip untouched and is a syntax error inside a function
 * body, so the compiler would fail to parse in every built page while every
 * Node-side gate stayed green. That is the same constraint tails.mjs records
 * from the other side ("diagram-core.mjs must not import it"), and it is why
 * the four arrows there look like a duplicate of the four here and are not a
 * mistake. The two are held together by a gate rather than by an import.
 *
 * Colours are oklch triples `[L, C, h]` – lightness 0..1, chroma, hue in
 * degrees – which is how the stylesheet writes them, or a `#rrggbb` string,
 * which is how a corporate manual writes them. Nothing here emits CSS.
 */

// ── the chain: oklch -> oklab -> linear sRGB -> relative luminance ─────
// What color-mix in oklab and the WCAG ratio are both defined over.
// Clamped at the gamut edge the way a display clamps.
export const oklchToLab = ([L, C, h]) => [L, C * Math.cos(h * Math.PI / 180), C * Math.sin(h * Math.PI / 180)];
export const labToLinear = ([L, a, b]) => {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, sv = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * sv,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * sv,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * sv,
  ].map(v => Math.min(1, Math.max(0, v)));
};
export const labLuminance = (lab) => { const [r, g, b] = labToLinear(lab); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
/** Relative luminance of an oklch triple. */
export const luminance = (c) => labLuminance(oklchToLab(c));
/** WCAG contrast ratio between two oklch triples. Order does not matter. */
export function contrast(a, b) {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

// ── hex in, oklch out ─────────────────────────────────────────────────
// A house colour arrives as a hex string and nothing else: that is the one
// notation every corporate manual agrees on. `#abc` is accepted because
// people write it; anything else returns null rather than throwing, so the
// caller decides what a bad value costs - a refusal in build.js, a finding
// in lint.js.
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
export function parseHex(s) {
  if (typeof s !== 'string') return null;
  const t = s.trim();
  if (!HEX.test(t)) return null;
  const h = t.slice(1);
  const pair = h.length === 3 ? [...h].map(c => c + c) : [h.slice(0, 2), h.slice(2, 4), h.slice(4, 6)];
  return pair.map(p => parseInt(p, 16));
}
/** `#EC8A3C` -> `[0.725, 0.149, 55.6]`, or null if it is not a hex colour. */
export function hexToOklch(s) {
  const rgb = parseHex(s);
  if (!rgb) return null;
  const [r, g, b] = rgb.map(v => v / 255).map(c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s2 = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s2;
  const A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s2;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s2;
  return [L, Math.hypot(A, B), ((Math.atan2(B, A) * 180 / Math.PI) % 360 + 360) % 360];
}

// ── the two floors ────────────────────────────────────────────────────
// 4.5 is WCAG AA for body text, and it is the right floor for an accent
// rather than the 3.0 large-text one: the comment beside `light-orange` in
// build.js says why, and it is the reason that theme's accent was darkened
// from 0.58 to 0.54 - "the accent does land in prose, because a bold phrase
// can be set in it".
export const WCAG_TEXT = 4.5;
// WCAG 1.4.11, the non-text floor. Below it a projector, which flattens
// every mid-tone toward the paper, has nothing left to show.
export const WCAG_NON_TEXT = 3;

/**
 * Which of two inks to set on a ground: whichever the room can see better.
 * Returns the winner and both ratios, because the caller has to be able to
 * say why - a build that silently reverses a card's text is worse than one
 * that reverses it and prints one line about it.
 */
export function inkFor(ground, candidates) {
  const scored = candidates.map(c => ({ ...c, ratio: contrast(ground, c.oklch) }));
  scored.sort((a, b) => b.ratio - a.ratio);
  return { pick: scored[0], all: scored };
}

/**
 * The same hue and chroma, lifted or dropped in lightness until it clears
 * `target` against `ground`. This is what build.js's own dark theme did by
 * hand: its accent is "the light-red accent lifted until it carries on a
 * dark ground", oklch(0.42 0.16 30) become oklch(0.76 0.15 35).
 *
 * Bisection rather than an inversion, because luminance is not monotonic in
 * L once the gamut clamp bites - a very saturated hue at L 0.95 can measure
 * darker than the same hue at 0.9. Bisection over a direction that is known
 * in advance (a dark ground wants a lighter accent) is stable where an
 * inversion is not, and 40 steps is far below the precision anyone can see.
 * Returns null when no lightness in that direction reaches the target, which
 * is a real case: a chroma so high that the hue never gets bright enough.
 */
export function lightnessFor(oklch, ground, target, dir = 'up') {
  const [, C, h] = oklch;
  const up = dir === 'up';
  let lo = up ? oklch[0] : 0, hi = up ? 1 : oklch[0];
  if (contrast([up ? hi : lo, C, h], ground) < target) return null;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (contrast([mid, C, h], ground) < target) { if (up) lo = mid; else hi = mid; }
    else { if (up) hi = mid; else lo = mid; }
  }
  return up ? hi : lo;
}

/** An oklch triple as the stylesheet writes one. Three decimals is past what a display resolves. */
export const cssOklch = ([L, C, h]) =>
  `oklch(${+L.toFixed(3)} ${+C.toFixed(3)} ${+h.toFixed(1)})`;
