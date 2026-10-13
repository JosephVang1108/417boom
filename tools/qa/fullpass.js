// Full QA pass: onboarding → mood → chat/prayer → Bible → Journey →
// settings. Screenshots every step, logs every error.
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const SHOTS = path.join(__dirname, 'shots');
fs.rmSync(SHOTS, { recursive: true, force: true });
fs.mkdirSync(SHOTS, { recursive: true });

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--mute-audio'],
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('[console] ' + m.text().slice(0, 250));
  });
  page.on('pageerror', (e) => errors.push('[pageerror] ' + String(e).slice(0, 250)));
  page.on('requestfailed', (r) => {
    if (!r.url().includes('favicon'))
      errors.push('[reqfail] ' + r.url().slice(0, 130) + ' ' + r.failure()?.errorText);
  });

  let n = 0;
  const shot = async (name) => {
    n++;
    await page.screenshot({ path: path.join(SHOTS, String(n).padStart(2, '0') + '-' + name + '.png') });
  };
  const vis = async () =>
    (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | ');
  const tap = async (re) => {
    const el = page.getByText(re).last();
    await el.click({ timeout: 4000, force: true });
    await page.waitForTimeout(1800);
  };

  await page.goto('http://127.0.0.1:8080/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3500);
  await shot('welcome');

  // --- Onboarding
  await tap(/^Come$/);
  await shot('disclosure');
  await tap(/I understand/);
  await shot('name');
  await page.locator('input').last().fill('Joseph');
  await page.waitForTimeout(400);
  await tap(/^Continue$/);
  await shot('after-name');
  console.log('AFTER NAME:', (await vis()).slice(0, 300));

  // season + hopes questions
  await tap(/^Grateful$/).catch(() => console.log('no season step'));
  await shot('season');
  await tap(/^Prayer$/).catch(() => console.log('no hopes step'));
  await tap(/^Continue$/).catch(() => {});
  await page.waitForTimeout(2500);
  await shot('after-questions');
  // dismiss anything else that still overlays (devotional, etc.)
  for (let i = 0; i < 4; i++) {
    const t = await vis();
    if (!/Continue|Begin|Later$|Amen/.test(t)) break;
    let done = false;
    for (const re of [/^(Continue|Begin|Start|Done|Amen)$/, /^(Later|Not now)$/]) {
      const el = page.getByText(re).last();
      if (await el.isVisible().catch(() => false)) {
        await el.click({ timeout: 2500, force: true }).then(() => (done = true)).catch(() => {});
        if (done) break;
      }
    }
    await page.waitForTimeout(2000);
    await shot('dismiss-' + i);
    if (!done) break;
  }
  console.log('MAIN SCREEN:', (await vis()).slice(0, 350));
  await shot('main');

  // --- Mood chip
  try {
    await tap(/Heavy$/);
    await page.waitForTimeout(6000);
    await shot('mood-heavy');
    console.log('AFTER MOOD:', (await vis()).slice(0, 400));
  } catch (e) {
    console.log('MOOD FAILED:', e.message.split('\n')[0]);
    await shot('mood-failed');
  }

  // --- Chat: ask for prayer
  try {
    const input = page.locator('input, textarea').last();
    await input.click({ timeout: 4000, force: true });
    await input.fill('Can you pray for my family?');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(6000);
    await shot('chat-prayer');
    console.log('AFTER PRAYER:', (await vis()).slice(-400));
  } catch (e) {
    console.log('CHAT FAILED:', e.message.split('\n')[0]);
    await shot('chat-failed');
  }

  // --- Bible tab
  try {
    await tap(/^Close$/).catch(() => {});
    await tap(/^Bible$/);
    await shot('bible');
    console.log('BIBLE:', (await vis()).slice(0, 300));
    await tap(/^Genesis$/).catch(() => {});
    await shot('bible-genesis');
  } catch (e) {
    console.log('BIBLE FAILED:', e.message.split('\n')[0]);
  }

  // --- Journey tab
  try {
    await tap(/^Close$/).catch(() => {});
    await tap(/^Close$/).catch(() => {});
    await tap(/^Journey$/);
    await page.waitForTimeout(2000);
    await shot('journey');
    console.log('JOURNEY:', (await vis()).slice(0, 500));
  } catch (e) {
    console.log('JOURNEY FAILED:', e.message.split('\n')[0]);
  }

  // --- Settings
  try {
    await tap(/⚙️/);
    await shot('settings');
    console.log('SETTINGS:', (await vis()).slice(0, 500));
  } catch (e) {
    console.log('SETTINGS FAILED:', e.message.split('\n')[0]);
  }

  console.log('\n--- errors (' + errors.length + ') ---');
  for (const e of errors.slice(0, 30)) console.log(e);
  await browser.close();
})().catch((e) => {
  console.error('DRIVER CRASH:', e);
  process.exit(1);
});
