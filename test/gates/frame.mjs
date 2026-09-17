/*
 * The states in which a deck's frame must not paint.
 *
 * `identity:` draws a logo and a footer line over the stage. Every full-screen
 * thing the engine puts over that stage - the overview board, the TOC, the
 * search panel, the help sheet, the link and demo overlays, the export modal,
 * a focused figure, a live demo, and `B` - has to take the frame with it. The
 * workaround this feature replaces guessed at three spellings of "some panel
 * is up", none of which was real and none of which covered `B`: a logo
 * glowing on a deliberately black screen is the one place a frame must not be.
 *
 * `FRAME_HIDDEN_STATES` is the list. The point of this gate is not that the
 * list is right today - it is that it cannot go stale silently. Both halves
 * are DERIVED from build.js rather than restated here:
 *
 *   1. every `#x.hidden { display: none }` rule in the stylesheet is a
 *      full-screen panel toggled on its own element, and has to be covered.
 *      Two were missing from the first draft of the list and this is what
 *      said so.
 *   2. every body class in a selector that blurs, blanks or hides `#stage`
 *      has to be covered.
 *
 * And one that is not derived, because nothing in the stylesheet says it:
 * `overview-mode` replaces the stage rather than dimming it, so no property
 * sweep finds it. It is asserted by name, with this sentence as the reason.
 *
 * build.js is read as text, the way the `frontmatter` and `xheight` gates
 * read it: it calls main() at module scope and cannot be imported.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './harness.mjs';

export const name = 'frame: every state that covers the stage takes the frame with it';

export async function run({ report }) {
  const build = fs.readFileSync(path.join(ROOT, 'build.js'), 'utf8');

  const listed = build.match(/const FRAME_HIDDEN_STATES = \[([\s\S]*?)\n\];/);
  if (!report.ok(!!listed, 'FRAME_HIDDEN_STATES is still an array literal in build.js')) return;
  // Comments first: the block carries prose with apostrophes in it, and a
  // bare quote-pair sweep reads "stylesheet's own" as two entries.
  const body = listed[1].replace(/^\s*\/\/.*$/gm, '');
  const states = [...body.matchAll(/'([^']+)'/g)].map(m => m[1]);
  report.ok(states.length >= 5, 'the list has entries', states.length);

  // Every entry is a selector on the body, because that is what the emitted
  // rule prefixes to `#frame`. An entry that forgot the `body` would still
  // compile and would match nothing.
  for (const sel of states)
    report.ok(sel.startsWith('body'), `"${sel}" is a selector on the body`);

  // 1 ── the full-screen panels, derived from their own hiding rule.
  const panels = [...build.matchAll(/^#([a-z-]+)\.hidden \{ display: none; \}/gm)].map(m => m[1]);
  report.ok(panels.length >= 4, 'the stylesheet still hides its panels with #x.hidden', panels.join(' '));
  for (const id of panels) {
    report.ok(states.some(s => s.includes('#' + id)),
      `#${id} is a full-screen panel and FRAME_HIDDEN_STATES covers it`);
  }

  // 2 ── every body class that blurs, blanks or hides the stage.
  //
  // Read per rule, not per line: a selector list can run over several lines
  // and the declaration that matters is in the block after it. `cursor` and
  // `transition` are deliberately not in the property list - `overview-mode`
  // sets both on #stage and is covered by name below, and `view-panning`
  // sets only a transition and is not an overlay at all.
  const OBSCURES = /(?:filter|opacity|visibility|display|background)\s*:/;
  const dimmers = new Set();
  // `body` may carry a pseudo-class before its class - the blank key writes
  // `body:not([data-view=speaker]).blanked` - so the selector is matched from
  // the word `body` rather than from `body.`, and the classes are pulled out
  // of whatever follows. Anchoring on `body.` found one of the three.
  for (const m of build.matchAll(/((?:^body[.:[][^{}]*?#stage(?:-viewport)?[^{}]*?)\{([^{}]*)\})/gm)) {
    if (!OBSCURES.test(m[2])) continue;
    // Every class between `body` and the `#stage` it qualifies. Taken from
    // that substring rather than from a pattern anchored on `body.`, because
    // the blank and demo rules write `body:not([data-view=speaker]).blanked`
    // and `…​.demo-live:not(.blanked)` - a class can sit behind a pseudo and
    // there can be more than one. A class named inside a :not() lands here
    // too, and that is harmless: it is a state the frame hides in either way.
    for (const sel of m[1].split(',')) {
      const upto = sel.slice(0, sel.indexOf('#stage'));
      for (const c of upto.matchAll(/\.([a-z-]+)/g)) dimmers.add(c[1]);
    }
  }
  report.ok(dimmers.size > 0, 'the sweep found stage-obscuring body classes', [...dimmers].join(' '));
  for (const cls of dimmers) {
    report.ok(states.some(s => s.includes('.' + cls)),
      `body.${cls} obscures the stage and FRAME_HIDDEN_STATES covers it`);
  }

  // 2b ── the identity block's keys, held across the two files. lint.js
  // mirrors IDENTITY_SPEC by hand, and the first cut of the mirror left out
  // `logo-print`: the build accepted it and the linter refused it, so a valid
  // deck would have failed CI. Keys and enum words both, in both directions.
  const lint = fs.readFileSync(path.join(ROOT, 'lint.js'), 'utf8');
  const spec = build.match(/const IDENTITY_SPEC = \{([\s\S]*?)\n\};/);
  const mirror = lint.match(/const IDENTITY_KEYS = \{([\s\S]*?)\n\};/);
  if (report.ok(!!(spec && mirror), 'IDENTITY_SPEC and its lint.js mirror are still object literals')) {
    const specBody = spec[1].replace(/^\s*\/\/.*$/gm, '');
    const mirrorBody = mirror[1].replace(/^\s*\/\/.*$/gm, '');
    const keysOf = (body) => [...body.matchAll(/^\s*(?:'([a-z-]+)'|([a-z]+)):/gm)].map(m => m[1] || m[2]);
    const specKeys = keysOf(specBody).sort(), mirrorKeys = [...new Set(
      [...mirrorBody.matchAll(/(?:'([a-z-]+)'|\b([a-z]+)):/g)].map(m => m[1] || m[2]))].sort();
    report.ok(specKeys.join() === mirrorKeys.join(),
      'lint.js knows exactly the identity keys build.js reads',
      `build: ${specKeys.join(', ')} | lint: ${mirrorKeys.join(', ')}`);
    for (const m of specBody.matchAll(/'([a-z-]+)':\s*\{ kind: 'enum', values: \[([^\]]*)\]/g)) {
      const words = [...m[2].matchAll(/'([a-z-]+)'/g)].map(x => x[1]).join();
      const lm = mirrorBody.match(new RegExp(`'${m[1]}':\\s*\\[([^\\]]*)\\]`));
      const lwords = lm ? [...lm[1].matchAll(/'([a-z-]+)'/g)].map(x => x[1]).join() : '';
      report.ok(words === lwords, `identity.${m[1]} takes the same words in both files`, `${words} | ${lwords}`);
    }
  }

  // 2c ── the logo is counted by the auto-inline scan. Left out, a deck whose
  // only picture is its logo kept inlining off and shipped the logo as a
  // relative path - not self-contained, and drawn as nothing under --serve.
  const scan = build.slice(build.indexOf('function scanReferencedImages'), build.indexOf('function scanReferencedImages') + 3000);
  report.ok(/\^\[ \\t\]\+logo:/.test(scan) && /\^identity:/.test(scan),
    'identity.logo is counted by the auto-inline scan, block form and flow form');

  // 3 ── the one the sweep cannot see.
  report.ok(states.includes('body.overview-mode'),
    'overview-mode is covered, and is covered by name: it replaces the stage '
    + 'rather than dimming it, so no property sweep finds it');

  // 4 ── the rule actually reaches the frame.
  report.ok(/FRAME_HIDDEN_STATES\.map\(sel => `\$\{sel\} #frame`\)/.test(build),
    'the emitted rule prefixes each state to #frame');
}
