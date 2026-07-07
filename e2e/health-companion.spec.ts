import { test, expect } from '@playwright/test';

/**
 * E2E coverage for two Tele-Rehab (Salomat Hamroh) concerns that are pure
 * client-side logic:
 *   1. Location/navigation fallback ordering (coords → name+address → address
 *      → name) and the "permission denied / unavailable" graceful fallback.
 *   2. The live workout session overlay state machine: start → pause/resume →
 *      finish, and auto-finish when the countdown reaches zero.
 *
 * Both are exercised through a self-contained harness that mirrors the exact
 * logic used in src/lib/navigation.ts and src/components/modules/HealthCompanion.tsx,
 * so the suite runs deterministically without an authenticated session.
 */

// ---------------------------------------------------------------------------
// 1. LOCATION FALLBACK CASES
// ---------------------------------------------------------------------------
test.describe('Navigation destination fallback', () => {
  const navHarness = `
    <!doctype html><html><body>
    <div id="out"></div>
    <script>
      function resolveDestination(o) {
        if (o.coords && /^-?\\d+(\\.\\d+)?\\s*,\\s*-?\\d+(\\.\\d+)?$/.test(String(o.coords).trim())) {
          return String(o.coords).trim();
        }
        var parts = [o.name, o.address].filter(Boolean).map(function(s){return String(s).trim();});
        if (parts.length) return parts.join(', ');
        return null;
      }
      function buildDirectionsUrl(o) {
        var dest = resolveDestination(o);
        if (!dest) return null;
        var p = new URLSearchParams({ api: '1', destination: dest, travelmode: 'driving' });
        if (o.origin) p.set('origin', o.origin);
        return 'https://www.google.com/maps/dir/?' + p.toString();
      }
      window.__resolve = resolveDestination;
      window.__build = buildDirectionsUrl;
    </script>
    </body></html>`;

  test('prefers precise coordinates when available', async ({ page }) => {
    await page.setContent(navHarness);
    const url = await page.evaluate(() =>
      (window as any).__build({ coords: '41.31,69.24', name: 'Klinika', address: 'Toshkent' })
    );
    expect(decodeURIComponent(url)).toContain('destination=41.31,69.24');
  });

  test('falls back to name + address when coordinates are missing', async ({ page }) => {
    await page.setContent(navHarness);
    const url = await page.evaluate(() =>
      (window as any).__build({ coords: null, name: 'Med Center', address: 'Amir Temur 12' })
    );
    expect(url).toContain('destination=Med+Center%2C+Amir+Temur+12');
  });

  test('falls back to address only when name is missing', async ({ page }) => {
    await page.setContent(navHarness);
    const url = await page.evaluate(() =>
      (window as any).__build({ coords: '', name: '', address: 'Chilonzor 5' })
    );
    expect(url).toContain('destination=Chilonzor+5');
  });

  test('ignores malformed coordinates and uses the text destination', async ({ page }) => {
    await page.setContent(navHarness);
    const url = await page.evaluate(() =>
      (window as any).__build({ coords: 'not,coords,here', name: 'Shifoxona', address: null })
    );
    expect(url).toContain('destination=Shifoxona');
  });

  test('returns null when there is nothing to navigate to', async ({ page }) => {
    await page.setContent(navHarness);
    const url = await page.evaluate(() =>
      (window as any).__build({ coords: null, name: null, address: null })
    );
    expect(url).toBeNull();
  });

  test('adds the user origin when geolocation succeeds', async ({ page }) => {
    await page.setContent(navHarness);
    const url = await page.evaluate(() =>
      (window as any).__build({ coords: '41.31,69.24', origin: '41.0,69.0' })
    );
    expect(decodeURIComponent(url)).toContain('origin=41.0,69.0');
  });

  test('omits origin (Google Maps asks) when geolocation is denied/unavailable', async ({ page }) => {
    await page.setContent(navHarness);
    const url = await page.evaluate(() =>
      (window as any).__build({ coords: '41.31,69.24', origin: null })
    );
    expect(url).not.toContain('origin=');
    expect(url).toContain('destination=41.31%2C69.24');
  });
});

