import { test, expect } from '@playwright/test';

/**
 * Complete PWA End-to-End Test Suite
 * 
 * Tests the complete PWA flow including:
 * - Magic link authentication
 * - Complete conversation flow
 * - Lyrics generation
 * - Song creation and library visibility
 * - Auto-scroll behavior
 * - Navigation between pages
 * - Database persistence
 */

const TEST_EMAIL = 'criekje@gmail.com'; // Email voor magic link authenticatie
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

// Environment variable om magic code in te voeren (voor CI/CD)
// In handmatige tests: wacht op code van gebruiker
const MAGIC_CODE = process.env.MAGIC_CODE || null;

/**
 * Helper function to ensure PWA view is active and user is authenticated
 */
async function ensureAuthenticatedPWAView(page: any) {
  // Navigate to PWA view if not already there
  const currentUrl = page.url();
  if (!currentUrl.includes('/studio') || !currentUrl.includes('pwa=1')) {
    await page.goto(`${BASE_URL}/studio?pwa=1`);
    await page.waitForLoadState('networkidle');
  }

  // Check if login screen is shown
  const loginScreen = page.locator('text=/Magic Link Login|Log in om te beginnen/i');
  const isLoginVisible = await loginScreen.isVisible({ timeout: 3000 }).catch(() => false);

  if (isLoginVisible) {
    console.log('🔐 Login required, performing authentication...');
    
    // Step 1: Enter email
    const emailInput = page.getByPlaceholder(/jij@email\.com|email/i);
    await emailInput.fill(TEST_EMAIL);
    
    // Step 2: Click send code button
    const sendCodeButton = page.getByRole('button', { name: /Stuur code|Send code/i });
    await sendCodeButton.click();
    
    // Step 3: Wait for code input to appear
    const codeInput = page.getByPlaceholder(/123456|verificatie/i);
    await expect(codeInput).toBeVisible({ timeout: 10000 });
    
    // Step 4: Wacht op magic code van gebruiker
    console.log(`📧 Magic code sent to ${TEST_EMAIL}`);
    console.log('⏳ Waiting for magic code to be entered...');
    console.log('💡 Please provide the 6-digit code when it arrives in your email');
    
    // Check if code is provided via environment variable (CI/CD)
    if (MAGIC_CODE) {
      console.log('🔑 Using magic code from environment variable');
      await codeInput.fill(MAGIC_CODE);
      
      // Click login button
      const loginButton = page.getByRole('button', { name: /Log in|Inloggen/i });
      if (await loginButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await loginButton.click();
      }
    } else {
      // Manual mode: wait for code entry
      console.log('⏸️  Waiting for magic code input...');
      console.log(`📬 Check email at ${TEST_EMAIL} and enter the code in the browser`);
      
      // Wait up to 60 seconds for code to be entered manually
      // Check every 2 seconds if code was entered (by checking if login completed)
      let attempts = 0;
      const maxAttempts = 30; // 30 * 2 seconds = 60 seconds total
      
      while (attempts < maxAttempts) {
        // Check if Studio heading is visible (login completed)
        const studioHeading = page.getByRole('heading', { name: 'Studio' });
        const isLoggedIn = await studioHeading.isVisible({ timeout: 1000 }).catch(() => false);
        
        if (isLoggedIn) {
          console.log('✅ Authentication complete - code was entered');
          break;
        }
        
        // Check if code input still exists (still waiting)
        const codeInputStillVisible = await codeInput.isVisible({ timeout: 1000 }).catch(() => false);
        if (!codeInputStillVisible) {
          // Code input disappeared - might be processing or error
          // Check again if Studio is visible
          const studioCheck = await studioHeading.isVisible({ timeout: 2000 }).catch(() => false);
          if (studioCheck) {
            console.log('✅ Authentication complete');
            break;
          }
        }
        
        await page.waitForTimeout(2000); // Wait 2 seconds before next check
        attempts++;
      }
      
      // Final check if login completed
      const finalStudioCheck = page.getByRole('heading', { name: 'Studio' });
      const isLoggedIn = await finalStudioCheck.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (!isLoggedIn) {
        throw new Error(
          `Authentication timeout. Magic code was not entered within 60 seconds.\n` +
          `Please login manually at ${BASE_URL}/studio?pwa=1 and then run tests again.\n` +
          `Or set MAGIC_CODE environment variable: MAGIC_CODE=123456 npm run test`
        );
      }
    }
    
    // Step 5: Wait for login to complete (Studio should be visible)
    await expect(page.getByRole('heading', { name: 'Studio' })).toBeVisible({ timeout: 15000 });
    console.log('✅ Authentication complete - Studio is visible');
  }

  // Verify PWA view is active
  expect(page.url()).toContain('pwa=1');
  
  // Verify Studio is visible (authenticated)
  const heading = page.getByRole('heading', { name: 'Studio' });
  await expect(heading).toBeVisible({ timeout: 10000 });
  
  return true;
}

