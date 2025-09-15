const { test, expect } = require('@playwright/test');

test.describe('Fulcrum Text Analysis', () => {
  test('should load the homepage without console errors', async ({ page }) => {
    // Listen for console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to the homepage
    await page.goto('/');

    // Check that the page loads
    await expect(page).toHaveTitle('Fulcrum Text Analysis');

    // Check that the main heading is visible
    await expect(page.locator('h1')).toContainText('Fulcrum');

    // Check that the textarea is present
    await expect(page.locator('#textInput')).toBeVisible();

    // Check that the analyze button is present
    await expect(page.locator('.analyze-btn')).toBeVisible();

    // Wait a moment for any async operations
    await page.waitForTimeout(1000);

    // Assert no console errors occurred
    expect(consoleErrors).toEqual([]);
  });

  test('should disable analyze button when no text is entered', async ({ page }) => {
    await page.goto('/');

    // Initially, button should be disabled (no text)
    await expect(page.locator('.analyze-btn')).toBeDisabled();
  });

  test('should enable analyze button when text is entered', async ({ page }) => {
    await page.goto('/');

    // Type some text
    await page.fill('#textInput', 'This is a test text for analysis.');

    // Button should now be enabled
    await expect(page.locator('.analyze-btn')).toBeEnabled();
  });

  test('should perform text analysis and display results', async ({ page }) => {
    // Listen for network requests
    const responses = [];
    page.on('response', response => {
      if (response.url().includes('/analyze')) {
        responses.push(response);
      }
    });

    await page.goto('/');

    // Enter test text
    const testText = 'This is a comprehensive test of the Fulcrum text analysis service. It should analyze complexity, tokenize words, and provide detailed preprocessing results.';
    await page.fill('#textInput', testText);

    // Click analyze button
    await page.click('.analyze-btn');

    // Wait for loading to start
    await expect(page.locator('.loading')).toBeVisible();

    // Wait for analysis to complete (loading should disappear)
    await expect(page.locator('.loading')).not.toBeVisible({ timeout: 10000 });

    // Check that we got a response
    expect(responses.length).toBeGreaterThan(0);
    expect(responses[0].status()).toBe(200);

    // Check that results section becomes visible
    await expect(page.locator('.results-section')).toBeVisible();

    // Check that key metrics are displayed
    await expect(page.locator('.metric-card')).toHaveCount(6);

    // Check that metric values are populated
    const readingLevelCard = page.locator('.metric-card').first();
    await expect(readingLevelCard.locator('.metric-value')).not.toContainText('N/A');

    // Check that detailed sections are present
    await expect(page.locator('.result-section')).toHaveCount(3);

    // Test expanding a detailed section
    await page.click('.result-header:has-text("Complexity Metrics")');
    await expect(page.locator('.result-content').first()).toBeVisible();

    // Check that JSON data is displayed
    await expect(page.locator('.json-display').first()).toBeVisible();
    await expect(page.locator('.json-display').first()).toContainText('flesch_kincaid_grade_level');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await page.goto('/');

    // Mock a failed API response
    await page.route('/analyze', route => {
      route.fulfill({
        status: 500,
        body: 'Internal Server Error'
      });
    });

    // Enter text and click analyze
    await page.fill('#textInput', 'Test text');
    await page.click('.analyze-btn');

    // Wait for error message
    await expect(page.locator('.error-message')).toBeVisible({ timeout: 5000 });

    // Check that loading indicator is hidden
    await expect(page.locator('.loading')).not.toBeVisible();
  });

  test('should clear error when typing new text', async ({ page }) => {
    await page.goto('/');

    // First create an error by mocking failed response
    await page.route('/analyze', route => {
      route.fulfill({
        status: 500,
        body: 'Internal Server Error'
      });
    });

    await page.fill('#textInput', 'Test text');
    await page.click('.analyze-btn');

    // Wait for error to appear
    await expect(page.locator('.error-message')).toBeVisible();

    // Now type in the textarea to trigger error clearing
    await page.fill('#textInput', 'New text');

    // Error should be cleared
    await expect(page.locator('.error-message')).not.toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // Check that elements are still visible and usable
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#textInput')).toBeVisible();
    await expect(page.locator('.analyze-btn')).toBeVisible();

    // Check that metric grid adapts to mobile
    await page.fill('#textInput', 'Mobile test text for analysis.');
    await page.click('.analyze-btn');

    // Wait for results
    await expect(page.locator('.results-section')).toBeVisible({ timeout: 10000 });

    // Metric cards should stack vertically on mobile
    const metricCards = page.locator('.metric-card');
    const firstCard = metricCards.first();
    const secondCard = metricCards.nth(1);

    const firstCardBox = await firstCard.boundingBox();
    const secondCardBox = await secondCard.boundingBox();

    // On mobile, cards should be stacked (second card below first)
    expect(secondCardBox.y).toBeGreaterThan(firstCardBox.y + firstCardBox.height - 10);
  });

  test('should preserve analysis state when toggling sections', async ({ page }) => {
    await page.goto('/');

    // Perform analysis
    await page.fill('#textInput', 'Test text for state preservation check.');
    await page.click('.analyze-btn');

    // Wait for results
    await expect(page.locator('.results-section')).toBeVisible({ timeout: 10000 });

    // Expand complexity section
    await page.click('.result-header:has-text("Complexity Metrics")');
    await expect(page.locator('.result-content').first()).toBeVisible();

    // Collapse it
    await page.click('.result-header:has-text("Complexity Metrics")');
    await expect(page.locator('.result-content').first()).not.toBeVisible();

    // Expand tokens section
    await page.click('.result-header:has-text("Tokenization")');
    await expect(page.locator('.result-content').nth(1)).toBeVisible();

    // Results should still be there and valid
    await expect(page.locator('.metric-value').first()).not.toContainText('N/A');
  });
});