/*
 * The identity's arithmetic, held against this repository's own measurements.
 *
 * `identity.accent` is the first frontmatter key whose effect is a *number the
 * build computes* rather than a word it looks up: which ink goes on an accent
 * ground, what hue the greys take, whether a dark accent has to be lifted.
 * Nothing about a wrong answer looks wrong - the deck builds, the card is
 * painted, and the text on it is merely hard to read in the third row of a
 * lit room, which is the kind of defect a reader blames on the projector.
 *
 * So the gate does not restate the arithmetic. It asserts that colour.mjs
 * agrees with numbers already written down here by hand, which makes both
 * sides falsifiable:
 *
 *   1. The four ratios in the comment beside `light-orange` in build.js.
 *      They were measured by the author when that accent was darkened from
 *      0.58 to 0.54, they are the reason the key exists, and they are parsed
 *      out of the comment rather than copied - so editing the comment without
 *      the code, or the code without the comment, fails here.
 *   2. colour.mjs and the private chain in diagram-core.mjs give the same
 *      luminance. That duplicate is deliberate (diagram-core is spliced into
 *      the browser as text and cannot carry an import; colour.mjs says so),
 *      which means nothing but a gate can hold the two together.
 *   3. lint.js and build.js name the same document paper. The linter's
 *      `accent-contrast` warning is only as true as the ground it measures
 *      against.
 *   4. The feature is inert for an accent that does not need it: each of the
 *      five tuned accents still takes the paper as its reversed ink, so a
 *      deck whose house colour is dark reaches none of the ground rules.
 *
 * build.js is read as text, the way the `frontmatter` and `xheight` gates
 * read it and for the same reason: it calls main() at module scope.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './harness.mjs';
import { DG_THEMES } from '../../diagram-core.mjs';
import { dgBarContrast } from '../../diagram-core.mjs';
import { contrast, hexToOklch, inkFor, lightnessFor, luminance, WCAG_TEXT } from '../../colour.mjs';

export const name = 'identity: the accent arithmetic, against the numbers already in the tree';

const readText = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

export async function run({ report }) {
  const build = readText('build.js');
  const lint = readText('lint.js');

  // 1 ── the four hand-measured ratios in build.js's own comment.
  // "The other three already clear it: light-red 8.66, light-blue 5.99,
  //  light-teal 4.67." plus light-orange's own 4.96 two lines up.
  const claimed = new Map();
  for (const m of build.matchAll(/light-(red|blue|teal)\s+(\d+\.\d+)/g)) {
    claimed.set('light-' + m[1], Number(m[2]));
  }
  // light-orange's own ratio is written as the end of a sentence about why
  // that accent was darkened - "0.56 clears the line at 4.57 and 0.54 at
  // 4.96" - and the line wraps between the two, so it is read on its own
  // rather than by the pattern the other three share.
  const orange = build.match(/0\.54 at\s+(\d+\.\d+)/);
  if (orange) claimed.set('light-orange', Number(orange[1]));
  report.ok(claimed.size === 4,
    'build.js still states four measured accent ratios in prose', [...claimed].join(' '));
  // A tolerance, and it is not slack: the comment's numbers were taken
  // against the stylesheet's own tinted paper, oklch(0.98 0.007 --accent-h),
  // and DG_THEMES carries the untinted oklch(0.98 0 0) that the linter and
  // the build both read. The gate's business is that the function and the
  // author's measurement describe one colour, not that two papers are one.
  const TOL = 0.05;
  for (const [theme, said] of claimed) {
    const got = contrast(DG_THEMES[theme].emph, DG_THEMES[theme].paper);
    report.ok(Math.abs(got - said) <= TOL,
      `colour.mjs reproduces the measured ${theme} accent ratio (${said})`, got.toFixed(2));
  }

  // 2 ── the deliberate duplicate cannot drift. dgBarContrast is the only
  // caller of diagram-core's private chain, and `tone-4` is `emph` at 100%,
  // so it is that chain measuring the accent against the paper - exactly what
  // colour.mjs is asked for beside it.
  for (const theme of Object.keys(DG_THEMES)) {
    const theirs = dgBarContrast('tone-4', theme);
    const ours = contrast(DG_THEMES[theme].emph, DG_THEMES[theme].paper);
    report.ok(Math.abs(theirs - ours) < 1e-9,
      `colour.mjs and diagram-core.mjs measure ${theme} identically`,
      `${theirs.toFixed(6)} vs ${ours.toFixed(6)}`);
  }

  // 3 ── one document paper, named in two files.
  const buildPaper = build.match(/const PRINT_PAPER_HEX = '(#[0-9a-f]{6})'/i);
  const lintPaper = lint.match(/hexToOklch\('(#[0-9a-f]{6})'\)/i);
  report.ok(!!buildPaper && !!lintPaper && buildPaper[1] === lintPaper[1],
    'build.js and lint.js measure the accent against the same document paper',
    `${buildPaper && buildPaper[1]} vs ${lintPaper && lintPaper[1]}`);

  // 4 ── inert where it should be. Every tuned accent is dark enough that the
  // paper is still the better ink, so a deck whose house colour is dark emits
  // two custom properties and no ground rule at all.
  const inkOf = (accent, theme) => inkFor(accent, [
    { name: 'paper', oklch: DG_THEMES[theme].paper },
    { name: 'ink', oklch: DG_THEMES[theme].ink },
  ]).pick.name;
  for (const theme of Object.keys(DG_THEMES)) {
    report.ok(inkOf(DG_THEMES[theme].emph, theme) === 'paper',
      `${theme}'s own accent still reverses the paper onto it`);
  }
  // And live where it should be: the colour that motivated the feature.
  const house = hexToOklch('#EC8A3C');
  report.ok(inkOf(house, 'light-orange') === 'ink',
    '#EC8A3C takes dark ink on an accent ground, measured rather than assumed',
    contrast(house, DG_THEMES['light-orange'].paper).toFixed(2) + ':1 against the paper');

  // 5 ── the lift is the sentence build.js's dark theme already carries:
  // "the light-red accent lifted until it carries on a dark ground".
  const lifted = lightnessFor(DG_THEMES['light-red'].emph, DG_THEMES.dark.paper, WCAG_TEXT, 'up');
  report.ok(lifted != null && lifted > DG_THEMES['light-red'].emph[0],
    'lightnessFor lifts the light-red accent to carry on the dark ground',
    lifted == null ? 'no lightness reaches it' : lifted.toFixed(3));
  report.ok(contrast(DG_THEMES.dark.emph, DG_THEMES.dark.paper) >= WCAG_TEXT,
    "the dark theme's own hand-lifted accent clears the floor the function targets",
    contrast(DG_THEMES.dark.emph, DG_THEMES.dark.paper).toFixed(2));
  // A colour too light for white paper is exactly what a dark ground wants,
  // which is why the lift usually does not fire at all.
  report.ok(contrast(house, DG_THEMES.dark.paper) >= WCAG_TEXT,
    '#EC8A3C needs no lift on the dark ground',
    contrast(house, DG_THEMES.dark.paper).toFixed(2));

  // 5b ── a house ink is offered, and so is the theme's near-black. A grey
  // chosen for body text on white fails on a mid-light accent as badly as the
  // paper does, and the card must stay legible: #565B63 on #EC8A3C is 2.69:1.
  const houseInk = hexToOklch('#565B63');
  const lp = DG_THEMES['light-orange'];
  const picked = inkFor(house, [
    { name: 'paper', oklch: lp.paper }, { name: 'ink', oklch: houseInk }, { name: 'deep', oklch: lp.ink },
  ]).pick.name;
  report.ok(picked === 'deep',
    'with a house ink, an accent card that fails both paper and the house grey takes the near-black',
    `${picked} - house ink ${contrast(house, houseInk).toFixed(2)}:1, near-black ${contrast(house, lp.ink).toFixed(2)}:1`);
  report.ok(/candidates\.push\(\{ name: 'deep'/.test(build) && /reversed: pick\.name !== 'paper'/.test(build),
    'build.js offers that near-black whenever a deck names its own ink');

  // 6 ── the parser: a hex is a hex, and nothing else is.
  for (const bad of ['orange', '#EC8A3', '#GGGGGG', 'rgb(1,2,3)', '', 'EC8A3C'])
    report.ok(hexToOklch(bad) === null, `hexToOklch refuses ${JSON.stringify(bad)}`);
  report.ok(Math.abs(luminance(hexToOklch('#ffffff')) - 1) < 1e-6, 'white is luminance 1');
  report.ok(luminance(hexToOklch('#000000')) < 1e-9, 'black is luminance 0');
  const short = hexToOklch('#f71'), long = hexToOklch('#ff7711');
  report.ok(short && long && Math.abs(short[0] - long[0]) < 1e-12,
    'the three-digit form is the six-digit one doubled');
}
