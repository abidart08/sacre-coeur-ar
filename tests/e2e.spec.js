const { test, expect } = require('@playwright/test');

test('complete treasure hunt, persistence, AR bootstrap and printable markers', async ({ page }) => {
  const fatalErrors = [];
  page.on('pageerror', error => fatalErrors.push('pageerror: ' + error.message));
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error' && !/favicon|WebGL.*software/i.test(text)) {
      fatalErrors.push('console: ' + text);
    }
  });

  await page.goto('/?debug=1', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.AFRAME && window.SacreMarkers, null, { timeout: 30000 });
  await page.waitForFunction(() => AFRAME.primitives?.primitives?.['a-marker'] && document.getElementById('marker-1')?.object3D, null, { timeout: 30000 });

  const bootstrap = await page.evaluate(() => ({
    aframe: window.AFRAME && AFRAME.version,
    markers: [1,2,3].map(i => document.getElementById('marker-' + i)?.getAttribute('url')),
    hasScene: Boolean(document.querySelector('a-scene')),
    hasArjs: Boolean(document.querySelector('a-scene')?.getAttribute('arjs')),
    hasMarkerPrimitive: Boolean(AFRAME.primitives?.primitives?.['a-marker']),
    initializedMarkers: [1,2,3].every(i => Boolean(document.getElementById('marker-' + i)?.object3D))
  }));

  expect(bootstrap.aframe).toBeTruthy();
  expect(bootstrap.hasScene).toBe(true);
  expect(bootstrap.hasArjs).toBe(true);
  expect(bootstrap.hasMarkerPrimitive).toBe(true);
  expect(bootstrap.initializedMarkers).toBe(true);
  for (const url of bootstrap.markers) expect(url).toMatch(/^blob:/);

  await expect(page.locator('#welcome')).toHaveClass(/visible/);
  await page.click('#start-button');
  await expect(page.locator('#welcome')).not.toHaveClass(/visible/);

  // Out-of-order markers must remain locked.
  await page.evaluate(() => document.getElementById('marker-2').dispatchEvent(new Event('markerFound')));
  await expect(page.locator('#progress-text')).toHaveText('0 / 3');
  await expect(page.locator('#scan-status')).toContainText('marcador 1');

  // Correct sequence.
  await page.evaluate(() => document.getElementById('marker-1').dispatchEvent(new Event('markerFound')));
  await expect(page.locator('#progress-text')).toHaveText('1 / 3');
  await expect(page.locator('#message-title')).toContainText('brújula');
  await page.click('#continue-button');

  await page.evaluate(() => document.getElementById('marker-2').dispatchEvent(new Event('markerFound')));
  await expect(page.locator('#progress-text')).toHaveText('2 / 3');
  await expect(page.locator('#message-title')).toContainText('llave');
  await page.click('#continue-button');

  await page.evaluate(() => document.getElementById('marker-3').dispatchEvent(new Event('markerFound')));
  await expect(page.locator('#progress-text')).toHaveText('3 / 3');
  await page.click('#continue-button');
  await expect(page.locator('#final-modal')).toHaveClass(/visible/);
  await expect(page.locator('.completion-code')).toContainText('SACRE-AR-2026');

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('sacreCoeurTreasureStateV1')));
  expect(stored.found).toEqual([true, true, true]);
  expect(stored.startedAt).toBeTruthy();
  expect(stored.completedAt).toBeTruthy();

  // Persistence after reload.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#progress-text')).toHaveText('3 / 3');
  await expect(page.locator('#welcome')).not.toHaveClass(/visible/);

  // Printable page uses the same shared marker source.
  await page.goto('/markers.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.getElementById('m1')?.width === 720);
  const canvases = await page.evaluate(() => [1,2,3].map(i => {
    const c = document.getElementById('m' + i);
    const ctx = c.getContext('2d');
    const black = ctx.getImageData(80, 50, 1, 1).data;
    const white = ctx.getImageData(150, 120, 1, 1).data;
    return { width: c.width, height: c.height, black: [...black], white: [...white] };
  }));
  for (const c of canvases) {
    expect(c.width).toBe(720);
    expect(c.height).toBe(820);
    expect(c.black[0]).toBeLessThan(10);
  }

  expect(fatalErrors).toEqual([]);
});
