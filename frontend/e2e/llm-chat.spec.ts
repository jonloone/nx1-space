/**
 * E2E test for LLM chat functionality
 */

import { test, expect } from '@playwright/test';

test.describe('LLM Chat Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should toggle to chat mode and send a message', async ({ page }) => {
    // Find the search/chat bar
    const searchChatBar = page.locator('.search-chat-container');
    await expect(searchChatBar).toBeVisible();

    // Click on the input to focus
    await page.locator('.search-chat-input').click();

    // Press Tab to switch to chat mode
    await page.keyboard.press('Tab');

    // Wait for chat mode to be active
    await expect(page.locator('.chat-mode')).toBeVisible();

    // Type a test message
    const chatInput = page.locator('.search-chat-input');
    await chatInput.fill('What are ground stations?');

    // Submit the message
    await page.locator('.search-chat-submit').click();

    // Wait for the AI response
    await expect(page.locator('.chat-message.assistant')).toBeVisible({ timeout: 30000 });

    // Check that the response contains relevant content
    const response = page.locator('.chat-message.assistant .chat-message-content').first();
    const responseText = await response.textContent();
    
    // Should contain either mock response or real response
    expect(responseText).toBeTruthy();
    expect(responseText?.toLowerCase()).toMatch(/ground station|mock response/);
  });

  test('should handle multiple messages in conversation', async ({ page }) => {
    // Switch to chat mode
    await page.locator('.search-chat-input').click();
    await page.keyboard.press('Tab');

    // Send first message
    const chatInput = page.locator('.search-chat-input');
    await chatInput.fill('Hello');
    await page.locator('.search-chat-submit').click();

    // Wait for first response
    await expect(page.locator('.chat-message.assistant')).toBeVisible({ timeout: 30000 });

    // Send second message
    await chatInput.fill('Tell me about network coverage');
    await page.locator('.search-chat-submit').click();

    // Should have 4 messages total (2 user, 2 assistant)
    await expect(page.locator('.chat-message')).toHaveCount(4, { timeout: 30000 });
  });

  test('should show loading state while processing', async ({ page }) => {
    // Switch to chat mode
    await page.locator('.search-chat-input').click();
    await page.keyboard.press('Tab');

    // Send a message
    const chatInput = page.locator('.search-chat-input');
    await chatInput.fill('Analyze ground station performance');
    
    // Click submit and immediately check for loading state
    await page.locator('.search-chat-submit').click();
    
    // Should show loading indicator
    const loadingIndicator = page.locator('.chat-message.assistant svg.animate-spin');
    await expect(loadingIndicator).toBeVisible();

    // Wait for response to complete
    await expect(loadingIndicator).not.toBeVisible({ timeout: 30000 });
  });

  test('should clear input after sending message', async ({ page }) => {
    // Switch to chat mode
    await page.locator('.search-chat-input').click();
    await page.keyboard.press('Tab');

    // Send a message
    const chatInput = page.locator('.search-chat-input');
    await chatInput.fill('Test message');
    await page.locator('.search-chat-submit').click();

    // Input should be cleared
    await expect(chatInput).toHaveValue('');
  });

  test('should maintain chat history when switching modes', async ({ page }) => {
    // Switch to chat mode
    await page.locator('.search-chat-input').click();
    await page.keyboard.press('Tab');

    // Send a message
    const chatInput = page.locator('.search-chat-input');
    await chatInput.fill('Remember this message');
    await page.locator('.search-chat-submit').click();

    // Wait for response
    await expect(page.locator('.chat-message.assistant')).toBeVisible({ timeout: 30000 });

    // Switch back to search mode
    await page.keyboard.press('Tab');
    await expect(page.locator('.search-mode')).toBeVisible();

    // Switch back to chat mode
    await page.keyboard.press('Tab');
    await expect(page.locator('.chat-mode')).toBeVisible();

    // Messages should still be there
    await expect(page.locator('.chat-message')).toHaveCount(2);
  });
});