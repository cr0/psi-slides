/*
 * ::: activity – the five kinds, held across the two files that read them.
 *
 * The build owns the kinds (their colour and their mark); lint.js mirrors
 * their names, because a word the linter refuses and the build draws is a
 * valid deck failing CI, and a word the linter passes and the build refuses
 * is a broken build nobody was warned about. Both directions are asserted.
 *
 * Also held here: the box is conditional (a deck without one emits nothing),
 * its edge prints, and the three places a box may not open are refused by
 * both files under the same reasoning.
 *
 * build.js is read as text, the way the `frontmatter` and `xheight` gates
 * read it: it calls main() at module scope and cannot be imported.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './harness.mjs';

export const name = 'activity: the five kinds, and where a box may open, agree across build and lint';

export async function run({ report }) {
  const build = fs.readFileSync(path.join(ROOT, 'build.js'), 'utf8');
  const lint = fs.readFileSync(path.join(ROOT, 'lint.js'), 'utf8');

  const table = build.match(/const ACTIVITY_KINDS = \{([\s\S]*?)\n\};/);
  const mirror = lint.match(/const ACTIVITY_KINDS = \[([^\]]*)\]/);
  if (!report.ok(!!(table && mirror), 'both files still declare the kinds as literals')) return;
  const kinds = [...table[1].matchAll(/^\s{2}([a-z]+):/gm)].map(m => m[1]);
  const names = [...mirror[1].matchAll(/'([a-z]+)'/g)].map(m => m[1]);
  report.ok(kinds.join() === names.join(), 'lint.js knows exactly the kinds build.js draws',
    `${kinds.join()} | ${names.join()}`);
  report.ok(kinds.join() === 'link,info,task,example,takeaway', 'and they are link, info, task, example and takeaway');
  // One kind carries the deck's accent, and it is the takeaway: two kinds in
  // one colour would be told apart only by their marks.
  const accented = kinds.filter(k => new RegExp(`\\b${k}:\\s*\\{[^}]*colour: 'var\\(--emph\\)'`).test(table[1]));
  report.ok(accented.join() === 'takeaway', 'exactly one kind, the takeaway, takes the deck\'s accent', accented.join());
  for (const k of kinds) {
    const entry = table[1].match(new RegExp(`\\b${k}:\\s*\\{[^}]*glyph: '([^']*)'`));
    report.ok(!!entry && /<(path|circle|rect|ellipse)\b/.test(entry[1]),
      `${k} carries a mark drawn by the build`);
  }

  // Conditional, so a deck without a box builds byte for byte what it did.
  report.ok(/function activityStyleTag\((st(, view = 'live')?)?\) \{\n  if \(!currentActivities\) return '';/.test(build),
    'the box stylesheet is emitted only into a deck that writes a box');
  report.ok(/currentActivities = false;/.test(build.slice(build.indexOf('function parseLecture('), build.indexOf('function parseLecture(') + 2500)),
    'and the flag is cleared at the head of the parse, for --watch');

  // Resolved on the box. Declared on :root, var(--emph) was substituted
  // before the theme or an identity had set the body's accent, and the info
  // box ignored both.
  report.ok(!/:root \{ \$\{kinds\.map/.test(build) && /\.activity-\$\{k\} \{ --activity: var\(--activity-\$\{k\}, \$\{v\.colour\}\);[^`]*\}/.test(build),
    "a box's colour is resolved on the box, so the takeaway box follows the theme's and the deck's accent");

  // The edge prints.
  const css = build.slice(build.indexOf('function activityStyleTag'), build.indexOf('function activityStyleTag') + 2600);
  report.ok(/box-shadow: 0\.22em 0\.22em 0 var\(--card-edge\);/.test(css) && /print-color-adjust: exact/.test(css),
    'the hard 45-degree edge is part of the box and survives printing without background graphics');

  // Where a box may not open, in both files.
  report.ok(/\['cols', 'marginalia', 'activity'\]\.includes\(l\.kind\)/.test(build)
      && /stackHas\(\/\^\(cols\|marginalia\|activity\)\/\)/.test(lint),
    'a box inside ::: cols, ::: marginalia or another box is refused by both files');
  report.ok(/narrows: true \}\);/.test(build.slice(build.indexOf("kind: 'activity'") - 80, build.indexOf("kind: 'activity'") + 40))
      && /\^\(cols\|marginalia\|embed\|activity\)/.test(lint),
    'and a card row inside a box is refused by both, through the narrowing rule');
  report.ok(/\(cols\|side\|flip\|marginalia\|embed\|slide\|script\|activity\)/.test(build),
    'the overlay and embed refusals in build.js name the directive');
}
