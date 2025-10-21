import { test, expect } from '@playwright/test';

function setupConsoleCapture(page: import('@playwright/test').Page) {
  const logs: string[] = [];
  const errors: string[] = [];

  page.on('console', (msg) => {
    const entry = `[${msg.type()}] ${msg.text()}`;
    logs.push(entry);
    // Echo to test stdout for quick inspection
    // eslint-disable-next-line no-console
    console.log(entry);
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    const entry = `[pageerror] ${err.message}`;
    errors.push(entry);
    // eslint-disable-next-line no-console
    console.error(entry);
  });

  return { logs, errors };
}

test.describe('Console diagnostics', () => {
  test('studio page has no console errors', async ({ page }) => {
    const { errors } = setupConsoleCapture(page);
    await page.goto('/studio');
    await expect(page.getByRole('heading', { name: /Studio/i })).toBeVisible();
    // Give the app a moment to settle (effects, SW, etc.)
    await page.waitForTimeout(800);
    expect(errors, `Console errors on /studio: \n${errors.join('\n')}`).toHaveLength(0);
  });

  test('library page has no console errors', async ({ page }) => {
    const { errors } = setupConsoleCapture(page);
    await page.goto('/library');
    await expect(page.getByRole('heading', { name: /Bibliotheek/i })).toBeVisible();
    await page.waitForTimeout(400);
    expect(errors, `Console errors on /library: \n${errors.join('\n')}`).toHaveLength(0);
  });

  test('settings page has no console errors', async ({ page }) => {
    const { errors } = setupConsoleCapture(page);
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: /Instellingen/i })).toBeVisible();
    await page.waitForTimeout(400);
    expect(errors, `Console errors on /settings: \n${errors.join('\n')}`).toHaveLength(0);
  });
});

