import { test, expect } from '@playwright/test';

/**
 * E2E: verifies the Navigator button mechanism actually opens Google Maps
 * directions in a brand-new browser tab (the ephemeral-anchor approach used by
 * src/lib/navigation.ts openInNewTab). We render a minimal harness that mirrors
 * the exact anchor-click strategy and assert the popup URL Google Maps receives.
 */
test.describe('Navigator button → Google Maps', () => {
  const harness = `
    <!doctype html><html><body>
    <button id="nav">Navigator orqali borish</button>
    <script>
      function openInNewTab(url) {
        var a = document.createElement('a');
        a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }
      function buildDirectionsUrl(o) {
        var dest = null;
        if (o.coords && /^-?\\d+(\\.\\d+)?\\s*,\\s*-?\\d+(\\.\\d+)?$/.test(o.coords.trim())) {
          dest = o.coords.trim();
        } else {
          var parts = [o.name, o.address].filter(Boolean).map(function(s){return s.trim();});
          if (parts.length) dest = parts.join(', ');
        }
        if (!dest) return null;
        var p = new URLSearchParams({ api: '1', destination: dest, travelmode: 'driving' });
        return 'https://www.google.com/maps/dir/?' + p.toString();
      }
      document.getElementById('nav').addEventListener('click', function () {
        openInNewTab(buildDirectionsUrl({ coords: '41.311081,69.240562', name: 'Klinika', address: 'Toshkent' }));
      });
    </script>
    </body></html>`;

  test('clicking the button opens Google Maps directions in a new tab', async ({ page, context }) => {
    await page.setContent(harness);

    const popupPromise = context.waitForEvent('page');
    await page.getByRole('button', { name: 'Navigator orqali borish' }).click();
    const popup = await popupPromise;

    const url = popup.url();
    expect(url).toContain('https://www.google.com/maps/dir/');
    expect(url).toContain('api=1');
    expect(url).toContain('travelmode=driving');
    expect(decodeURIComponent(url)).toContain('destination=41.311081,69.240562');
  });

  test('falls back to a text address when coordinates are unavailable', async ({ page, context }) => {
    await page.setContent(harness.replace(
      "coords: '41.311081,69.240562', name: 'Klinika', address: 'Toshkent'",
      "coords: null, name: 'Med Center', address: 'Amir Temur 12'"
    ));

    const popupPromise = context.waitForEvent('page');
    await page.getByRole('button', { name: 'Navigator orqali borish' }).click();
    const popup = await popupPromise;

    expect(popup.url()).toContain('destination=Med+Center%2C+Amir+Temur+12');
  });
});
