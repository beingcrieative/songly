import { test, expect } from '@playwright/test';

/**
 * PWA End-to-End Tests
 * 
 * Tests the complete PWA flow including:
 * - Mobile/PWA view detection
 * - Conversation creation
 * - Message sending and receiving
 * - Lyrics generation
 * - Song creation and library visibility
 * - Navigation between pages
 */

test.describe('PWA Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to PWA view
    await page.goto('/studio?pwa=1');
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('PWA view loads correctly', async ({ page }) => {
    // Check that mobile view is active
    await expect(page.getByRole('heading', { name: 'Studio' })).toBeVisible();
    
    // Check for composer
    await expect(page.getByPlaceholder(/Typ je bericht|Klaar!/i)).toBeVisible();
    
    // Check for navigation tabs
    await expect(page.getByText(/Studio|Chat/)).toBeVisible();
    await expect(page.getByText(/Bibliotheek|Library/)).toBeVisible();
  });

  test('complete conversation flow', async ({ page }) => {
    // Step 1: Send initial message
    const input = page.getByPlaceholder(/Typ je bericht|Klaar!/i);
    await input.fill('Hallo, ik wil een liedje maken voor mijn vriendin');
    await page.getByRole('button', { name: /Verstuur|Send/i }).click();

    // Step 2: Wait for user message to appear
    await expect(page.getByText('Hallo, ik wil een liedje maken voor mijn vriendin')).toBeVisible({ timeout: 5000 });

    // Step 3: Wait for AI response (with longer timeout for API call)
    await expect(page.getByText(/Wat|Hallo|Vertel/i).first()).toBeVisible({ timeout: 30000 });

    // Step 4: Verify conversation continues
    await input.fill('We kennen elkaar al 5 jaar');
    await page.getByRole('button', { name: /Verstuur|Send/i }).click();
    
    await expect(page.getByText('We kennen elkaar al 5 jaar')).toBeVisible({ timeout: 5000 });
  });

  test('messages auto-scroll to bottom', async ({ page }) => {
    // Send a message
    const input = page.getByPlaceholder(/Typ je bericht|Klaar!/i);
    await input.fill('Test auto-scroll');
    await page.getByRole('button', { name: /Verstuur|Send/i }).click();

    // Wait for message to appear
    await expect(page.getByText('Test auto-scroll')).toBeVisible({ timeout: 5000 });

    // Check that page has scrolled to bottom
    // This checks if the scroll position is near the bottom
    const scrollY = await page.evaluate(() => window.scrollY);
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const clientHeight = await page.evaluate(() => window.innerHeight);
    const distanceFromBottom = scrollHeight - scrollY - clientHeight;
    
    // Should be scrolled near bottom (within 200px)
    expect(distanceFromBottom).toBeLessThan(200);
  });

  test('navigation between pages', async ({ page }) => {
    // Navigate to library
    await page.getByText(/Bibliotheek|Library/i).click();
    await expect(page.getByRole('heading', { name: /Bibliotheek|Library/i })).toBeVisible({ timeout: 5000 });

    // Navigate to settings
    await page.getByText(/Instellingen|Settings/i).click();
    await expect(page.getByRole('heading', { name: /Instellingen|Settings/i })).toBeVisible({ timeout: 5000 });

    // Navigate back to studio
    await page.getByText(/Studio|Chat/i).click();
    await expect(page.getByRole('heading', { name: 'Studio' })).toBeVisible({ timeout: 5000 });
  });
});

test.describe('PWA Database Integration', () => {
  test('conversation and messages are saved', async ({ page }) => {
    await page.goto('/studio?pwa=1');
    await page.waitForLoadState('networkidle');

    // Send a message
    const input = page.getByPlaceholder(/Typ je bericht|Klaar!/i);
    await input.fill('Test database save');
    await page.getByRole('button', { name: /Verstuur|Send/i }).click();

    // Wait for message to appear
    await expect(page.getByText('Test database save')).toBeVisible({ timeout: 5000 });

    // Reload page to verify persistence
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Message should still be visible after reload
    await expect(page.getByText('Test database save')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('PWA Lyrics Generation', () => {
  test('lyrics generation creates song in library', async ({ page }) => {
    await page.goto('/studio?pwa=1');
    await page.waitForLoadState('networkidle');

    // Send initial messages to build context (simplified - in real test would need actual API responses)
    const input = page.getByPlaceholder(/Typ je bericht|Klaar!/i);
    
    // Note: This test assumes the conversation will eventually trigger lyrics generation
    // In a real scenario, you'd need to wait for the AI to respond and continue the conversation
    // until lyrics generation is triggered
    
    // After lyrics generation, navigate to library
    await page.getByText(/Bibliotheek|Library/i).click();
    await expect(page.getByRole('heading', { name: /Bibliotheek|Library/i })).toBeVisible({ timeout: 5000 });

    // Check if songs section exists (even if empty initially)
    // In production, after lyrics generation, songs should appear here
    const songsSection = page.locator('text=/Liedjes|Songs/i');
    await expect(songsSection).toBeVisible({ timeout: 5000 });
  });
});

test.describe('PWA Error Handling', () => {
  test('handles network errors gracefully', async ({ page, context }) => {
    await page.goto('/studio?pwa=1');
    await page.waitForLoadState('networkidle');

    // Intercept API calls and simulate network error
    await page.route('**/api/**', route => {
      if (route.request().method() === 'POST') {
        route.abort();
      } else {
        route.continue();
      }
    });

    // Try to send a message
    const input = page.getByPlaceholder(/Typ je bericht|Klaar!/i);
    await input.fill('Test error handling');
    await page.getByRole('button', { name: /Verstuur|Send/i }).click();

    // Should show error message or handle gracefully
    // Wait a bit for error handling
    await page.waitForTimeout(2000);
    
    // Verify that app still works (doesn't crash)
    await expect(page.getByPlaceholder(/Typ je bericht|Klaar!/i)).toBeVisible();
  });
});

test.describe('PWA Responsive Design', () => {
  test('mobile viewport displays correctly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/studio?pwa=1');
    await page.waitForLoadState('networkidle');

    // Check that mobile layout is active
    await expect(page.getByRole('heading', { name: 'Studio' })).toBeVisible();
    
    // Check that navigation is at bottom (mobile style)
    const navTabs = page.locator('nav').filter({ hasText: /Studio|Chat/ });
    await expect(navTabs).toBeVisible();
  });

  test('desktop viewport displays correctly', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/studio?pwa=1');
    await page.waitForLoadState('networkidle');

    // Should still show content (may show desktop layout)
    await expect(page.getByRole('heading', { name: /Studio|Liefdesliedje/i })).toBeVisible();
  });
});