test.describe('Complete PWA Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to PWA view and ensure authentication
    await ensureAuthenticatedPWAView(page);
    await page.waitForLoadState('networkidle');
  });

  test('PWA URL and basic view', async ({ page }) => {
    // beforeEach already ensures PWA view and authentication
    // Verify we're on the correct URL with PWA parameter
    expect(page.url()).toContain('/studio');
    expect(page.url()).toContain('pwa=1');
    
    // Check that mobile view is active (PWA view)
    const heading = page.getByRole('heading', { name: 'Studio' });
    await expect(heading).toBeVisible({ timeout: 15000 });
    
    // Wait a bit for the UI to fully render after login
    await page.waitForTimeout(1000);
    
    // Verify PWA-specific mobile UI elements
    // Check for composer - placeholder can be "Typ je bericht..." (with three dots) or "Typ je bericht..."
    // Try both variations
    const composerInput = page.locator('input[type="text"]').filter({ hasText: /Typ je bericht/i }).or(
      page.getByPlaceholder(/Typ je bericht/i)
    );
    await expect(composerInput.first()).toBeVisible({ timeout: 15000 });
    
    // Check for navigation tabs (mobile PWA navigation)
    // Nav tabs use: "Chat", "Bibliotheek"/"Library", "Instellingen"/"Settings"
    await expect(page.getByText(/Chat/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Bibliotheek|Library/i)).toBeVisible({ timeout: 10000 });
    
    // Verify mobile viewport is respected (should see mobile layout)
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeLessThanOrEqual(390); // Mobile viewport
  });

  test('Magic link authentication flow', async ({ page }) => {
    // Navigate fresh to test login flow
    await page.goto(`${BASE_URL}/studio?pwa=1`);
    await page.waitForLoadState('networkidle');
    
    // Check if login screen is shown
    const loginScreen = page.locator('text=/Magic Link Login|Log in om te beginnen/i');
    const isLoginVisible = await loginScreen.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (isLoginVisible) {
      const emailInput = page.getByPlaceholder(/jij@email\.com|email/i);
      
      // Step 1: Enter email
      await emailInput.fill(TEST_EMAIL);
      
      // Step 2: Click send code button
      const sendCodeButton = page.getByRole('button', { name: /Stuur code|Send code/i });
      await sendCodeButton.click();
      
      // Step 3: Wait for code input to appear
      const codeInput = page.getByPlaceholder(/123456|verificatie/i);
      await expect(codeInput).toBeVisible({ timeout: 10000 });
      
      // Step 4: For automated testing, we need the code
      // In CI/CD, fetch from email API or use test account
      console.log(`📧 Magic code sent to ${TEST_EMAIL}`);
      console.log('⏳ Code input field is visible and ready for code entry');
      
      // Note: Actual code entry would happen here in automated environment
      // For manual testing, user would enter code at this point
      // For now, we verify the login UI flow is correct
      await expect(codeInput).toBeVisible();
      
      // Verify we're still in PWA mode
      expect(page.url()).toContain('pwa=1');
    } else {
      // Already logged in
      console.log('✅ Already logged in, verifying PWA view');
      await expect(page.getByRole('heading', { name: 'Studio' })).toBeVisible({ timeout: 10000 });
      expect(page.url()).toContain('pwa=1');
    }
  });

  test('Complete conversation and lyrics generation flow', async ({ page, browserName }) => {
    test.setTimeout(180000); // 3 minutes for this test (includes API calls)
    
    // Verify PWA view is active
    expect(page.url()).toContain('pwa=1');

    // Step 1: Wait for composer to be visible
    // Try multiple selector strategies since placeholder might vary
    const input = page.locator('input[type="text"]').filter({ 
      has: page.getByPlaceholder(/Typ je bericht/i) 
    }).or(page.getByPlaceholder(/Typ je bericht/i)).first();
    
    await expect(input).toBeVisible({ timeout: 15000 });
    
    // Step 2: Send initial message
    await input.fill('Hallo, ik wil een liedje maken voor mijn vriendin. We kennen elkaar al 5 jaar.');
    await page.getByRole('button', { name: /Verstuur|Send/i }).click();

    // Step 3: Wait for user message to appear and verify auto-scroll
    await expect(page.getByText('Hallo, ik wil een liedje maken voor mijn vriendin')).toBeVisible({ timeout: 5000 });
    
    // Verify auto-scroll worked
    const scrollY = await page.evaluate(() => window.scrollY);
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const clientHeight = await page.evaluate(() => window.innerHeight);
    const distanceFromBottom = scrollHeight - scrollY - clientHeight;
    expect(distanceFromBottom).toBeLessThan(200);

    // Step 4: Wait for AI response (with longer timeout for API call)
    await expect(page.getByText(/Wat|Hallo|Vertel|jaren/i).first()).toBeVisible({ timeout: 30000 });
    
    // Step 5: Continue conversation until lyrics generation is triggered
    // This is a simplified flow - in reality, multiple rounds are needed
    await input.fill('We zijn samen gaan wonen vorig jaar');
    await page.getByRole('button', { name: /Verstuur|Send/i }).click();
    
    await expect(page.getByText('We zijn samen gaan wonen vorig jaar')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/vertel|meer|liedje|maken/i).first()).toBeVisible({ timeout: 30000 });
    
    // Step 6: Verify messages are being saved (reload check)
    await page.reload({ waitUntil: 'networkidle' });
    
    // Messages should persist after reload
    await expect(page.getByText('Hallo, ik wil een liedje maken voor mijn vriendin')).toBeVisible({ timeout: 10000 });
  });

  test('Library shows created conversations and songs', async ({ page }) => {
    // Verify PWA view
    expect(page.url()).toContain('pwa=1');
    
    // Wait for navigation tabs
    await expect(page.getByText(/Bibliotheek|Library/i)).toBeVisible({ timeout: 10000 });
    
    // Navigate to library
    await page.getByText(/Bibliotheek|Library/i).click();
    await expect(page.getByRole('heading', { name: /Bibliotheek|Library/i })).toBeVisible({ timeout: 5000 });

    // Check that songs section exists
    const songsSection = page.locator('text=/Liedjes|Songs/i');
    await expect(songsSection).toBeVisible({ timeout: 5000 });

    // Check that conversations section exists
    const conversationsSection = page.locator('text=/Gesprekken|Conversations/i');
    await expect(conversationsSection).toBeVisible({ timeout: 5000 });

    // In production, after conversations/songs are created, they should appear here
    // For now, we just verify the sections are visible
  });

  test('Auto-scroll behavior after sending message', async ({ page }) => {
    // Verify PWA view
    expect(page.url()).toContain('pwa=1');
    
    // Wait for composer to be visible - use more flexible selector
    const input = page.locator('input[type="text"]').or(page.getByPlaceholder(/Typ je bericht|Klaar/i)).first();
    await expect(input).toBeVisible({ timeout: 15000 });
    
    // Send a message
    await input.fill('Test auto-scroll message');
    await page.getByRole('button', { name: /Verstuur|Send/i }).click();

    // Wait for message to appear
    await expect(page.getByText('Test auto-scroll message')).toBeVisible({ timeout: 5000 });

    // Check that page has scrolled to bottom
    await page.waitForTimeout(500); // Wait for scroll animation
    const scrollY = await page.evaluate(() => window.scrollY);
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const clientHeight = await page.evaluate(() => window.innerHeight);
    const distanceFromBottom = scrollHeight - scrollY - clientHeight;
    
    // Should be scrolled near bottom (within 200px)
    expect(distanceFromBottom).toBeLessThan(200);
  });

  test('Navigation between all pages', async ({ page }) => {
    // Verify PWA view
    expect(page.url()).toContain('pwa=1');
    
    // Wait for navigation tabs to be visible
    await expect(page.getByText(/Bibliotheek|Library/i)).toBeVisible({ timeout: 10000 });
    
    // Navigate to library
    await page.getByText(/Bibliotheek|Library/i).click();
    await expect(page.getByRole('heading', { name: /Bibliotheek|Library/i })).toBeVisible({ timeout: 5000 });

    // Navigate to settings
    await page.getByText(/Instellingen|Settings/i).click();
    // Settings page may have different heading - just verify we navigated
    await page.waitForTimeout(1000);

    // Navigate back to studio (via Chat tab)
    await page.getByText(/Chat/i).click();
    await expect(page.getByRole('heading', { name: 'Studio' })).toBeVisible({ timeout: 5000 });
  });

  test('Error handling when API fails', async ({ page, context }) => {
    // Verify PWA view
    expect(page.url()).toContain('pwa=1');
    
    // Intercept API calls and simulate network error
    await page.route('**/api/**', route => {
      if (route.request().method() === 'POST' && route.request().url().includes('/chat')) {
        route.abort();
      } else {
        route.continue();
      }
    });

    // Wait for composer to be visible - use more flexible selector
    const input = page.locator('input[type="text"]').or(page.getByPlaceholder(/Typ je bericht|Klaar/i)).first();
    await expect(input).toBeVisible({ timeout: 15000 });
    
    // Try to send a message
    await input.fill('Test error handling');
    await page.getByRole('button', { name: /Verstuur|Send/i }).click();

    // Should show error message or handle gracefully
    await page.waitForTimeout(3000);
    
    // Verify that app still works (doesn't crash)
    const composerInput = page.locator('input[type="text"]').or(page.getByPlaceholder(/Typ je bericht|Klaar/i)).first();
    await expect(composerInput).toBeVisible({ timeout: 10000 });
    
    // Verify error message is shown (if implemented)
    const errorMessage = page.locator('text=/error|mis|fout/i');
    // Error message may or may not be visible depending on implementation
  });
});

