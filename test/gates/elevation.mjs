/*
 * The shadow ladder stays inside the slide's own padding.
 *
 * `style: {elevation}` puts `--shadow-float` on every card ground, and a
 * shadow is the one thing on a slide no probe in this repository can see:
 * `getBoundingClientRect()` does not include `box-shadow`, so `--check-fit`
 * reports a card as inside the frame while its shadow bleeds past the edge.
 * That is not fixable by a cleverer measurement - it is fixable by a
 * relation, and this gate is the relation:
 *
 *   the reach of the largest shadow in the ladder, at the largest
 *   `body-scale` the format allows, is not more than the slide's own
 *   vertical padding.
 *
 * Every number in it is read out of `build.js` rather than restated, so the
 * gate fails if anyone enlarges the ladder, raises the `body-scale` ceiling
 * or trims `--slide-pad-y` - which is the whole point, because each of those
 * looks locally harmless and none of them is.
 *
 * The margin is thin and that is worth knowing: the ceiling this format
 * already put on `body-scale` for unrelated reasons ("outside this range the
 * collapse mode, the code-width clamp and the auto-fit camera all stop
 * agreeing with each other") turns out to be almost exactly the ceiling the
 * shadow needs. The gate prints it.
 *
 * Out of scope on purpose: `--zoom`, the lecturer's own magnification. At a
 * zoom that large the slide has left the frame long before its shadow does,
 * and that is what `--check-fit` and `auto-fit` are for.
 *
 * build.js is read as text, the way the `frontmatter` and `xheight` gates
 * read it: it calls main() at module scope and cannot be imported.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './harness.mjs';

export const name = 'elevation: the shadow ladder stays inside the slide padding';

export async function run({ report }) {
  const build = fs.readFileSync(path.join(ROOT, 'build.js'), 'utf8');

  // The base type size, in the clamp's linear middle. Outside it the ratio is
  // not constant, and outside it the design is not either: the floor is a
  // 769 px window and the ceiling a 1461 px one.
  const type = build.match(/font-size: clamp\(\d+px, calc\(var\(--slide-h\) \* ([\d.]+)\), \d+px\);/);
  const pad = build.match(/--slide-pad-y: calc\(var\(--slide-h\) \* ([\d.]+)\);/);
  const float = build.match(/--shadow-float: 0 ([\d.]+)em ([\d.]+)em/);
  const scale = build.match(/'body-scale':\s*\{ kind: 'num', min: [\d.]+, max: ([\d.]+)/);
  const ok = report.ok(!!(type && pad && float && scale),
    'the four constants this relation is made of are still where it reads them',
    [type, pad, float, scale].map(m => (m ? m[1] : 'MISSING')).join(' '));
  if (!ok) return;

  const typeK = Number(type[1]);          // em per px of --slide-h
  const padK = Number(pad[1]);            // --slide-pad-y per px of --slide-h
  const maxScale = Number(scale[1]);

  // A step's reach below the box it is on is its y-offset plus its blur, and
  // --shadow-rest has two layers: the relation is about the furthest one.
  // Read as a table rather than as one number, because the ladder is not
  // ordered the way its names are - see the pending entry below.
  const rest = build.match(/--shadow-rest:[\s\S]*?0 ([\d.]+)em ([\d.]+)em[\s\S]*?0 ([\d.]+)em ([\d.]+)em/);
  const quiet = build.match(/--shadow-quiet: 0 ([\d.]+)em ([\d.]+)em/);
  if (!report.ok(!!(rest && quiet), 'the other two steps are still where it reads them')) return;
  const reach = {
    float: Number(float[1]) + Number(float[2]),
    rest: Math.max(Number(rest[1]) + Number(rest[2]), Number(rest[3]) + Number(rest[4])),
    quiet: Number(quiet[1]) + Number(quiet[2]),
  };
  const asFraction = (em) => em * typeK * maxScale;
  const ceilingFor = (em) => maxScale * padK / asFraction(em);

  // The step this key introduces on grounds that had none. It holds, and it
  // holds by very little: the ceiling `body-scale` already carried for
  // unrelated reasons is almost exactly the one the ladder needs.
  report.ok(asFraction(reach.float) <= padK,
    `--shadow-float at body-scale ${maxScale} stays inside --slide-pad-y`,
    `${asFraction(reach.float).toFixed(5)} of --slide-h against ${padK.toFixed(5)}`);
  report.note(`--shadow-float: body-scale could go to ${ceilingFor(reach.float).toFixed(3)} before it `
    + `leaves the padding - ${((padK / asFraction(reach.float) - 1) * 100).toFixed(1)}% of headroom.`);
  report.ok(asFraction(reach.quiet) <= padK,
    `--shadow-quiet at body-scale ${maxScale} stays inside --slide-pad-y`,
    asFraction(reach.quiet).toFixed(5));

  // **The ladder is not ordered the way its names are.** `--shadow-rest` is
  // the resting step and reads as the quietest of the three, but its second
  // layer is `0 0.26em 0.85em` - a far larger y-offset under a slightly
  // smaller blur - so it reaches 1.11em below a card where `--shadow-float`
  // reaches 1.04em. At 900 px and body-scale 1.8 that is 46.8 px of reach
  // into 44.1 px of padding: the shadow leaves the slide by about three
  // pixels, and no probe here can see it, which is why this gate exists.
  //
  // PRE-EXISTING, and it predates `style: {elevation}`: `.cards.cg-paper` has
  // carried `--shadow-rest` since the ladder was built, so any deck with
  // paper cards at a large body-scale already has it. On the ledger rather
  // than fixed here because the fix moves the look of every existing deck,
  // which is the maintainer's call and not a gate's.
  report.pendingOk(asFraction(reach.rest) <= padK,
    `--shadow-rest at body-scale ${maxScale} stays inside --slide-pad-y`,
    `it reaches ${asFraction(reach.rest).toFixed(5)} of --slide-h against ${padK.toFixed(5)}. `
    + `Its second layer is 0 0.26em 0.85em - a 1.11em reach where --shadow-float reaches `
    + `1.04em, so the resting step is the tallest one. Pulling that y-offset to 0.2em or `
    + `below fixes it, and so does raising --slide-pad-y; both move every deck's look`);

  // The two grounds with no box are excluded once, in the selector list,
  // rather than by a guard on each rule. A shadow on either draws a
  // rectangle around nothing.
  const grounds = build.match(/const ELEVATION_GROUNDS = \[([\s\S]*?)\]\.join/);
  if (report.ok(!!grounds, 'ELEVATION_GROUNDS is still an array literal')) {
    report.ok(/:not\(\.cg-clear\)/.test(grounds[1]), 'cg-clear is excluded, it has no box');
    report.ok(/:not\(\.ov-clear\)/.test(grounds[1]), 'ov-clear is excluded, it has no box');
    report.ok(/\.cards\.rows/.test(grounds[1]),
      'a rows block is listed separately: its ground is on the term, not on the item');
  }

  // The offset edge is the exception, and it has to stay one: it is emitted
  // without the live-view test, so the documents get it, and it asks the
  // browser to keep it when printing without background graphics. Measured
  // when it landed - a PDF printed that way drew one more filled shape per
  // card than the same deck at flat.
  const block = build.slice(build.indexOf('function styleBlockCss'), build.indexOf('function styleBlockCss') + 3000);
  report.ok(/if \(st\.elevation === 'offset'\) \{/.test(block),
    'elevation: offset is emitted into every view, the documents included');
  report.ok(/print-color-adjust: exact/.test(block),
    'and survives printing without background graphics');
  const off = build.match(/const ELEVATION_OFFSET = '([\d.]+)em';/);
  report.ok(!!off && Number(off[1]) * typeK * maxScale <= padK,
    'the offset edge stays inside --slide-pad-y at the largest body-scale',
    off ? (Number(off[1]) * typeK * maxScale).toFixed(5) : 'not found');

  // The soft steps are live only. A drop shadow on paper is a grey smear
  // that costs toner, and PRINT_CSS separates a card with a rule on purpose.
  const printCss = build.slice(build.indexOf('const PRINT_CSS = `'), build.indexOf('const AUDIENCE_CSS = `'));
  report.ok(!/--shadow-(rest|float|quiet)/.test(printCss),
    'no step of the ladder reaches the document');
}
