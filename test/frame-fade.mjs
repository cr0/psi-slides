/*
 * The footer fade of an `identity:` frame, painted as paper - in WebKit too.
 *
 * The band under the last line of a framed slide fades to the paper, so a
 * long chunk scrolling under the footer does not run into the lecturer's
 * name. It was a colour gradient from `var(--paper)` to `transparent`, and
 * the paper is an oklch() colour: WebKit interpolates from it to transparent
 * black through grey, so Safari drew a smoky band across every framed slide
 * that Chrome never showed. It is a mask over a flat paper fill now, which
 * fades alpha alone.
 *
 * Read in pixels, on a slide whose content ends well above the band: there the
 * fade covers nothing but paper, so what it draws must BE the paper. WebKit
 * half optional, as in figure-edge.mjs.
 */
import { webkit } from 'playwright-core';
import { pixel, lum } from './figure-edge.mjs';

export const name = 'frame fade · paper, in chromium and webkit';
export const lecture = 'identity-frame';
export const view = 'audience';

// Every framed content slide, in order; read() takes the first one whose
// content, where the camera actually puts it, ends clear of the band.
const pick = (page) => page.evaluate(() =>
  [...document.querySelectorAll('.chunk[data-chunk-id]')]
    .filter(c => !['section', 'title', 'closing'].includes(c.dataset.tag))
    .map(c => c.dataset.chunkId));
const sample = (page, id) => page.evaluate((id) => {
  // The fade's own box, in px: its pseudo-element's used height. The grey
  // WebKit drew sits in the transition, between the solid lower 52 % and the
  // clear top, so the sample is three quarters of the way up it. (Read as a
  // custom property the height came back as the rem number, and the sample
  // landed on the solid foot, where old and new code both show paper - the
  // first draft of this spec passed against the bug.)
  const f = document.querySelector('#frame');
  const h = parseFloat(getComputedStyle(f, '::after').height) || 80;
  const band = { x: Math.round(innerWidth / 2), y: Math.round(innerHeight - h * 0.76) };
  const k = document.querySelector(`.chunk[data-chunk-id="${id}"] .chunk-content`);
  const clear = k && k.getBoundingClientRect().bottom < innerHeight - h - 8;
  return { clear, band, paper: { x: Math.round(innerWidth / 2), y: 12 } };
}, id);
async function read(page, ids) {
  for (const id of ids) {
    await page.evaluate((h) => { location.hash = '#' + h; }, id);
    await page.waitForTimeout(1200);
    const s = await sample(page, id);
    if (!s.clear) continue;
    const one = async (pt) => pixel(await page.screenshot({ clip: { ...pt, width: 1, height: 1 } }));
    return { id, band: await one(s.band), paper: await one(s.paper) };
  }
  return null;
}

export async function run({ page, report }) {
  const ids = await pick(page);
  const chrome = await read(page, ids);
  if (!report.ok(!!chrome, 'the deck has a framed slide whose content ends above the band')) return;
  report.ok(Math.abs(lum(chrome.band) - lum(chrome.paper)) < 4,
    'chromium: the band is the paper', `band ${chrome.band} paper ${chrome.paper}`);
  let browser;
  try { browser = await webkit.launch(); } catch {
    report.note('webkit is not installed, so the WebKit half did not run - `npx playwright install webkit` brings it.');
    return;
  }
  try {
    const wk = await browser.newPage({ viewport: page.viewportSize() });
    await wk.goto(page.url().replace(/#.*$/, ''), { waitUntil: 'load' });
    await wk.waitForTimeout(700);
    const safari = await read(wk, [chrome.id]);
    report.ok(safari && Math.abs(lum(safari.band) - lum(safari.paper)) < 4,
      'webkit: the band is the paper too, not a grey smoke across the slide', safari && `band ${safari.band} paper ${safari.paper}`);
  } finally { await browser.close(); }
}
