import { test, expect } from '@playwright/test';

test.describe('Studio native shell', () => {
  test('loads and shows header, composer, and nav', async ({ page, browserName }) => {
    await page.goto('/studio');

    // Header title centered
    await expect(page.getByRole('heading', { name: 'Studio' })).toBeVisible();

    // Composer input present
    await expect(page.getByPlaceholder(/Typ je bericht|Klaar! Wil je het liedje verfijnen/i)).toBeVisible();

    // Bottom nav tabs labels
    await expect(page.getByText('Studio')).toBeVisible();
    await expect(page.getByText(/Bibliotheek|Library/)).toBeVisible();
    await expect(page.getByText(/Instellingen|Settings/)).toBeVisible();
  });

  test('send a chat message renders a user bubble', async ({ page }) => {
    await page.goto('/studio');
    const input = page.getByPlaceholder(/Typ je bericht|Klaar!/i);
    await input.fill('Testbericht');
    await page.getByRole('button', { name: /Verstuur/i }).click();

    // We expect at least the user message to appear in a bubble
    await expect(page.getByText('Testbericht')).toBeVisible();
  });

  test('header plus opens lyrics/settings sheet', async ({ page }) => {
    await page.goto('/studio');
    await page.getByRole('button', { name: /Nieuw/i }).click();
    await page.getByText(/Lyrics \& instellingen/i).waitFor({ timeout: 3000 });
    await expect(page.getByText(/Lyrics \& instellingen/i)).toBeVisible();
  });
});

test.describe('Library & Settings', () => {
  test('library shell', async ({ page }) => {
    await page.goto('/library');
    await expect(page.getByRole('heading', { name: 'Bibliotheek' })).toBeVisible();
  });

  test('settings shell', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Instellingen' })).toBeVisible();
  });
});
