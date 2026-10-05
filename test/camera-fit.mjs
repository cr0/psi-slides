/*
 * The camera's fit test, and the box it is allowed to judge.
 *
 * One invariant, and it is the one `--check-fit` exists to police: **a chunk
 * whose content fits the frame has to be inside the frame.** A chunk taller
 * than the frame is walked instead, which is fine and deliberate; a chunk that
 * fits and is nonetheless clipped is a defect the room sees as a missing
 * sentence.
 *
 * It shipped broken. `focusCamera` measured the chunk *box* to decide whether
 * to centre or to walk, while the chunk box carries about 78 px of breathing
 * space above the heading - a deliberate part of the design. So a chunk whose
 * content was 793 px in an 800 px frame had a box of 871 px, failed the test,
 * had its head pinned at 5% and hung off the bottom of a frame it fitted
 * inside comfortably. Six of the tutorial's chunks were in that state at
 * 1280x800 and `--check-fit` had been reporting all six; nothing in the suite
 * asserted it, and `--check-fit` does not run in CI.
 *
 * The deck is a fixture with chunks of graded length so that some fit and some
 * do not at the viewport below, which is the arrangement the invariant needs
 * and which no lecture owes it at a stable size.
 */
import fs from 'node:fs';
import { tmpDir } from './tmp.mjs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { serve, ROOT } from './harness.mjs';

export const name = 'camera · a chunk that fits is inside the frame';
export const lecture = 'tutorial';   // built for other specs already; unused here
export const view = 'audience';

const para = (n) => Array.from({ length: n }, (_, i) =>
  `**Sentence ${i} opens the paragraph.** It then runs on for a while so the ` +
  'chunk grows by a predictable amount with every one of these that is added.'
).join('\n\n');

// One drawing, written once and used on four slides, because what those four
// assert is the *shape* of the body around it and not the figure.
const DRAW = `::: draw 40x20
box a "one" at 0,0
box b "two" right of a gap 1
edge a -> b
:::`;

// Four lengths, chosen to straddle the frame at 1280x800: the short ones fit
// with room to spare, the long one cannot fit at all and must be walked.
const DECK = `---
title: T
collapse: none
---

## title: {#title}

## free: Short {.wide #c1}

${para(2)}

## free: Middling {.wide #c2}

${para(5)}

## free: Near the edge {.wide #c3}

${para(7)}

## free: Far over {.wide #c4}

${para(18)}

## free: Centred on what is painted {.wide .middle #c5}

${para(1)}

---

${para(1)}

---

${para(3)}

## free: A drawing standing alone {.wide #c6}

${DRAW}

## free: A drawing with a footnote {.wide #c7}

${DRAW}

::: footnote
and a line under the slide
:::

## free: A drawing with prose under it {.wide #c8}

${DRAW}

${para(1)}

## free: A drawing that wants the old anchoring {.wide .top #c9}

${DRAW}

## statement: Every line is an utterance. {#c10}

---

And the second arrives on a press.
`;

// The ten covers, each on a deck of its own because a deck has exactly one.
// None writes cover-align: that key stretches the content box to the chunk,
// and a content box as tall as the chunk is centred where the chunk is - which
// is how the defect below hid on every deck that set it.
const COVERS = ['classic', 'masthead', 'stack', 'display', 'panel', 'quote',
  'split', 'hero', 'beside', 'above'];
const COVER_PICTURE = new Set(['split', 'hero', 'beside', 'above']);
// One pixel of PNG. What the covers assert is where the chunk stands, and a
// chunk pinned to the slide's height stands there whatever its picture shows.
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64');

const coverDeck = (cover) => `---
title: Stilprobe
subtitle: Die Bausteine
presenter: A. Lecturer
cover: ${cover}
${COVER_PICTURE.has(cover) ? 'cover-image: bild\n' : ''}section: number
---

## title: {#title}

A sentence the cover carries under its title.

# A part {#part}

## free: An ordinary slide {#plain}

One sentence.

## closing: Thank you {#end}

Questions?
`;