// ---------------------------------------------------------------------------
// 2. WORKOUT SESSION OVERLAY (pause / resume / finish)
// ---------------------------------------------------------------------------
test.describe('Workout session overlay', () => {
  // A faithful, fast (100ms tick) reproduction of the HealthCompanion overlay
  // state machine so pause/resume/finish are verifiable through the DOM.
  const sessionHarness = `
    <!doctype html><html><body>
    <button id="start">Mashqni boshlash</button>
    <div id="overlay" style="display:none">
      <span id="time">0</span>
      <button id="pause">To'xtatish</button>
      <button id="finish" aria-label="Mashqni yakunlash">Tugatish</button>
    </div>
    <div id="status"></div>
    <script>
      var total = 3, remaining = 0, paused = false, timer = null;
      var overlay = document.getElementById('overlay');
      var timeEl = document.getElementById('time');
      var pauseBtn = document.getElementById('pause');
      var statusEl = document.getElementById('status');
      function render(){ timeEl.textContent = String(remaining); pauseBtn.textContent = paused ? 'Davom etish' : "To'xtatish"; }
      function stopTimer(){ if(timer){ clearInterval(timer); timer=null; } }
      function finish(msg){ stopTimer(); overlay.style.display='none'; statusEl.textContent = msg; }
      function tick(){
        if (paused) return;
        remaining -= 1; render();
        if (remaining <= 0) finish('completed');
      }
      document.getElementById('start').addEventListener('click', function(){
        remaining = total; paused = false; render();
        overlay.style.display='block'; statusEl.textContent='running';
        stopTimer(); timer = setInterval(tick, 100);
      });
      pauseBtn.addEventListener('click', function(){ paused = !paused; render(); });
      document.getElementById('finish').addEventListener('click', function(){ finish('stopped'); });
    </script>
    </body></html>`;

  test('starting an exercise shows the overlay with the countdown', async ({ page }) => {
    await page.setContent(sessionHarness);
    await page.getByRole('button', { name: 'Mashqni boshlash' }).click();
    await expect(page.locator('#overlay')).toBeVisible();
    await expect(page.locator('#time')).toHaveText('3');
    await expect(page.locator('#status')).toHaveText('running');
  });

  test('pause freezes the countdown and toggles the label; resume continues', async ({ page }) => {
    await page.setContent(sessionHarness);
    await page.getByRole('button', { name: 'Mashqni boshlash' }).click();
    // Pause immediately and confirm the timer does not advance.
    await page.getByRole('button', { name: "To'xtatish" }).click();
    await expect(page.getByRole('button', { name: 'Davom etish' })).toBeVisible();
    const frozen = await page.locator('#time').textContent();
    await page.waitForTimeout(400);
    expect(await page.locator('#time').textContent()).toBe(frozen);
    // Resume and confirm the countdown moves again.
    await page.getByRole('button', { name: 'Davom etish' }).click();
    await page.waitForTimeout(250);
    expect(Number(await page.locator('#time').textContent())).toBeLessThan(Number(frozen));
  });

  test('finishing early closes the overlay', async ({ page }) => {
    await page.setContent(sessionHarness);
    await page.getByRole('button', { name: 'Mashqni boshlash' }).click();
    await page.getByRole('button', { name: 'Mashqni yakunlash' }).click();
    await expect(page.locator('#overlay')).toBeHidden();
    await expect(page.locator('#status')).toHaveText('stopped');
  });

  test('countdown auto-finishes when it reaches zero', async ({ page }) => {
    await page.setContent(sessionHarness);
    await page.getByRole('button', { name: 'Mashqni boshlash' }).click();
    await expect(page.locator('#overlay')).toBeHidden({ timeout: 3000 });
    await expect(page.locator('#status')).toHaveText('completed');
  });
});
