/*
 * A figure box under `elevation: offset` is drawn the way a card is.
 *
 * `figureCardCss()` restates, for SVG, what `cardToneCss()` says for HTML: the
 * tint, the rule, the heading in the tone and the darker edge. Two hand copies
 * of one look drift, and a figure beside a card row of the same tone is exactly
 * where a room sees the difference. So this gate reads the mix strengths out of
 * the card rules and holds the figure rules to them, rather than restating the
 * numbers here.
 *
 * It also holds the three things that made the first draft wrong on a slide:
 * only the first label line is the heading, `.tone-4`'s label inversion (on the
 * tspans, for the solid fill this tint replaces) has to lose, and a chart's
 * column, a lane and a see-through frame are not cards.
 *
 * build.js is read as text, as the elevation gate reads it: it calls main() at
 * module scope and cannot be imported. The function is small and pure, so it is
 * lifted out with the two constants it reads and run.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './harness.mjs';

export const name = 'figure-cards: a figure box under elevation: offset is a card';

export async function run({ report }) {
  const build = fs.readFileSync(path.join(ROOT, 'build.js'), 'utf8');

  const fnAt = build.indexOf('function figureCardCss()');
  const fnEnd = build.indexOf('\n}\n', fnAt);
  const tones = build.match(/const CARD_TONE_DEFAULTS = (\{[\s\S]*?\});/);
  const offset = build.match(/const FIGURE_EDGE_OFFSET = '(\d+)px';/);
  if (!report.ok(fnAt > 0 && fnEnd > fnAt && !!tones && !!offset,
    'figureCardCss, CARD_TONE_DEFAULTS and FIGURE_EDGE_OFFSET are still where the gate reads them')) return;

  // Reached from the offset branch and nowhere else: a deck that says nothing
  // about elevation builds byte for byte what it built before.
  const calls = build.split('figureCardCss()').length - 2;   // minus the definition
  const branch = build.slice(build.indexOf("if (st.elevation === 'offset') {"),
    build.indexOf("if (st.elevation === 'offset') {") + 800);
  report.ok(calls === 1 && /figureCardCss\(\)\.map/.test(branch),
    'figureCardCss is emitted only under elevation: offset', `${calls} call site(s)`);

  const css = new Function(
    `const CARD_TONE_DEFAULTS = ${tones[1]}; const FIGURE_EDGE_OFFSET = '${offset[1]}px';\n`
    + build.slice(fnAt, fnEnd + 2) + '\nreturn figureCardCss();')();
  const all = css.join('\n');

  // The strengths, read from the card rules.
  const card = build.slice(build.indexOf('function cardToneCss'), build.indexOf('function paletteSettings'));
  const fill = card.match(/--card-bg: color-mix\(in oklab, \$\{tv\(tone\)\} (\d+)%/);
  const edge = card.match(/--card-edge: color-mix\(in oklab, \$\{tv\(tone\)\} (\d+)%, black\)/);
  const rule = card.match(/border-color: color-mix\(in oklab, \$\{tv\(tone\)\} (\d+)%/);
  if (!report.ok(!!(fill && edge && rule), 'the card tone strengths are still readable from cardToneCss')) return;

  for (const t of Object.keys(new Function(`return ${tones[1]}`)())) {
    const r = css.find(x => x.includes(`.clear).${t} > :is(rect, .dg-shape)`)) || '';
    report.ok(r.includes(`${fill[1]}%, var(--paper))`) && r.includes(`${rule[1]}%, var(--paper))`)
      && r.includes(`${edge[1]}%, black)`),
      `.${t}: fill ${fill[1]}%, rule ${rule[1]}% and edge ${edge[1]}% are the card's`);
  }

  // A card-look box rule excludes columns, lanes and see-through frames. The
  // one deliberate exception is the flat field: `.bare` with a tone is a field
  // of a record bar and takes the tint without outline or edge - and even that
  // rule names a tone, so a lane (bare, untoned) is still never reached.
  report.ok(css.every(r => !/\.dg-box/.test(r)
      || /\.dg-box:not\(\.dg-bar\):not\(\.bare\):not\(\.clear\)/.test(r)
      || (/\.dg-box\.bare\.(tone-[1-4]|accent)\b/.test(r) && !/drop-shadow/.test(r))),
    "every box rule leaves a chart's column, a lane and a see-through frame alone; a toned bare box is a flat field with no edge");
  report.ok(new RegExp(`drop-shadow\\(${offset[1]}px ${offset[1]}px 0 `).test(all)
    && /print-color-adjust: exact/.test(all),
    'the edge is a drop-shadow without blur, and it survives printing without background graphics');
  report.ok(/text > tspan\[x\]:not\(:first-child\)/.test(all),
    'only the first label line is the heading; the lines after it go back to the ink');
  report.ok(/text > tspan:not\(\.dg-em\):not\(\.dg-mu\) \{ fill:/.test(all),
    ".tone-4's label inversion is overridden on the tspans, where it is written, and inline accents keep their own");
  const emphAt = css.findIndex(r => /\.emph > :is\(rect, \.dg-shape\) \{ stroke: var\(--emph\)/.test(r));
  report.ok(emphAt > css.findIndex(r => r.includes('.tone-1 >')),
    '.emph keeps its accent outline over the tint, written after the tone rules');
}
