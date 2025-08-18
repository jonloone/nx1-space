/**
 * E2E tests for LLM integration using Playwright
 */

import { test, expect } from '@playwright/test';

test.describe('LLM Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3003');
    
    // Wait for map to load
    await page.waitForSelector('[data-testid="map-container"]', { timeout: 30000 });
  });

  test('should toggle between search and chat modes', async ({ page }) => {
    // Find search/chat component
    const searchChatBar = page.locator('.search-chat-container');
    await expect(searchChatBar).toBeVisible();

    // Should start in search mode
    await expect(page.locator('.search-mode')).toBeVisible();
    
    // Press Tab to switch to chat mode
    await page.keyboard.press('Tab');
    await expect(page.locator('.chat-mode')).toBeVisible();
    
    // Press Tab again to switch back
    await page.keyboard.press('Tab');
    await expect(page.locator('.search-mode')).toBeVisible();
  });

  test('should send chat messages to LLM', async ({ page }) => {
    // Switch to chat mode
    const searchChatBar = page.locator('.search-chat-container');
    await searchChatBar.click();
    await page.keyboard.press('Tab');
    
    // Type a message
    const chatInput = page.locator('.chat-input');
    await chatInput.fill('What ground stations are near Los Angeles?');
    await chatInput.press('Enter');
    
    // Wait for response
    await expect(page.locator('.chat-response')).toBeVisible({ timeout: 30000 });
    
    // Response should contain relevant information
    const response = await page.locator('.chat-response').textContent();
    expect(response?.toLowerCase()).toContain('ground station');
  });

  test('should handle search queries', async ({ page }) => {
    // Ensure in search mode
    const searchInput = page.locator('.search-input');
    await searchInput.click();
    
    // Type a search query
    await searchInput.fill('LAX');
    
    // Wait for search results
    await expect(page.locator('.search-results')).toBeVisible({ timeout: 10000 });
    
    // Click on first result
    const firstResult = page.locator('.search-result').first();
    await firstResult.click();
    
    // Map should pan to location
    await page.waitForTimeout(2000); // Wait for animation
    
    // Verify map moved (check if navigation event was fired)
    const mapMoved = await page.evaluate(() => {
      return new Promise(resolve => {
        let moved = false;
        window.addEventListener('navigate-to-location', () => {
          moved = true;
        });
        // Trigger a test navigation if not already moved
        setTimeout(() => resolve(moved), 1000);
      });
    });
    
    expect(mapMoved).toBeTruthy();
  });

  test('should show error messages for failed requests', async ({ page }) => {
    // Intercept API calls to simulate error
    await page.route('**/api.synthetic.ai/**', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: { message: 'Server error' } })
      });
    });
    
    // Switch to chat mode
    await page.keyboard.press('Tab');
    
    // Send a message
    const chatInput = page.locator('.chat-input');
    await chatInput.fill('Test message');
    await chatInput.press('Enter');
    
    // Should show error message
    await expect(page.locator('.error-message')).toBeVisible({ timeout: 10000 });
  });

  test('should maintain conversation context', async ({ page }) => {
    // Switch to chat mode
    await page.keyboard.press('Tab');
    
    // Send first message
    const chatInput = page.locator('.chat-input');
    await chatInput.fill('Show me ground stations in California');
    await chatInput.press('Enter');
    
    // Wait for response
    await page.waitForSelector('.chat-response', { timeout: 30000 });
    
    // Send follow-up message
    await chatInput.fill('Which one has the highest score?');
    await chatInput.press('Enter');
    
    // Wait for second response
    await page.waitForSelector('.chat-response:nth-child(2)', { timeout: 30000 });
    
    // Response should reference previous context
    const secondResponse = await page.locator('.chat-response:nth-child(2)').textContent();
    expect(secondResponse?.toLowerCase()).toMatch(/highest|score|california/);
  });

  test('should handle streaming responses', async ({ page }) => {
    // Switch to chat mode
    await page.keyboard.press('Tab');
    
    // Send a message that requires longer response
    const chatInput = page.locator('.chat-input');
    await chatInput.fill('Explain the ground station scoring algorithm in detail');
    await chatInput.press('Enter');
    
    // Should show loading indicator
    await expect(page.locator('.loading-indicator')).toBeVisible();
    
    // Response should appear progressively
    await page.waitForSelector('.chat-response.streaming', { timeout: 10000 });
    
    // Wait for streaming to complete
    await expect(page.locator('.chat-response.streaming')).not.toBeVisible({ timeout: 60000 });
    
    // Final response should be complete
    const finalResponse = await page.locator('.chat-response').last().textContent();
    expect(finalResponse).toBeTruthy();
    expect(finalResponse!.length).toBeGreaterThan(100);
  });
});