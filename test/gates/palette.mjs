/*
 * The tone table and the stylesheet that states the same four mixes.
 *
 * `palette:` re-points the base each tone is mixed from, and to do that it
 * has to restate the four `── tones ──` rules in DIAGRAM_CSS with a different
 * base colour. Those rules stay hand-written - their formatting is not worth
 * generating - so `DG_BOX_FILLS` in build.js is a mirror of them, and a
 * mirror is exactly the thing this suite exists to hold: a percentage that
 * drifts here draws a palette deck's boxes at a strength no theme deck uses,
 * and nothing about it looks wrong.
 *
 * Four things, and the first is the one that matters:
 *
 *   1. every mix in DG_BOX_FILLS is the mix DIAGRAM_CSS states, parsed back
 *      out of the stylesheet rather than copied;
 *   2. build.js and lint.js agree on which tones a palette may name, and
 *      both derive that list rather than typing it;
 *   3. both files convert to oklab BEFORE they mix a tone - which is what
 *      the browser's color-mix(in oklab, …) does, and interpolating a hue
 *      instead takes the short way round a circle and lands elsewhere;
 *   4. a palette is scoped to the light themes, so the derived mixes stay as
 *      the fallback on dark and the two terminal themes.
 *
 * build.js is read as text, the way the `frontmatter` and `xheight` gates
 * read it: it calls main() at module scope and cannot be imported.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './harness.mjs';
import { DG_BAR_FILLS, DG_THEMES } from '../../diagram-core.mjs';
import { hexToOklch, oklchToLab, labLuminance } from '../../colour.mjs';

export const name = 'palette: the tone table is the stylesheet, and both files agree';

const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

// One declaration of a tone rule, as the stylesheet writes it. Parsed rather
// than matched with a built-up pattern: `color-mix(in oklab, var(--emph) 13%,
// var(--paper))` and a bare `var(--emph)` are the only two shapes, and saying
// so in ten lines beats a regex nobody can read.
function readMix(decl) {
  const mix = decl.match(/color-mix\(in oklab, var\(--(\w+)\) (\d+)%, var\(--(\w+)\)\)/);
  if (mix) return { tok: mix[1], pct: Number(mix[2]), over: mix[3] };
  const plain = decl.match(/var\(--(\w+)\)/);
  return plain ? { tok: plain[1], pct: 100, over: null } : null;
}

export async function run({ report }) {
  const build = read('build.js');
  const lint = read('lint.js');

  // 1 ── the table against the stylesheet it mirrors.
  const table = build.match(/const DG_BOX_FILLS = \{([\s\S]*?)\n\};/);
  if (!report.ok(!!table, 'DG_BOX_FILLS is still an object literal in build.js')) return;
  const entries = [...table[1].matchAll(
    /'(tone-\d)':\s*\{ fill: \['(\w+)', (\d+), '(\w+)'\],\s*stroke: \['(\w+)', (\d+), '(\w+)'\] \}/g)];
  if (!report.ok(entries.length === 4, 'the table still holds four tones', entries.length)) return;

  // The `── tones ──` block alone, so a color-mix elsewhere in DIAGRAM_CSS
  // cannot be mistaken for one of these.
  const from = build.indexOf('/* ── tones ──');
  const to = build.indexOf('/* .clear is a see-through');
  if (!report.ok(from > -1 && to > from, 'the tones block is still where it is read from')) return;
  const tones = build.slice(from, to);

  for (const [, tone, fTok, fPct, fOver, sTok, sPct] of entries) {
    const rule = tones.match(new RegExp('\\.' + tone + ' > :is\\(rect, circle, \\.dg-shape\\) \\{([^}]*)\\}'));
    if (!report.ok(!!rule, `DIAGRAM_CSS still states a rule for ${tone}`)) continue;
    const body = rule[1];
    const fill = readMix((body.match(/fill:([^;]*);/) || [])[1] || '');
    const stroke = readMix((body.match(/stroke:([^;]*);?/) || [])[1] || '');
    report.ok(fill && fill.tok === fTok && fill.pct === Number(fPct)
        && (fill.pct === 100 || fill.over === fOver),
      `${tone}'s fill in the table is the fill in DIAGRAM_CSS`,
      fill ? `${fill.tok} ${fill.pct}% over ${fill.over}` : 'unreadable');
    report.ok(stroke && stroke.tok === sTok && stroke.pct === Number(sPct),
      `${tone}'s stroke in the table is the stroke in DIAGRAM_CSS`,
      stroke ? `${stroke.tok} ${stroke.pct}%` : 'unreadable');
  }

  // 2 ── one list of tones, in two files, both derived rather than typed.
  report.ok(/const PALETTE_KEYS = Object\.keys\(DG_BOX_FILLS\)/.test(build),
    "build.js derives a palette's keys from the box table");
  report.ok(/const PALETTE_KEYS = Object\.keys\(DG_BAR_FILLS\)\.filter/.test(lint),
    'lint.js derives them from the bar table, which it already imports');
  const barTones = Object.keys(DG_BAR_FILLS).filter(k => k.startsWith('tone-'));
  const boxTones = entries.map(e => e[1]);
  report.ok(barTones.join() === boxTones.join(),
    'the two tables name the same tones in the same order',
    `${barTones.join()} vs ${boxTones.join()}`);

  // 3 ── both convert before they mix. The assertion is about the shape of
  // the line each file writes, because the failure it guards is silent: a
  // hue interpolated linearly gives a plausible number for a wrong colour.
  const MIXES_IN_LAB = /oklchToLab\([\s\S]{0,400}?\* pct \/ 100 \+/;
  report.ok(MIXES_IN_LAB.test(build), 'build.js converts to oklab before it mixes a tone');
  report.ok(MIXES_IN_LAB.test(lint), 'lint.js converts to oklab before it mixes a tone');

  // And a worked number, so the gate fails if either formula changes shape.
  const paper = oklchToLab(DG_THEMES['light-orange'].paper);
  const c = oklchToLab(hexToOklch('#1E5B2C'));
  const pct = DG_BAR_FILLS['tone-2'][1];
  const mixed = [0, 1, 2].map(i => c[i] * pct / 100 + paper[i] * (1 - pct / 100));
  const a = labLuminance(mixed), b = labLuminance(paper);
  const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  report.ok(Math.abs(ratio - 2.24) < 0.01,
    'a tone-2 column of #1E5B2C measures 2.24:1 on the light paper', ratio.toFixed(3));

  // 5 ── the figure language's own column warning knows about the palette.
  // Before it did, a palette deck drew a warning for the four light themes
  // about the theme table's mix of ink and accent - a colour that is not drawn
  // there, because the palette replaced it. Those themes belong to
  // tone-contrast; the dark and terminal ones keep the mix and the warning.
  report.ok(/paletteTones\.has\(tone\) && t\.startsWith\('light-'\)/.test(lint),
    'diagram-bar-contrast leaves a palette tone on the light themes to tone-contrast');
  report.ok(/function paletteTonesOf\(header\)/.test(lint),
    'lint.js reads which tones a palette names');

  // 6 ── a palette does not need an identity. identityStyleTag emits both,
  // and an early return on a missing identity dropped a palette-only deck's
  // palette without a word: the figures kept the theme's mixed tones.
  const tag = build.slice(build.indexOf('function identityStyleTag'), build.indexOf('function identityStyleTag') + 600);
  report.ok(/identityColours\(identity, view\) \|\| \[\]/.test(tag) && !/if \(!groups\) return '';/.test(tag),
    'identityStyleTag does not return before the palette when a deck has no identity');

  // 7 ── a card row takes the tones too, through a slot beside the ground
  // rather than a seventh ground: CARDS_SLOTS carries `tone`, the class is
  // emitted only for a written tone so no existing row moves a byte, and the
  // refusal on a ground with no tint is in both files.
  const tails = read('tails.mjs');
  report.ok(/tone:\s*\{ default: 'none',\s*words: \['none', 'tone-1', 'tone-2', 'tone-3', 'tone-4', 'tones'\] \}/.test(tails),
    'CARDS_SLOTS carries a tone slot with the four tones and `tones`, defaulting to none');
  report.ok(/ground: \{ default: 'panel', words: \['panel', 'outline', 'clear', 'accent', 'paper', 'photo'\] \}/.test(tails),
    'and the grounds are still the six they were');
  report.ok(/if \(o\.tone !== 'none'\) \{ cls\.push\(`ct-\$\{o\.tone\}`\)/.test(build),
    "a card row's tone class is emitted only when a tone is written");
  report.ok(/\['accent', 'photo', 'clear'\]\.includes\(o\.ground\)/.test(build)
      && /'cards-tone-no-tint'/.test(lint),
    'a tone on a ground with no tint is refused by the build and by lint.js');

  // 8 ── the default tones are resolved on the card, not on :root, so a
  // toned card follows the theme's and the deck's accent through A.
  const toneCss = build.slice(build.indexOf('function cardToneCss'), build.indexOf('function cardToneCss') + 2500);
  report.ok(!/`:root \{ \$\{Object\.entries\(CARD_TONE_DEFAULTS\)/.test(toneCss) && /const tv = \(t\) => `var\(--\$\{t\}, /.test(toneCss),
    "a toned card's default colour is resolved on the card, so it follows the accent");

  // 9 ── one card's own colour, written after its heading, and the four
  // activity colours a palette may re-point. Both lists are mirrored by hand,
  // so both are held here.
  const words = (src, name) => { const m = src.match(new RegExp(`const ${name} = \\[([^\\]]*)\\]`)); return m ? [...m[1].matchAll(/'([a-z0-9-]+)'/g)].map(x => x[1]).join() : null; };
  report.ok(words(build, 'CARD_TONE_WORDS') === 'accent,tone-1,tone-2,tone-3,tone-4'
      && words(build, 'CARD_TONE_WORDS') === words(lint, 'CARD_TONE_WORDS'),
    "a card's own colour takes the accent and the four tones, in build.js and lint.js alike",
    `${words(build, 'CARD_TONE_WORDS')} | ${words(lint, 'CARD_TONE_WORDS')}`);
  report.ok(/'cards-card-tone'/.test(lint) && /is not a colour a card takes/.test(build),
    'an unknown card colour is refused by both files');
  report.ok(words(build, 'PALETTE_ACTIVITY_KEYS') === 'link,info,task,example,takeaway'
      && words(build, 'PALETTE_ACTIVITY_KEYS') === words(lint, 'PALETTE_ACTIVITY_KEYS'),
    'a palette may re-point the five activity colours, in both files alike');
  report.ok(/--activity-\$\{k\}: \$\{palette\[k\]\}/.test(build),
    'and they are emitted as the --activity-<kind> hooks the boxes read');

  // 4 ── scoped, so a theme switch still works. Four hues tuned against white
  // paper are not four hues on terminal-green, and the derivation a palette
  // replaces is exactly what makes that switch survivable.
  report.ok(/const scope = view === 'print' \? '' : IDENTITY_LIGHT_SEL;/.test(build),
    'a palette is scoped to the light themes live, and unscoped in the document');
}