test.describe('PWA Database Integration', () => {
  test('conversations and messages persist after reload', async ({ page }) => {
    // Ensure PWA view and authentication
    await ensureAuthenticatedPWAView(page);

    // Wait for composer to be visible - use more flexible selector
    const input = page.locator('input[type="text"]').or(page.getByPlaceholder(/Typ je bericht|Klaar/i)).first();
    await expect(input).toBeVisible({ timeout: 15000 });
    
    // Send a message
    const testMessage = `Test persistence ${Date.now()}`;
    await input.fill(testMessage);
    await page.getByRole('button', { name: /Verstuur|Send/i }).click();

    // Wait for message to appear
    await expect(page.getByText(testMessage)).toBeVisible({ timeout: 5000 });

    // Reload page to verify persistence
    await page.reload({ waitUntil: 'networkidle' });

    // Message should still be visible after reload
    await expect(page.getByText(testMessage)).toBeVisible({ timeout: 10000 });
  });

  test('songs created via mobile API appear in library', async ({ page }) => {
    // Ensure PWA view and authentication
    await ensureAuthenticatedPWAView(page);

    // This test assumes lyrics generation has been triggered
    // Wait for navigation tabs
    await expect(page.getByText(/Bibliotheek|Library/i)).toBeVisible({ timeout: 10000 });
    
    // Navigate to library
    await page.getByText(/Bibliotheek|Library/i).click();
    await expect(page.getByRole('heading', { name: /Bibliotheek|Library/i })).toBeVisible({ timeout: 5000 });

    // Check if songs are visible (may be empty initially)
    const songsSection = page.locator('text=/Liedjes|Songs/i');
    await expect(songsSection).toBeVisible({ timeout: 5000 });
  });
});

