import { test, expect } from '@playwright/test';

function attachNetworkDiagnostics(page: import('@playwright/test').Page) {
  page.on('requestfailed', (req) => {
    // eslint-disable-next-line no-console
    console.error(`[requestfailed] ${req.method()} ${req.url()} -> ${req.failure()?.errorText}`);
  });
  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('/_next/') && res.status() >= 400) {
      // eslint-disable-next-line no-console
      console.error(`[next-response-${res.status()}] ${url}`);
    }
  });
}

test('diagnose /studio network + cross-origin issues', async ({ page }) => {
  attachNetworkDiagnostics(page);
  await page.goto('/studio');

  await page.addScriptTag({ content: `
    console.log('[debug] location', window.location.href);
    console.log('[debug] origin', window.location.origin);
    console.log('[debug] userAgent', navigator.userAgent);
    console.log('[debug] viewport', window.innerWidth, window.innerHeight);
  `});

  await expect(page.getByRole('heading', { name: /Studio/i })).toBeVisible({ timeout: 5000 });
});

