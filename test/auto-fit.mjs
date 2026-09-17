/*
 * auto-fit has three modes, and the middle one is a claim about a number.
 *
 * `off` leaves the zoom alone. `true` (full) sizes every slide to the
 * screen, which means it grows a short slide as readily as it shrinks a long
 * one - the ceiling is the global maximum, 2.2. `shrink` is the same fit
 * with the lecturer's own zoom as the ceiling, so it can only ever take size
 * away: a slide that already fits comes out at exactly the zoom that was set,
 * and a slide that does not comes out smaller and inside the frame.
 *
 * "Leaves the zoom alone" is the whole of what the mode promises and it is a
 * number, so it is measured rather than read: the assertion that matters is
 * the short slide sitting at 1.35 under shrink and above 1.35 under full, on
 * the same deck, one # press apart. Everything else about the modes -
 * which words the key takes, what the frontmatter resolves to, what travels
 * in a snapshot - needs no browser and is in test/settings.mjs.
 *
 * It builds its own deck for the reason math-focus does: the fixture is a
 * slide deliberately taller than any frame and one deliberately shorter,
 * which is not a lecture and does not belong in lectures/.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { serve, ROOT } from './harness.mjs';

export const name = 'auto-fit · shrink only ever takes size away';
export const lecture = 'tutorial';   // built for other specs already; unused here
export const view = 'audience';

// Every paragraph contributes its topic sentence to the collapsed slide, so
// the height is the count. Fourteen is comfortably past a 900px frame at the
// default zoom and still passes the density budget for a free chunk.
const TALL = Array.from({ length: 14 },
  (_, i) => `Zeile ${i + 1} steht fuer sich und traegt einen eigenen Gedanken.`).join('\n\n');

const SOURCE = `---
title: T
---

## title: {#title}

## free: Tall {#tall}

${TALL}

## free: Short {#short}

One line, and nothing else on the slide.

## free: Tall again {#tall2}

${TALL}
`;
// walkTo only presses ArrowDown, so the deck is ordered the way the spec
// reads it and the tall slide appears twice rather than being walked back to.

// The second fixture, and it is a cover rather than a slide of prose.
//
// A composition may pin the foot of its type block to the bottom of a box that
// is already stretched to the frame - masthead does, which is also what lands
// its folio rule at the top of the credits. The extent from the words at the
// top to the words at the bottom is then the box's height at every type size,
// so the fit's height test never comes true and it walks to its 0.6 floor.
// Measured before the fix: one presenter line took this cover from 2.2 to 0.6,
// and nothing anywhere said why.
//
// It is the fifth construct to make that mistake - the dock's reserved track,
// the overlay layer, a band panel, this, and the stretched .chunk-content
// under all of them - and every one was found by something bottoming out
// rather than by reading the code. Hence a test that watches the floor.
//
// auto-fit rides in the frontmatter here instead of on a # press, because the
// cover is the first slide and walkTo only ever goes forward.
//
// A lede was the second half: between the nameplate and the pinned credits
// masthead stretches its field (flex: 1), so with words in it the extent was
// the frame again - and the closing slide pins its own words to the foot the
// same way. This fixture had neither, so both still sat at 0.6.
const COVER_SOURCE = `---
title: T
subtitle: S
cover: masthead
auto-fit: true
presenter: P
---

## title: {#title}

A lede in the field between the nameplate and the credits.

## free: F {#f}

One line, and nothing else on the slide.

## closing: Danke | und tschuess {#end}

Closing words pinned to the foot.
`;

// The zoom the runtime settled on, and whether the slide is inside the frame.
const measure = (page) => page.evaluate(() => {
  const zoom = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--zoom'));
  const el = document.querySelector('.chunk.active');
  const vp = document.getElementById('stage-viewport');
  return {
    zoom,
    h: el ? Math.round(el.getBoundingClientRect().height) : 0,
    // FULL_FIT_FILL is the fraction of the viewport the fit aims at, so the
    // frame a fitted slide has to be inside is not the whole of it.
    frame: vp ? Math.round(vp.clientHeight) : 0,
  };
});

export async function run({ page, report, walkTo }) {
  const { ok, note } = report;

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'psi-autofit-'));
  fs.writeFileSync(path.join(dir, 'source.md'), SOURCE);
  const built = spawnSync(process.execPath,
    [path.join(ROOT, 'build.js'), path.join(dir, 'source.md'), '--audience-only'],
    { cwd: ROOT, encoding: 'utf8' });
  ok(built.status === 0, 'the fixture deck builds', (built.stdout || '') + (built.stderr || ''));
  if (built.status !== 0) return;

  const { server, port } = await serve(dir);
  const DEFAULT_ZOOM = 1.35;
  try {
    await page.goto(`http://127.0.0.1:${port}/audience.html`, { waitUntil: 'load' });
    await page.evaluate(() => { try { localStorage.clear(); } catch (e) { /* private window */ } });
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(700);

    // ── off, which is where a deck that says nothing opens ──
    await walkTo('tall');
    const offTall = await measure(page);
    ok(Math.abs(offTall.zoom - DEFAULT_ZOOM) < 0.001,
       'with auto-fit off the lecturer zoom stands on a slide too tall for the frame',
       String(offTall.zoom));
    ok(offTall.h > offTall.frame,
       'and the slide really is taller than the frame, or the rest of this proves nothing',
       `${offTall.h}px in ${offTall.frame}px`);

    // ── one press: shrink ──
    await page.keyboard.press('#');
    await page.waitForTimeout(500);
    const shrinkTall = await measure(page);
    ok(shrinkTall.zoom < DEFAULT_ZOOM,
       'one press of # shrinks that slide', `${shrinkTall.zoom} from ${DEFAULT_ZOOM}`);
    ok(shrinkTall.h <= shrinkTall.frame + 1,
       'and brings it inside the frame', `${shrinkTall.h}px in ${shrinkTall.frame}px`);

    // The claim the mode is named for. Same mode, a slide that fits, and the
    // zoom has to be the one that was set - not a fit that happens to land
    // near it, which is what a proportional estimate with no ceiling gives.
    await walkTo('short');
    const shrinkShort = await measure(page);
    ok(Math.abs(shrinkShort.zoom - DEFAULT_ZOOM) < 0.001,
       'and leaves a slide that already fits at exactly the zoom that was set',
       String(shrinkShort.zoom));

    // ── a second press: full ──
    await page.keyboard.press('#');
    await page.waitForTimeout(500);
    const fullShort = await measure(page);
    ok(fullShort.zoom > DEFAULT_ZOOM,
       'a second press grows the same short slide, which is the difference between the two modes',
       `${fullShort.zoom} vs ${shrinkShort.zoom}`);
    note(`short slide: off/shrink ${shrinkShort.zoom}, full ${fullShort.zoom}; `
       + `tall slide: off ${offTall.zoom} (${offTall.h}px), shrink ${shrinkTall.zoom} (${shrinkTall.h}px)`);

    await walkTo('tall2');
    const fullTall = await measure(page);
    ok(fullTall.h <= fullTall.frame + 1,
       'and full still fits the tall one, which is what it always did',
       `${fullTall.h}px in ${fullTall.frame}px`);

    // ── a third press comes back round ──
    await page.keyboard.press('#');
    await page.waitForTimeout(500);
    const backOff = await measure(page);
    ok(Math.abs(backOff.zoom - DEFAULT_ZOOM) < 0.001,
       'and a third press is back to off, with the lecturer zoom restored untouched',
       String(backOff.zoom));
  } finally {
    server.close();
  }

  // ── a cover whose credits are pinned to the foot ──
  const cdir = fs.mkdtempSync(path.join(os.tmpdir(), 'psi-autofit-cover-'));
  fs.writeFileSync(path.join(cdir, 'source.md'), COVER_SOURCE);
  const cbuilt = spawnSync(process.execPath,
    [path.join(ROOT, 'build.js'), path.join(cdir, 'source.md'), '--audience-only'],
    { cwd: ROOT, encoding: 'utf8' });
  ok(cbuilt.status === 0, 'the cover fixture builds', (cbuilt.stdout || '') + (cbuilt.stderr || ''));
  if (cbuilt.status !== 0) return;
  const { server: cserver, port: cport } = await serve(cdir);
  try {
    await page.goto(`http://127.0.0.1:${cport}/audience.html`, { waitUntil: 'load' });
    await page.evaluate(() => { try { localStorage.clear(); } catch (e) { /* private window */ } });
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(900);
    const cover = await measure(page);
    // The floor itself, not a threshold near it: the failure this guards is
    // not "a bit small", it is the loop running out of room to shrink.
    ok(cover.zoom > 0.61,
       'a masthead cover with a presenter and a lede is not pinned at the auto-fit floor',
       String(cover.zoom));
    ok(cover.zoom > DEFAULT_ZOOM,
       'and full mode grows it, the same claim the short slide above makes',
       `${cover.zoom} vs ${DEFAULT_ZOOM}`);
    ok(cover.h <= cover.frame + 1,
       'while the slide is still inside the frame',
       `${cover.h}px in ${cover.frame}px`);
    note(`masthead cover under full: zoom ${cover.zoom}, ${cover.h}px in ${cover.frame}px`);

    await walkTo('end');
    const closing = await measure(page);
    ok(closing.zoom > 0.61,
       'nor is its closing slide, whose words are pinned to the foot', String(closing.zoom));
    ok(closing.h <= closing.frame + 1,
       'and the closing slide is inside the frame', `${closing.h}px in ${closing.frame}px`);
  } finally {
    cserver.close();
  }

  // ── the cockpit's thumbnails ──
  //
  // A thumbnail is a clone, and a clone inherits --zoom from the document -
  // which under auto-fit is the answer for the *current* slide. So every
  // thumbnail was drawn at the current slide's size: on a short slide the tall
  // one's thumbnail ran out of its slot, on the tall slide the short one's
  // shrank with it. Each clone now carries a zoom of its own. The assertion
  // is that a thumbnail's zoom does not move when the current slide does, and
  // that the tall one is smaller than the short one and inside its own box.
  const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'psi-autofit-thumbs-'));
  fs.writeFileSync(path.join(tdir, 'source.md'), SOURCE.replace('title: T\n', 'title: T\nauto-fit: true\n'));
  const tbuilt = spawnSync(process.execPath,
    [path.join(ROOT, 'build.js'), path.join(tdir, 'source.md'), '--speaker-only'],
    { cwd: ROOT, encoding: 'utf8' });
  ok(tbuilt.status === 0, 'the thumbnail fixture builds', (tbuilt.stdout || '') + (tbuilt.stderr || ''));
  if (tbuilt.status !== 0) return;
  const { server: tserver, port: tport } = await serve(tdir);
  const thumbs = () => page.evaluate(() => {
    const read = (id) => {
      const c = document.querySelector('#preview-strip .chunk-clone[data-chunk-id="' + id + '"]');
      if (!c) return null;
      return { zoom: parseFloat(getComputedStyle(c).getPropertyValue('--zoom')),
               over: c.scrollHeight > c.clientHeight + 2 };
    };
    return { tall: read('tall'), short: read('short') };
  });
  try {
    await page.goto(`http://127.0.0.1:${tport}/speaker.html`, { waitUntil: 'load' });
    await page.evaluate(() => { try { localStorage.clear(); } catch (e) { /* private window */ } });
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const atStart = await thumbs();
    ok(!!(atStart.tall && atStart.short), 'the cockpit draws both thumbnails', JSON.stringify(atStart));
    if (!atStart.tall || !atStart.short) return;
    ok(atStart.tall.zoom < atStart.short.zoom,
       'a thumbnail of a tall slide is drawn smaller than one of a short slide',
       `${atStart.tall.zoom} vs ${atStart.short.zoom}`);
    ok(!atStart.tall.over, 'and the tall one fits its own box');
    // Onto each of the two in turn: the tall slide is where the document's
    // zoom is smallest and the short one where it is largest, so a thumbnail
    // that still inherits it cannot hold still across both. The hash is the
    // way there because a key press needs focus the cockpit does not have
    // after a reload.
    const onto = async (id) => {
      await page.evaluate((h) => { location.hash = '#' + h; }, id);
      await page.waitForTimeout(1200);
      return thumbs();
    };
    const onTall = await onto('tall');
    const onShort = await onto('short');
    ok(onTall.tall.zoom === onShort.tall.zoom && onTall.short.zoom === onShort.short.zoom,
       'and neither moves when the current slide does',
       `tall ${onTall.tall.zoom} / ${onShort.tall.zoom}, short ${onTall.short.zoom} / ${onShort.short.zoom}`);
    note(`thumbnails under full: tall ${atStart.tall.zoom}, short ${atStart.short.zoom}`);
  } finally {
    tserver.close();
  }
}
