/*
 * The offset edge under a figure box, painted - in Chromium AND in WebKit.
 *
 * It shipped as `filter: drop-shadow(5px 5px 0 …)` on the box outline. Chrome
 * painted it. WebKit ignores a filter function on an element inside an SVG:
 * the rule matched, getComputedStyle reported the drop-shadow, and nothing was
 * drawn - so a lecturer who reads his slides in Safari saw figures with no
 * edge beside cards that had one, and every check in this repository passed,
 * because every check here runs Chromium and the computed style was right.
 *
 * So this spec does the one thing that would have caught it: it reads PIXELS,
 * in both engines, at a point the edge covers and the box does not - just
 * past the box's bottom-right corner. A painted edge is darker than the paper
 * there; a missing one is the paper. The DOM is not asked, because the DOM
 * was right all along.
 *
 * WebKit is optional, the way a browser is optional for this whole suite: it
 * is found through Playwright's own resolution (PLAYWRIGHT_BROWSERS_PATH or the
 * cache), and where it is not installed the WebKit half degrades to a note
 * and the Chromium half still runs. `npx playwright install webkit` brings it.
 */
import zlib from 'node:zlib';
import { webkit } from 'playwright-core';

export const name = 'figure edge · painted in chromium and webkit';
export const lecture = 'figure-cards';
export const view = 'audience';

// One pixel, decoded. A 1x1 clip comes back as a PNG with one scanline: a
// filter byte and RGB(A). Written out rather than pulled from a package,
// because this suite's dependency is a browser and nothing else.
export function pixel(png) {
  let at = 8, idat = [];
  let colorType = 6;
  while (at < png.length) {
    const len = png.readUInt32BE(at), type = png.toString('ascii', at + 4, at + 8);
    if (type === 'IHDR') colorType = png[at + 8 + 9];
    if (type === 'IDAT') idat.push(png.subarray(at + 8, at + 8 + len));
    at += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  return colorType === 2 ? [raw[1], raw[2], raw[3]] : [raw[1], raw[2], raw[3], raw[4]];
}
export const lum = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

// The first box that should stand on an edge, the chunk it is on, and two
// screen points: one inside the lifted edge but outside the box, one on open
// paper beside the figure for reference. Screen points from getScreenCTM, so
// the camera's zoom and the figure's own scale are both accounted for.
const probe = (page) => page.evaluate(() => {
  // Found by the BOX, not by the edge element: how the edge is drawn is the
  // thing under test, so the spec must not depend on it. Against the old
  // filter this finds the same box and reads the paper in WebKit.
  const g = document.querySelector('.psi-diagram .dg-box:not(.dg-bar):not(.bare):not(.clear)');
  if (!g) return null;
  const box = g.querySelector(':scope > :is(rect, .dg-shape):not(.dg-lift)');
  const chunk = g.closest('.chunk');
  const bb = box.getBBox(), m = box.getScreenCTM();
  const at = (x, y) => { const p = new DOMPoint(x, y).matrixTransform(m); return { x: p.x, y: p.y }; };
  // 2.5 figure units past the bottom-right corner along the diagonal: inside
  // a 5-unit edge, clear of the outline's own stroke.
  const edge = at(bb.x + bb.width + 2.5, bb.y + bb.height * 0.6);
  const paper = at(bb.x + bb.width + 40, bb.y - 30);
  return { chunk: chunk && chunk.dataset.chunkId, edge, paper };
});

async function readAt(page, id) {
  await page.evaluate((h) => { location.hash = '#' + h; }, id);
  await page.waitForTimeout(1200);
  const p = await probe(page);
  if (!p) return null;
  const one = async (pt) => pixel(await page.screenshot({ clip: { x: Math.round(pt.x), y: Math.round(pt.y), width: 1, height: 1 } }));
  return { edge: await one(p.edge), paper: await one(p.paper) };
}

export async function run({ page, report }) {
  const first = await probe(page);
  if (!report.ok(!!first && !!first.chunk, 'the deck has a figure box that stands on an edge')) return;

  const chrome = await readAt(page, first.chunk);
  report.ok(chrome && lum(chrome.edge) < lum(chrome.paper) - 20,
    'chromium paints the edge past the box corner', chrome && `edge ${chrome.edge} paper ${chrome.paper}`);

  let browser = null;
  try {
    browser = await webkit.launch();
  } catch (e) {
    report.note('webkit is not installed, so the WebKit half did not run - `npx playwright install webkit` brings it.');
    return;
  }
  try {
    const wk = await browser.newPage({ viewport: page.viewportSize() });
    await wk.goto(page.url().replace(/#.*$/, ''), { waitUntil: 'load' });
    await wk.waitForTimeout(700);
    const safari = await readAt(wk, first.chunk);
    report.ok(safari && lum(safari.edge) < lum(safari.paper) - 20,
      'webkit paints it too - the engine that ignored the drop-shadow filter', safari && `edge ${safari.edge} paper ${safari.paper}`);
    // Same colour in both, within what two rasterisers disagree about on an
    // anti-aliased mix: the edge is one colour, not one per engine.
    report.ok(chrome && safari && Math.abs(lum(chrome.edge) - lum(safari.edge)) < 12,
      'and in the same colour', chrome && safari && `${chrome.edge} / ${safari.edge}`);
  } finally {
    await browser.close();
  }
}
