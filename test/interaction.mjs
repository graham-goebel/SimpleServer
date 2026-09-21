/**
 * End-to-end check of the gallery's interactions.
 *
 *   ./serve.py 8765 &          # the site has to be served, not opened as a file
 *   node test/interaction.mjs  # needs playwright: npm i -D playwright
 *
 * Point it somewhere else with BASE=http://localhost:3000 node test/interaction.mjs
 */
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

/** Take Playwright from the project, or from a global install via NODE_PATH. */
async function loadChromium() {
  const pick = (mod) => mod.chromium ?? mod.default?.chromium;
  try {
    return pick(await import('playwright'));
  } catch { /* not a local dependency — try the require resolver */ }
  try {
    const resolved = createRequire(import.meta.url).resolve('playwright');
    return pick(await import(pathToFileURL(resolved).href));
  } catch {
    console.error('This check needs Playwright:  npm i -D playwright && npx playwright install chromium');
    process.exit(2);
  }
}

const chromium = await loadChromium();
const BASE = process.env.BASE ?? 'http://localhost:8765';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));

const ok = [];
const check = (name, pass, extra = '') => ok.push(`${pass ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`);

await page.goto(BASE, { waitUntil: 'networkidle' });

check('ten frames hang on the wall', (await page.locator('.frame').count()) === 10);
check('all artwork loads', await page.evaluate(() =>
  [...document.images].every((i) => i.complete && i.naturalWidth > 0)));

// --- focus mode -----------------------------------------------------------
await page.click('#frame-juan');
await page.waitForTimeout(800);
check('room enters focus mode', await page.locator('#room').evaluate((e) => e.classList.contains('is-focused')));
check('panel names the print', (await page.locator('#panel-title').textContent()) === 'JUAN');
check('deep link written to url', page.url().endsWith('#juan'), page.url());
check('other frames leave the tab order', await page.evaluate(() =>
  [...document.querySelectorAll('.frame:not(.is-active)')].every((f) => f.tabIndex === -1)));
check('focus moved into the panel', await page.evaluate(() => document.activeElement?.id === 'panel-close'));

// the focused print should fill the space left of the panel, not overflow it
const geo = await page.evaluate(() => {
  const b = document.querySelector('.frame.is-active').getBoundingClientRect();
  const bar = document.querySelector('.topbar').offsetHeight;
  const panel = document.querySelector('#panel').offsetWidth;
  return { b: { l: b.left, r: b.right, t: b.top, bot: b.bottom }, bar, free: innerWidth - panel, vh: innerHeight };
});
check('focused print clears the top bar', geo.b.t >= geo.bar - 1, `top ${geo.b.t.toFixed(0)} vs bar ${geo.bar}`);
check('focused print stays clear of the panel', geo.b.r <= geo.free + 1, `right ${geo.b.r.toFixed(0)} vs free ${geo.free}`);
check('focused print fits the viewport', geo.b.l >= -1 && geo.b.bot <= geo.vh + 1);

// --- options change the price --------------------------------------------
const base = await page.locator('#panel-price').textContent();
await page.locator('#size-options input[value="l"]').check();
await page.locator('#frame-options input[value="oak"]').check();
const upsized = await page.locator('#panel-price').textContent();
check('price responds to size and framing', base !== upsized, `${base} -> ${upsized}`);

// --- arrow keys walk the wall --------------------------------------------
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(700);
check('arrow key steps to the next print', (await page.locator('#panel-title').textContent()) === 'Garden State Interchange');
check('options reset for the new print', (await page.locator('#size-options input[value="s"]').isChecked()));

// --- cart -----------------------------------------------------------------
await page.click('#add-to-cart');
await page.waitForTimeout(200);
await page.locator('#size-options input[value="m"]').check();
await page.click('#add-to-cart');
await page.waitForTimeout(200);
check('two distinct lines in the cart', (await page.locator('#cart-count').textContent()) === '2');
await page.click('#add-to-cart');
await page.waitForTimeout(200);
check('same option set stacks as quantity', (await page.locator('#cart-count').textContent()) === '3');

await page.click('#cart-button');
await page.waitForTimeout(500);
check('cart lists both option sets', (await page.locator('.cart__item').count()) === 2);
const total = await page.locator('#cart-total').textContent();
await page.locator('.cart__item').first().locator('[data-step="1"]').click();
await page.waitForTimeout(150);
check('quantity stepper updates the subtotal', (await page.locator('#cart-total').textContent()) !== total);
await page.locator('.cart__item').first().locator('.cart__remove').click();
await page.waitForTimeout(150);
check('remove drops the line', (await page.locator('.cart__item').count()) === 1);

// --- escape, and the cart survives a reload -------------------------------
await page.keyboard.press('Escape');
await page.waitForTimeout(500);
check('escape closes the cart', !(await page.locator('#cart').evaluate((e) => e.classList.contains('is-open'))));
await page.keyboard.press('Escape');
await page.waitForTimeout(700);
check('escape then leaves focus mode', !(await page.locator('#room').evaluate((e) => e.classList.contains('is-focused'))));
check('frames are tabbable again', await page.evaluate(() =>
  [...document.querySelectorAll('.frame')].every((f) => f.tabIndex === 0)));
check('page scroll unlocked', await page.evaluate(() => !document.body.classList.contains('is-locked')));

const before = await page.locator('#cart-count').textContent();
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(400);
check('cart survives a reload', (await page.locator('#cart-count').textContent()) === before);

// --- deep link ------------------------------------------------------------
await page.goto(`${BASE}/#monument`, { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
check('deep link opens that print', (await page.locator('#panel-title').textContent()) === 'Monument, 4:12 AM');

// --- keyboard only --------------------------------------------------------
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.keyboard.press('Tab'); // skip link
await page.keyboard.press('Tab'); // lightswitch
await page.keyboard.press('Tab'); // cart
await page.keyboard.press('Tab'); // first frame
check('a frame is reachable by keyboard', await page.evaluate(() => document.activeElement?.classList.contains('frame')));
await page.keyboard.press('Enter');
await page.waitForTimeout(700);
check('enter opens the print', await page.locator('#panel').evaluate((e) => e.classList.contains('is-open')));

console.log(ok.join('\n'));
console.log('\nconsole/page errors:', errs.length ? errs : 'none');
console.log(ok.some((l) => l.startsWith('FAIL')) ? '\nSOME CHECKS FAILED' : '\nall checks passed');
await browser.close();
process.exit(ok.some((l) => l.startsWith('FAIL')) ? 1 : 0);
