import { chromium } from '/Users/yin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const browser = await chromium.launch({ headless: true });
const results = [];

for (const viewport of [
  { width: 390, height: 844 },
  { width: 320, height: 568 },
]) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('game_locale', 'en');
  });
  await page.goto('http://127.0.0.1:4177/_qa/platform-harness.html?catch_after=2', {
    waitUntil: 'networkidle',
  });
  const game = page.frames().find((frame) => frame !== page.mainFrame());
  await game.waitForSelector('.vr-world.is-ready');

  const initial = await game.evaluate(() => ({
    hud: document.querySelector('#hud-label')?.textContent?.trim(),
    mission: document.querySelector('#mission')?.textContent?.trim(),
    targetMode: document.querySelector('#mode-title')?.textContent?.trim(),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  await game.locator('#cast').click();
  await game.waitForSelector('.vr-shop.is-visible');
  await page.waitForTimeout(320);
  initial.modeVisible = await game.locator('#mode-toggle').isVisible();
  await page.screenshot({
    path: `_qa/ui/endless-default-shop-${viewport.width}x${viewport.height}.png`,
  });
  await game.locator('#shop-close').click();
  await game.waitForSelector('.vr-shop:not(.is-visible)');

  await game.locator('#world').click({ position: { x: viewport.width / 2, y: viewport.height / 2 } });
  await game.waitForSelector('.vr-result.is-visible', { timeout: 12000 });
  await page.waitForFunction(() =>
    window.__qaRequests?.some((request) => request.url.includes('/rank/score/save')),
  );

  const final = await game.evaluate(() => ({
    eyebrow: document.querySelector('#result-eyebrow')?.textContent?.trim(),
    distance: Number(document.querySelector('#result-distance')?.textContent || 0),
    replay: document.querySelector('#replay')?.textContent?.trim(),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  const rankSaves = await page.evaluate(() =>
    window.__qaRequests.filter((request) => request.url.includes('/rank/score/save')).length,
  );

  await page.screenshot({
    path: `_qa/ui/endless-default-result-${viewport.width}x${viewport.height}.png`,
  });
  results.push({ viewport, initial, final, rankSaves });
  await page.close();
}

const campaignPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
await campaignPage.addInitScript(() => {
  localStorage.clear();
  localStorage.setItem('game_locale', 'en');
});
await campaignPage.goto(
  'http://127.0.0.1:4177/_qa/platform-harness.html?mode=campaign&stage_duration=1&stage_carrots=0',
  { waitUntil: 'networkidle' },
);
const campaignGame = campaignPage.frames().find((frame) => frame !== campaignPage.mainFrame());
await campaignGame.waitForSelector('.vr-world.is-ready');
const campaignInitial = await campaignGame.evaluate(() => ({
  hud: document.querySelector('#hud-label')?.textContent?.trim(),
  mission: document.querySelector('#mission')?.textContent?.trim(),
  targetMode: document.querySelector('#mode-title')?.textContent?.trim(),
}));
await campaignGame.locator('#cast').click();
await campaignGame.waitForSelector('.vr-shop.is-visible');
campaignInitial.modeVisible = await campaignGame.locator('#mode-toggle').isVisible();
await campaignGame.locator('#shop-close').click();
await campaignGame.waitForSelector('.vr-shop:not(.is-visible)');
await campaignGame.locator('#world').click({ position: { x: 195, y: 430 } });
await campaignGame.waitForSelector('.vr-result.is-visible', { timeout: 12000 });
await campaignPage.waitForTimeout(500);
const campaignRankSaves = await campaignPage.evaluate(() =>
  window.__qaRequests.filter((request) => request.url.includes('/rank/score/save')).length,
);
const campaignFinal = await campaignGame.evaluate(() => ({
  eyebrow: document.querySelector('#result-eyebrow')?.textContent?.trim(),
  replay: document.querySelector('#replay')?.textContent?.trim(),
}));
results.push({ campaign: true, initial: campaignInitial, final: campaignFinal, rankSaves: campaignRankSaves });
await campaignPage.close();

console.log(JSON.stringify(results, null, 2));
await browser.close();
