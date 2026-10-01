import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const server = await createServer({ server: { host: '127.0.0.1', port: 5174 } });
await server.listen();
const url = `http://127.0.0.1:${server.httpServer.address().port}/`;
const browser = await chromium.launch({
  channel: 'msedge',
  headless: true,
  args: ['--enable-webgl', '--use-gl=swiftshader', '--disable-gpu-sandbox'],
});
const errors = [];
try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  desktop.on('pageerror', error => errors.push(error.message));
  await desktop.goto(url, { waitUntil: 'networkidle' });
  await desktop.getByRole('heading', { name: /O oceano acorda à noite/ }).waitFor();
  assert.equal(await desktop.locator('#fallback').isVisible(), false);
  await desktop.getByRole('button', { name: 'Começar a explorar' }).click();
  assert.equal(await desktop.locator('#hud').isVisible(), true);
  await desktop.keyboard.press('e');
  assert.match(await desktop.locator('#distanceLabel').innerText(), /Pulso emitido/);
  await desktop.keyboard.down('w');
  await desktop.waitForTimeout(4800);
  await desktop.keyboard.up('w');
  await desktop.waitForTimeout(250);
  assert.ok(Number(await desktop.locator('#foundCount').innerText()) >= 1, 'First fish should be discoverable by swimming near it');
  assert.equal(await desktop.locator('#speciesDialog').isVisible(), true);
  assert.equal(await desktop.locator('#speciesScientific').innerText(), 'Abudefduf saxatilis');
  assert.match(await desktop.locator('#speciesPlace').innerText(), /Litoral brasileiro/);
  await desktop.screenshot({ path: 'preview-species.png' });
  await desktop.getByRole('button', { name: 'Fechar ficha' }).click();
  await desktop.keyboard.press('f');
  assert.equal(await desktop.locator('#speciesDialog').isVisible(), true);
  await desktop.getByRole('button', { name: 'Fechar ficha' }).click();
  await desktop.screenshot({ path: 'preview-playing.png' });

  const touch = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  touch.on('pageerror', error => errors.push(error.message));
  await touch.goto(url, { waitUntil: 'networkidle' });
  await touch.getByRole('button', { name: 'Começar a explorar' }).click();
  assert.equal(await touch.locator('#mobileControls').isVisible(), true);
  await touch.getByRole('button', { name: 'Emitir pulso' }).click();
  assert.match(await touch.locator('#distanceLabel').innerText(), /Pulso emitido/);
  await touch.screenshot({ path: 'preview-touch.png' });
  assert.deepEqual(errors, []);
  console.log('Smoke test passed: rendering, start, pulse, swimming discovery, species information, mobile controls.');
} finally {
  await browser.close();
  await server.close();
}
