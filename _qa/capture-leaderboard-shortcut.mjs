import { chromium } from '/Users/yin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const browser = await chromium.launch({ headless: true });
const results = [];

for (const viewport of [
  { width: 390, height: 844 },
  { width: 320, height: 568 },
]) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  await page.addInitScript(() => localStorage.setItem('game_locale', 'zh'));
  await page.goto('http://127.0.0.1:4177/_qa/platform-harness.html', { waitUntil: 'networkidle' });
  const game = page.frames().find((frame) => frame !== page.mainFrame());
  await game.waitForSelector('.vr-world.is-ready');
  await game.evaluate(() => {
    document.querySelector('#alteru-guest-login')?.remove();
    document.querySelector('#alteru-guest-banner')?.remove();
  });

  const shortcut = game.locator('#leaders-shortcut');
  await game.locator('#world').click({ position: { x: viewport.width / 2, y: viewport.height / 2 } });
  await game.waitForFunction(() => Number(document.querySelector('#distance')?.textContent || 0) > 0);
  await shortcut.click();
  await game.waitForSelector('.vr-leaderboard.is-visible .vr-leaderboard__row');
  await page.waitForTimeout(320);
  const pausedDistance = await game.locator('#distance').textContent();
  await page.waitForTimeout(450);
  const pausedDistanceAfter = await game.locator('#distance').textContent();

  const metrics = await game.evaluate(() => ({
    rows: document.querySelectorAll('.vr-leaderboard__row').length,
    selfRows: document.querySelectorAll('.vr-leaderboard__row.is-self').length,
    shortcutVisible: getComputedStyle(document.querySelector('#leaders-shortcut')).display !== 'none',
    isCampaign: document.querySelector('#hud-label')?.textContent?.includes('关'),
    overlayOpen: document.querySelector('#leaderboard')?.classList.contains('is-visible'),
    pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));

  await page.screenshot({
    path: `_qa/ui/leaderboard-shortcut-${viewport.width}x${viewport.height}.png`,
  });
  results.push({
    viewport,
    ...metrics,
    pausedDistance,
    pausedDistanceAfter,
    paused: pausedDistance === pausedDistanceAfter,
  });
  await page.close();
}

console.log(JSON.stringify(results, null, 2));
await browser.close();
