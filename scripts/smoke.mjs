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
  assert.equal(await desktop.locator('#journalEntries .journal-entry:disabled').count(), 9);
  await desktop.getByRole('button', { name: 'Voltar à água' }).click();
  await desktop.keyboard.press('l');
  assert.equal(await desktop.locator('#lanternButton').getAttribute('aria-pressed'), 'true');
  await desktop.keyboard.press('m');
  assert.equal(await desktop.locator('#audioButton').getAttribute('aria-pressed'), 'true');
  await desktop.keyboard.press('e');
  assert.match(await desktop.locator('#distanceLabel').innerText(), /Pulso emitido/);
  await desktop.waitForFunction(() => /Sinal a \d+ m/.test(document.querySelector('#sonarText').textContent));
  assert.match(await desktop.locator('#sonarReadout').innerText(), /Sinal a \d+ m/);
  await desktop.keyboard.down('w');
  try {
    await desktop.locator('#poiPrompt').waitFor({ state: 'visible', timeout: 20000 });
  } finally {
    await desktop.keyboard.up('w');
  }
  await desktop.screenshot({ path: 'preview-habitat-marker.png' });
  await desktop.keyboard.press('r');
  assert.equal(await desktop.locator('#poiDialog').isVisible(), true);
  assert.match(await desktop.locator('#poiTitle').innerText(), /Abrolhos/);
  assert.match(await desktop.locator('#poiSource').getAttribute('href'), /icmbio/);
  await desktop.screenshot({ path: 'preview-habitat.png' });
  await desktop.getByRole('button', { name: 'Continuar explorando' }).click();
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
  assert.match(await desktop.locator('#speciesBehavior').innerText(), /Patrulha/);
  await desktop.screenshot({ path: 'preview-species.png' });
  await desktop.getByRole('button', { name: 'Fechar ficha' }).click();
  await desktop.keyboard.press('p');
  await desktop.waitForFunction(() => document.querySelector('#photoCount').textContent.startsWith('1'), null, { timeout: 15000 });
  assert.match(await desktop.locator('#photoToast').innerText(), /Fotografia de Sargento registrada/);
  await desktop.keyboard.press('f');
  assert.equal(await desktop.locator('#speciesDialog').isVisible(), true);
  await desktop.getByRole('button', { name: 'Fechar ficha' }).click();
  await desktop.locator('#ocean').click({ position: { x: 720, y: 450 } });
  assert.equal(await desktop.locator('#speciesDialog').isVisible(), true, 'A found fish can be selected in the scene');
  await desktop.getByRole('button', { name: 'Fechar ficha' }).click();
  await desktop.keyboard.press('g');
  assert.equal(await desktop.locator('#journalEntries .journal-entry.is-found').count(), 1);
  assert.equal(await desktop.locator('#photoEntries .has-photo').count(), 1);
  assert.equal(await desktop.locator('#habitatEntries .is-found').count(), 1);
  await desktop.locator('#journalEntries .journal-entry.is-found').click();
  assert.equal(await desktop.locator('#speciesScientific').innerText(), 'Abudefduf saxatilis');
  await desktop.getByRole('button', { name: 'Voltar ao diário' }).click();
  await desktop.locator('#journalDialog').waitFor({ state: 'visible' });
  await desktop.getByRole('button', { name: 'Fotos', exact: true }).click();
  await desktop.screenshot({ path: 'preview-journal.png' });
  await desktop.locator('#photoEntries .has-photo').click();
  assert.equal(await desktop.locator('#photoDialog').isVisible(), true);
  assert.ok(await desktop.locator('#photoPreview').evaluate(image => image.complete && image.naturalWidth > 0));
  assert.match(await desktop.locator('#photoDownload').getAttribute('href'), /^data:image\/jpeg;base64,/);
  await desktop.screenshot({ path: 'preview-photo.png' });
  await desktop.getByRole('button', { name: 'Voltar ao diário' }).click();
  await desktop.locator('#journalDialog').waitFor({ state: 'visible' });
  await desktop.getByRole('button', { name: 'Habitats', exact: true }).click();
  await desktop.locator('#habitatEntries .is-found').click();
  assert.match(await desktop.locator('#poiTitle').innerText(), /Abrolhos/);
  await desktop.getByRole('button', { name: 'Voltar ao diário' }).click();
  await desktop.locator('#journalDialog').waitFor({ state: 'visible' });
  await desktop.getByRole('button', { name: 'Voltar à água' }).click();
  await desktop.screenshot({ path: 'preview-playing.png' });
  await desktop.reload({ waitUntil: 'networkidle' });
  await desktop.getByRole('button', { name: 'Começar a explorar' }).click();
  assert.equal(await desktop.locator('#foundCount').innerText(), '1');
  await desktop.keyboard.press('g');
  assert.equal(await desktop.locator('#photoEntries .has-photo').count(), 1);
  assert.equal(await desktop.locator('#habitatEntries .is-found').count(), 1);
  await desktop.getByRole('button', { name: 'Voltar à água' }).click();
  await desktop.keyboard.down('s');
  try {
    await desktop.locator('#glassNotice').waitFor({ state: 'visible', timeout: 30000 });
  } finally {
    await desktop.keyboard.up('s');
  }
  await desktop.screenshot({ path: 'preview-glass.png' });

  const touch = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  touch.on('pageerror', error => errors.push(error.message));
  await touch.goto(url, { waitUntil: 'networkidle' });
  await touch.getByRole('button', { name: 'Começar a explorar' }).click();
  assert.equal(await touch.locator('#mobileControls').isVisible(), true);
  assert.equal(await touch.getByRole('button', { name: 'Fotografar peixe' }).isVisible(), true);
  await touch.getByRole('button', { name: 'Emitir pulso' }).click();
  assert.match(await touch.locator('#distanceLabel').innerText(), /Pulso emitido/);
  await touch.getByRole('button', { name: 'Ligar lanterna' }).click();
  assert.equal(await touch.locator('#mobileLantern').getAttribute('aria-pressed'), 'true');
  await touch.getByRole('button', { name: 'Ativar som ambiente' }).click();
  assert.equal(await touch.locator('#audioButton').getAttribute('aria-pressed'), 'true');
  await touch.locator('#journalButton').click();
  assert.equal(await touch.locator('#journalDialog').isVisible(), true);
  await touch.getByRole('button', { name: 'Voltar à água' }).click();
  await touch.screenshot({ path: 'preview-touch.png' });
  await touch.getByRole('button', { name: 'Fotografar peixe' }).click();
  await touch.waitForFunction(() => document.querySelector('#photoCount').textContent.startsWith('1'), null, { timeout: 15000 });
  assert.equal(await touch.locator('#speciesDialog').isVisible(), true);
  await touch.getByRole('button', { name: 'Fechar ficha' }).click();
  await touch.locator('#journalButton').click();
  await touch.getByRole('button', { name: 'Fotos', exact: true }).click();
  assert.equal(await touch.locator('#photoEntries .has-photo').count(), 1);
  assert.deepEqual(errors, []);
  console.log('Smoke test passed: photo capture and album, saved progress, habitats, audio, glass contact, fish discovery and mobile controls.');
} finally {
  await browser.close();
  await server.close();
}
