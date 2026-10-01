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
  assert.equal(await desktop.locator('#journalButton').isVisible(), true);
  await desktop.keyboard.press('g');
  assert.equal(await desktop.locator('#journalDialog').isVisible(), true);
  assert.equal(await desktop.locator('.journal-entry:disabled').count(), 5);
  await desktop.getByRole('button', { name: 'Voltar à água' }).click();
  await desktop.keyboard.press('l');
  assert.equal(await desktop.locator('#lanternButton').getAttribute('aria-pressed'), 'true');
  await desktop.keyboard.press('e');
  assert.match(await desktop.locator('#distanceLabel').innerText(), /Pulso emitido/);
  assert.match(await desktop.locator('#sonarReadout').innerText(), /Sinal a \d+ m/);
  await desktop.keyboard.down('w');
  try {
    await desktop.waitForFunction(() => Number(document.querySelector('#foundCount').textContent) >= 1, null, { timeout: 20000 });
  } finally {
    await desktop.keyboard.up('w');
  }
  assert.ok(Number(await desktop.locator('#foundCount').innerText()) >= 1, 'First fish should be discoverable by swimming near it');
  assert.equal(await desktop.locator('#speciesDialog').isVisible(), true);
  assert.equal(await desktop.locator('#speciesScientific').innerText(), 'Abudefduf saxatilis');
  assert.match(await desktop.locator('#speciesPlace').innerText(), /Litoral brasileiro/);
  await desktop.screenshot({ path: 'preview-species.png' });
  await desktop.getByRole('button', { name: 'Fechar ficha' }).click();
  await desktop.keyboard.press('f');
  assert.equal(await desktop.locator('#speciesDialog').isVisible(), true);
  await desktop.getByRole('button', { name: 'Fechar ficha' }).click();
  await desktop.locator('#ocean').click({ position: { x: 720, y: 450 } });
  assert.equal(await desktop.locator('#speciesDialog').isVisible(), true, 'A found fish can be selected in the scene');
  await desktop.getByRole('button', { name: 'Fechar ficha' }).click();
  await desktop.keyboard.press('g');
  assert.equal(await desktop.locator('.journal-entry.is-found').count(), 1);
  await desktop.locator('.journal-entry.is-found').click();
  assert.equal(await desktop.locator('#speciesScientific').innerText(), 'Abudefduf saxatilis');
  await desktop.getByRole('button', { name: 'Voltar ao diário' }).click();
  assert.equal(await desktop.locator('#journalDialog').isVisible(), true);
  await desktop.getByRole('button', { name: 'Voltar à água' }).click();
  await desktop.screenshot({ path: 'preview-playing.png' });

  const touch = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  touch.on('pageerror', error => errors.push(error.message));
  await touch.goto(url, { waitUntil: 'networkidle' });
  await touch.getByRole('button', { name: 'Começar a explorar' }).click();
  assert.equal(await touch.locator('#mobileControls').isVisible(), true);
  await touch.getByRole('button', { name: 'Emitir pulso' }).click();
  assert.match(await touch.locator('#distanceLabel').innerText(), /Pulso emitido/);
  await touch.getByRole('button', { name: 'Ligar lanterna' }).click();
  assert.equal(await touch.locator('#mobileLantern').getAttribute('aria-pressed'), 'true');
  await touch.locator('#journalButton').click();
  assert.equal(await touch.locator('#journalDialog').isVisible(), true);
  await touch.getByRole('button', { name: 'Voltar à água' }).click();
  await touch.screenshot({ path: 'preview-touch.png' });
  assert.deepEqual(errors, []);
  console.log('Smoke test passed: dome rendering, sonar, swimming discovery, journal revisit, lantern and mobile controls.');
} finally {
  await browser.close();
  await server.close();
}
