const { test, expect } = require('@playwright/test');

test.describe('Button Debug Test', () => {
  test('debug button clicks and console output', async ({ page }) => {
    // Capture all console messages
    const messages = [];
    page.on('console', msg => {
      messages.push({ type: msg.type(), text: msg.text() });
    });

    // Capture errors
    const errors = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    // Navigate to the app
    await page.goto('http://localhost:8000');
    await page.waitForSelector('#cy');
    await page.waitForTimeout(2000);

    console.log('\n=== Console messages so far ===');
    messages.forEach(m => console.log(`[${m.type}] ${m.text}`));

    // Check if skillTree exists and is initialized
    const skillTreeStatus = await page.evaluate(() => {
      return {
        exists: typeof window.skillTree !== 'undefined',
        isNull: window.skillTree === null,
        hasCy: window.skillTree && window.skillTree.cy !== null,
        uiControlsExists: typeof window.UIControls !== 'undefined'
      };
    });

    console.log('\n=== SkillTree Status ===');
    console.log(JSON.stringify(skillTreeStatus, null, 2));

    // Try clicking help button and capture what happens
    console.log('\n=== Clicking Help Button ===');
    await page.locator('#helpButton').click();
    await page.waitForTimeout(500);

    console.log('\n=== Console messages after help click ===');
    const newMessages = messages.slice(messages.length - 10);
    newMessages.forEach(m => console.log(`[${m.type}] ${m.text}`));

    // Check modal state
    const modalState = await page.evaluate(() => {
      const modal = document.getElementById('modalOverlay');
      return {
        exists: modal !== null,
        classes: modal ? modal.className : 'not found',
        hasHidden: modal ? modal.classList.contains('hidden') : 'not found',
        display: modal ? window.getComputedStyle(modal).display : 'not found'
      };
    });

    console.log('\n=== Modal State ===');
    console.log(JSON.stringify(modalState, null, 2));

    // Check errors
    console.log('\n=== JavaScript Errors ===');
    console.log(errors.length === 0 ? 'No errors' : JSON.stringify(errors, null, 2));

    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/debug-screenshot.png', fullPage: true });
  });
});
