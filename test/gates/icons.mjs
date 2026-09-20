/*
 * `:fa-key:` — the one pattern build.js and lint.js both have to read.
 *
 * The build turns an icon token into an inline SVG; the linter warns when a
 * deck writes one and has not asked for icons. Those are two hand-written
 * regexes over the same syntax, in two files, which is exactly the shape this
 * suite exists for - and the failure mode is quiet in both directions. A
 * linter stricter than the build warns about a ratio of 3:2; a linter laxer
 * than the build lets a deck ship six literal characters where the author
 * wrote a mark.
 *
 * The fixtures below are the contract, and each one is a string somebody
 * would actually write. The two patterns are pulled out of the two files
 * rather than restated here, so this gate is about *them* and not about a
 * third copy of the rule.
 *
 * The roster itself is only checked when it is installed. These gates run on
 * a bare checkout with no `npm install`, which is their whole point, so the
 * half that needs the package degrades to a note the way `--check-fit`
 * degrades when there is no browser.
 *
 * build.js is read as text, the way the `frontmatter` and `xheight` gates
 * read it: it calls main() at module scope and cannot be imported.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './harness.mjs';

export const name = 'icons: build.js and lint.js read the same :fa-…: pattern';

// [text, is it an icon token]
const FIXTURES = [
  [':fa-key:', true],
  [':fa-user-check:', true],
  [':fa-user-secret:', true],
  [':far-clock:', true],
  [':fab-github:', true],
  [':fa-arrow-right-to-bracket:', true],
  [':fa-1:', true],
  // Not icons, and each one is a thing a lecture actually contains.
  [':fa:', false],                 // a prefix with no name
  [':fas-key:', false],            // FA's own fourth prefix, which this does not take
  [':key:', false],                // the emoji-shaped convention this deliberately is not
  ['3:2', false],                  // a ratio
  ['9:30', false],                 // a time
  [':fa-Key:', false],             // the roster is lower case
  [':fa_key:', false],
  [':fa-key', false],              // unterminated
  ['fa-key:', false],              // unopened
];

export async function run({ report }) {
  const build = fs.readFileSync(path.join(ROOT, 'build.js'), 'utf8');
  const lint = fs.readFileSync(path.join(ROOT, 'lint.js'), 'utf8');

  const buildSrc = build.match(/const ICON_RE = (\/.*\/);/);
  if (!report.ok(!!buildSrc, 'ICON_RE is still a literal in build.js')) return;
  // The build's is anchored (it tokenizes from the head of the remaining
  // source); the linter's scans a line. Compared on the same footing by
  // testing each against a string that is only the token.
  const buildRe = new RegExp(buildSrc[1].slice(1, buildSrc[1].lastIndexOf('/')),
    buildSrc[1].slice(buildSrc[1].lastIndexOf('/') + 1));
  const lintSrc = lint.match(/bare\.match\((\/[^;]*\/)\)/);
  if (!report.ok(!!lintSrc, "lint.js's mirror is still a literal")) return;
  const lintRe = new RegExp(lintSrc[1].slice(1, lintSrc[1].lastIndexOf('/')));

  for (const [text, want] of FIXTURES) {
    const b = buildRe.test(text);
    // The linter's pattern is unanchored on purpose - it scans a line - so a
    // fixture that should NOT match is only a real disagreement when the
    // match covers the whole string. `3:2` must not match anywhere; but a
    // line containing an icon plus prose must.
    const m = text.match(lintRe);
    const l = !!m && m[0] === text;
    report.ok(b === want, `build.js ${want ? 'reads' : 'does not read'} ${JSON.stringify(text)} as an icon`);
    report.ok(l === want, `lint.js ${want ? 'reads' : 'does not read'} ${JSON.stringify(text)} as an icon`);
  }

  // The third reader of the same syntax. A `::: draw` body never reaches the
  // prose scan above - lint.js captures it verbatim, ahead of everything
  // else, because a diagram comment starts with '#' - so a mark written in a
  // figure label was read by nobody, and the compiler has no icon pass to
  // read it with: it measures a label as glyphs and emits a <text>. A deck
  // that sets `icons:` (every house deck does) therefore shipped `:fa-key:`
  // to the projector as eight literal characters, silently, which is the one
  // failure mode this whole gate exists for.
  const drawSrc = lint.match(/const hit = q\.match\((\/[^;]*\/)\);/);
  if (report.ok(!!drawSrc, "lint.js's draw-label mirror is still a literal")) {
    const drawRe = new RegExp(drawSrc[1].slice(1, drawSrc[1].lastIndexOf('/')));
    for (const [text, want] of FIXTURES) {
      const m = text.match(drawRe);
      report.ok((!!m && m[0] === text) === want,
        `the draw-label scan ${want ? 'reads' : 'does not read'} ${JSON.stringify(text)} as an icon`);
    }
    report.ok(/'icon-in-draw'/.test(lint), 'and reports it as icon-in-draw');
    // A warning, not an error: refusals.mjs holds build and linter to the
    // same refusals, and the build compiles this line without complaint.
    report.ok(/add\(ln, 'warn', 'icon-in-draw'/.test(lint),
      'as a warning, because the build accepts the line');
  }
  // The claim the warning makes about the compiler, checked rather than
  // trusted: if diagram-core ever grows an icon pass, this gate fails and the
  // warning comes out with it.
  const core = fs.readFileSync(path.join(ROOT, 'diagram-core.mjs'), 'utf8');
  report.ok(!/fa-\|far-\|fab-/.test(core) && !/ICON_RE/.test(core),
    'diagram-core.mjs has no icon pass, so the warning is telling the truth');

  // The three prefixes, and that they are the three the set ships.
  const table = build.match(/const ICON_PREFIXES = \{([^}]*)\}/);
  if (report.ok(!!table, 'ICON_PREFIXES is still an object literal')) {
    const styles = [...table[1].matchAll(/'([a-z]+)'/g)].map(m => m[1]);
    report.ok(styles.join() === 'solid,regular,brands',
      'the three prefixes map to solid, regular and brands', styles.join());
  }

  // The accessible name is not optional: it is what --squint and the search
  // index read, and it is the whole argument for SVG over a webfont.
  report.ok(/<title>\$\{escapeHtml\(label\)\}<\/title>/.test(build),
    'every inlined icon carries a <title>, which is what --squint and search read');
  report.ok(/aria-hidden="true"/.test(build.slice(build.indexOf('function iconSvg'), build.indexOf('const iconNotice'))),
    'and aria-hidden, so a screen reader does not announce it twice');

  // Attribution travels with the icons, the way oflNotice travels with the
  // bundled faces. CC BY 4.0 asks for it and a deck should not leave every
  // lecturer to discharge that themselves.
  report.ok(/CC BY 4\.0/.test(build), 'the CC BY 4.0 attribution is emitted with the icons');
  report.ok(/if \(!currentIconsUsed\.size\) return '';/.test(build),
    'and only into a view that carries one');

  // The mode is set at the head of the parse, not in the pre-flight. Cards,
  // overlays and docks are rendered through marked during the parse, so a
  // mode set any later leaves an icon in a card as its own text.
  const parse = build.slice(build.indexOf('function parseLecture('), build.indexOf('function parseLecture(') + 2500);
  report.ok(/currentIconMode = iconMode\(frontmatter\);/.test(parse),
    'the icon mode is set inside parseLecture, before a card body is rendered');

  // An icon beside a card's bold heading is part of the heading. The lead
  // pattern takes icon tokens on either side of the bold into the <strong>,
  // so they are set in the heading's colour; without it the lead was not
  // recognised at all and the icon sat in the body's ink.
  report.ok(/const CARD_LEAD_ICON = /.test(build)
      && /\$\{lead\[1\]\}\$\{lead\[2\]\.slice\(2, -2\)\}\$\{lead\[3\]\}/.test(build),
    "icons beside a card's bold heading are taken into the lead and take its colour");

  // The roster, when it is here. These gates run on a bare checkout.
  const pkg = path.join(ROOT, 'node_modules', '@fortawesome', 'fontawesome-free', 'svgs');
  if (!fs.existsSync(pkg)) {
    report.note('@fortawesome/fontawesome-free is not installed, so the roster half of this '
      + 'gate did not run. It is a devDependency; `npm install` brings it.');
    return;
  }
  for (const style of ['solid', 'regular', 'brands']) {
    const dir = path.join(pkg, style);
    const n = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.svg')).length : 0;
    report.ok(n > 0, `the ${style} set is where the build looks for it`, n + ' icons');
  }
  // Every file already draws with currentColor, which is why an icon follows
  // the theme through `A` with no rule of its own. Checked on a sample rather
  // than on all 2883: the property is the package's, not this repository's.
  const sample = ['solid/key.svg', 'regular/clock.svg', 'brands/github.svg'];
  for (const f of sample) {
    const p = path.join(pkg, f);
    if (!fs.existsSync(p)) { report.ok(false, `${f} is in the roster`); continue; }
    const text = fs.readFileSync(p, 'utf8');
    report.ok(text.includes('currentColor'), `${f} draws with currentColor`);
    report.ok(!/\swidth=/.test(text), `${f} carries no width, so the stylesheet sizes it`);
  }
}