function buildCover(cover) {
  const dir = tmpDir('psi-camfit-' + cover + '-');
  fs.mkdirSync(path.join(dir, 'assets'));
  fs.writeFileSync(path.join(dir, 'assets', 'bild.png'), PIXEL);
  fs.writeFileSync(path.join(dir, 'source.md'), coverDeck(cover));
  const r = spawnSync(process.execPath,
    [path.join(ROOT, 'build.js'), path.join(dir, 'source.md'), '--audience-only', '--no-optimize-images'],
    { cwd: ROOT, encoding: 'utf8' });
  return { dir, status: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

function buildDeck() {
  const dir = tmpDir('psi-camfit-');
  fs.writeFileSync(path.join(dir, 'source.md'), DECK);
  const r = spawnSync(process.execPath,
    [path.join(ROOT, 'build.js'), path.join(dir, 'source.md'), '--audience-only'],
    { cwd: ROOT, encoding: 'utf8' });
  return { dir, status: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

export async function run({ page, report }) {
  const { ok, note } = report;

  const built = buildDeck();
  ok(built.status === 0, 'the fixture deck builds', built.out);
  if (built.status !== 0) return;

  const { server, port } = await serve(built.dir);
  const prev = page.viewportSize();
  try {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`http://127.0.0.1:${port}/audience.html`, { waitUntil: 'load' });
    await page.evaluate(() => { try { localStorage.clear(); } catch (e) { /* private window */ } });
    await page.goto(`http://127.0.0.1:${port}/audience.html`, { waitUntil: 'load' });
    await page.waitForTimeout(600);

    // The same two boxes --check-fit compares, read after the camera has settled
    // on each chunk in turn.
    const measure = (id) => page.evaluate((cid) => {
      const i = flatChunks.findIndex((c) => c.id === cid);
      if (i < 0) return null;
      jumpTo(i);
      return new Promise((res) => setTimeout(() => {
        const el = flatChunks[i].el;
        const content = el.querySelector('.chunk-content') || el;
        const r = content.getBoundingClientRect();
        const vp = document.getElementById('psiINT-stage-viewport').getBoundingClientRect();
        res({
          box: Math.round(el.getBoundingClientRect().height),
          h: Math.round(r.height), vpH: Math.round(vp.height),
          top: Math.round(r.top - vp.top), bottom: Math.round(r.bottom - vp.top),
        });
      }, 520));
    }, id);

    let straddled = false;
    for (const id of ['c1', 'c2', 'c3', 'c4']) {
      const m = await measure(id);
      if (!m) { ok(false, `#${id} is in the deck`); continue; }
      const fits = m.h <= m.vpH;
      note(`#${id}: content ${m.h}, box ${m.box}, frame ${m.vpH}, ` +
        `top ${m.top}, bottom ${m.bottom}${fits ? '' : '  (taller than the frame - walked)'}`);
      // The box being taller than the frame while the content is not is the
      // exact state that used to mis-route the camera. Note it where it occurs,
      // so a reader can see the spec is testing the case it claims to.
      if (fits && m.box > m.vpH) {
        straddled = true;
        note(`  ^ box overflows the frame and the content does not - the case that broke`);
      }
      if (!fits) continue;
      ok(m.top >= -1 && m.bottom <= m.vpH + 1,
        `#${id} fits the frame and is inside it`,
        `content ${m.h} in ${m.vpH}, top ${m.top}, bottom ${m.bottom}`);
    }
    ok(straddled,
      'and at least one chunk had a box taller than the frame while its content fit',
      'no chunk straddled the two boxes, so the regression case was not exercised');

    // The second box the camera is allowed to judge, and the one --check-fit
    // used to be blind to. A `.middle` chunk whose reveals arrive downwards
    // keeps its final height from beat 0, so at beat 0 the content box hangs
    // out of the frame while everything the room can see is comfortably
    // inside it. The camera frames the painted span; the probe has to measure
    // the same span, or it reports a slide as clipped with nothing cut - two
    // chunks of a keynote, "184 px off the bottom" and "40 px".
    const mid = await page.evaluate(() => {
      const i = flatChunks.findIndex((c) => c.id === 'c5');
      if (i < 0) return null;
      jumpTo(i);
      return new Promise((res) => setTimeout(() => {
        const el = flatChunks[i].el;
        const content = el.querySelector('.chunk-content');
        const vp = document.getElementById('psiINT-stage-viewport').getBoundingClientRect();
        const r = content.getBoundingClientRect();
        const sp = typeof paintedClientSpan === 'function' ? paintedClientSpan(content) : null;
        res({
          has: typeof paintedClientSpan === 'function',
          middle: el.hasAttribute('data-middle'),
          boxTop: Math.round(r.top - vp.top), boxBottom: Math.round(r.bottom - vp.top),
          boxH: Math.round(r.height),
          spanTop: sp ? Math.round(sp.top - vp.top) : null,
          spanBottom: sp ? Math.round(sp.bottom - vp.top) : null,
          spanH: sp ? Math.round(sp.height) : null,
          vpH: Math.round(vp.height),
        });
      }, 520));
    });
    if (!mid) { ok(false, '#c5 is in the deck'); }
    else {
      ok(mid.has, 'paintedClientSpan is a global the probe can call');
      ok(mid.middle, '#c5 carries data-middle');
      note(`#c5 at beat 0: content box ${mid.boxH} px (${mid.boxTop}…${mid.boxBottom}), `
        + `painted span ${mid.spanH} px (${mid.spanTop}…${mid.spanBottom}), frame ${mid.vpH}`);
      ok(mid.spanH != null && mid.spanH < mid.boxH,
        'the painted span at beat 0 is shorter than the reserved content box',
        `span ${mid.spanH}, box ${mid.boxH}`);
      ok(mid.spanTop >= -1 && mid.spanBottom <= mid.vpH + 1,
        '#c5 is framed on what is painted, so the opening beat is inside the frame',
        `span ${mid.spanTop}…${mid.spanBottom} in a ${mid.vpH} px frame`);
    }

    // Who gets that camera without asking for it. The question is the chunk's
    // *shape*, not its type: a slide that is one drawing and nothing else is a
    // picture and frames what the beat paints, and so does a `statement:`,
    // whose heading and paragraphs are one size and arrive one per press. A
    // drawing with a sentence under it is prose with a figure in it and keeps
    // its head at the top, because prose grows downwards. `.top` is the word
    // that takes it back, and it is the half of this that cannot be inferred
    // from the rendering - a chunk that reads as top-anchored either because
    // the author said so or because nothing chose otherwise is two different
    // states in the source and one on the screen.
    const anchoring = await page.evaluate(() => Object.fromEntries(
      ['c6', 'c7', 'c8', 'c9', 'c10'].map((id) => {
        const c = flatChunks.find((x) => x.id === id);
        return [id, c ? c.el.hasAttribute('data-middle') : null];
      })));
    note(`opened centred: ${Object.entries(anchoring).filter(([, v]) => v).map(([k]) => '#' + k).join(' ') || 'none'}`);
    ok(anchoring.c6 === true, 'a chunk that is one drawing and nothing else opens centred');
    ok(anchoring.c7 === true,
      'and a footnote does not make it prose - the aside is lifted out of the slide');
    ok(anchoring.c8 === false, 'a drawing with a sentence under it keeps its head at the top');
    ok(anchoring.c9 === false, '.top takes the centring back on a chunk that would have had it');
    ok(anchoring.c10 === true, 'a statement: opens centred, because every one of its lines is a beat');
    // The third box, and the one that is not the content's at all. A cover, a
    // closing slide and a divider are pinned to the slide's height so their
    // ground fills the frame, and the camera has to frame that box: the
    // stylesheet says where the type stands on it. Centring the type instead
    // took the ground along - cover: hero stood 256 px above a 1080 px frame
    // with paper under the photograph and the next slide showing, and
    // classic, panel and above likewise. Asserted for all ten compositions,
    // for the closing slide, which draws the cover's, and for the divider.
    const frameOf = (id) => page.evaluate((cid) => {
      const i = flatChunks.findIndex((c) => c.id === cid);
      if (i < 0) return null;
      jumpTo(i);
      return new Promise((res) => setTimeout(() => {
        const el = flatChunks[i].el;
        const r = el.getBoundingClientRect();
        const c = el.querySelector('.chunk-content').getBoundingClientRect();
        const vp = document.getElementById('psiINT-stage-viewport').getBoundingClientRect();
        res({ top: Math.round(r.top - vp.top), h: Math.round(r.height), vpH: Math.round(vp.height),
          above: Math.round(c.top - vp.top), below: Math.round(vp.bottom - c.bottom) });
      }, 520));
    }, id);
    const inFrame = (m) => !!m && Math.abs(m.top) <= 1 && Math.abs(m.h - m.vpH) <= 1;
    const says = (m) => (m ? `top ${m.top}, ${m.h} in ${m.vpH}, content ${m.above} from the top and ${m.below} from the foot` : 'not in the deck');

    for (const cover of COVERS) {
      const cb = buildCover(cover);
      if (!ok(cb.status === 0, `cover: ${cover} builds without cover-align`, cb.out)) continue;
      const cs = await serve(cb.dir);
      try {
        await page.goto(`http://127.0.0.1:${cs.port}/audience.html`, { waitUntil: 'load' });
        await page.evaluate(() => { try { localStorage.clear(); } catch (e) { /* private window */ } });
        await page.goto(`http://127.0.0.1:${cs.port}/audience.html`, { waitUntil: 'load' });
        await page.waitForTimeout(600);
        const title = await frameOf('title');
        ok(inFrame(title), `cover: ${cover} - the cover is the frame`, says(title));
        const end = await frameOf('end');
        ok(inFrame(end), `cover: ${cover} - and so is the closing slide`, says(end));
        // classic is the one composition whose look the camera used to make:
        // its block stood centred in the frame because the camera centred it.
        // The stylesheet says so now, and a deck that never wrote cover-align
        // opens where it always opened.
        if (cover === 'classic') {
          ok(title && Math.abs(title.above - title.below) <= 2,
            'cover: classic - its block is centred in the frame, as it always was', says(title));
        }
        if (cover !== 'hero') continue;
        ok(title && title.below < title.above,
          'cover: hero - its type stands at the foot of the picture', says(title));
        const part = await frameOf('part-section');
        ok(inFrame(part), 'a divider is the frame', says(part));
        // The rule is about the three pinned families and nobody else: an
        // ordinary chunk is still judged on its content, which is the first
        // half of this spec. Its box is shorter than the frame, so it cannot
        // be mistaken for one of them.
        const plain = await frameOf('plain');
        ok(plain && plain.h < plain.vpH, 'an ordinary chunk is not pinned to the frame', says(plain));
      } finally {
        cs.server.close();
      }
    }
  } finally {
    if (prev) await page.setViewportSize(prev);
    server.close();
  }
}
