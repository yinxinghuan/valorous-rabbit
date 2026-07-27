import { chromium } from '/Users/yin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const browser = await chromium.launch({ headless: true });
const results = [];

for (const viewport of [
  { width: 390, height: 844 },
  { width: 320, height: 568 },
]) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  await page.addInitScript(() => {
    localStorage.setItem('game_locale', 'zh');
    localStorage.setItem('valorous_rabbit_cast_v1', JSON.stringify({
      stage: 53,
      wallet: 820,
      unlocked: ['original/rabbit', 'people/shopkeeper', 'people/granny'],
      selected: 'original/rabbit',
      _lastActive: Date.now(),
    }));
  });
  await page.goto('http://127.0.0.1:4177/?stage_duration=99&mode=endless', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    document.querySelector('#alteru-guest-login')?.remove();
    document.querySelector('#alteru-guest-banner')?.remove();
  });
  await page.waitForSelector('.vr-world.is-ready');
  await page.screenshot({
    path: `_qa/ui/refined-hud-${viewport.width}x${viewport.height}.png`,
  });
  await page.locator('#cast').click();
  await page.waitForSelector('.vr-shop.is-visible');
  await page.waitForTimeout(320);
  await page.screenshot({
    path: `_qa/ui/refined-shop-top-${viewport.width}x${viewport.height}.png`,
  });
  const metrics = await page.evaluate(() => {
    const panel = document.querySelector('.vr-shop__panel').getBoundingClientRect();
    const grid = document.querySelector('.vr-shop__grid');
    const rabbit = document.querySelector('[data-character-key="original/rabbit"] img');
    return {
      cards: grid.children.length,
      viewport: [window.innerWidth, window.innerHeight],
      panel: { top: panel.top, right: panel.right, bottom: panel.bottom, left: panel.left },
      scrollHeight: grid.scrollHeight,
      clientHeight: grid.clientHeight,
      rabbitSrc: rabbit?.getAttribute('src'),
      rabbitNatural: rabbit ? [rabbit.naturalWidth, rabbit.naturalHeight] : null,
      pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  const bottomMetrics = await page.evaluate(() => {
    const grid = document.querySelector('.vr-shop__grid');
    grid.scrollTop = grid.scrollHeight;
    return {
      windowScrollY: window.scrollY,
      gridScrollTop: grid.scrollTop,
      headerTop: document.querySelector('.vr-shop__header').getBoundingClientRect().top,
    };
  });
  await page.waitForTimeout(120);
  const purchaseMetrics = await page.evaluate(async () => {
    const grid = document.querySelector('.vr-shop__grid');
    const before = grid.scrollTop;
    document.querySelector('[data-character-key="animals/bear"]')?.click();
    await new Promise((resolve) => setTimeout(resolve, 120));
    return {
      before,
      after: grid.scrollTop,
      bearState: document.querySelector('[data-character-key="animals/bear"]')?.dataset.state,
      wallet: document.querySelector('#shop-wallet')?.textContent,
    };
  });
  await page.screenshot({
    path: `_qa/ui/refined-shop-bottom-${viewport.width}x${viewport.height}.png`,
  });
  results.push({ viewport, ...metrics, bottomMetrics, purchaseMetrics });
  await page.close();
}

console.log(JSON.stringify(results, null, 2));
await browser.close();
