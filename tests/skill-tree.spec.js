const { test, expect } = require('@playwright/test');

test.describe('Skill Tree Visualizer', () => {
  test.beforeEach(async ({ page }) => {
    // Start local server and navigate
    await page.goto('http://localhost:8000');

    // Wait for the application to load
    await page.waitForSelector('#cy');
    await page.waitForTimeout(1000); // Give Cytoscape time to initialize
  });

  test('should load the application', async ({ page }) => {
    // Check title
    await expect(page).toHaveTitle(/Skill Tree Visualizer/);

    // Check main elements are present
    await expect(page.locator('.app-header')).toBeVisible();
    await expect(page.locator('#cy')).toBeVisible();
    await expect(page.locator('.toolbar')).toBeVisible();
  });

  test('should display sample tree on load', async ({ page }) => {
    // Wait for Cytoscape to render
    await page.waitForTimeout(1500);

    // Check if there are any console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Check that the Cytoscape container exists and has nodes
    const hasNodes = await page.evaluate(() => {
      return window.skillTree && window.skillTree.cy && window.skillTree.cy.nodes().length > 0;
    });
    expect(hasNodes).toBe(true);

    console.log('Console errors:', errors);
  });

  test('theme toggle button should work', async ({ page }) => {
    const themeToggle = page.locator('#themeToggle');
    await expect(themeToggle).toBeVisible();

    // Get initial theme
    const initialTheme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });

    // Click toggle
    await themeToggle.click();
    await page.waitForTimeout(300);

    // Check theme changed
    const newTheme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });

    expect(newTheme).not.toBe(initialTheme);
  });

  test('help button should open modal', async ({ page }) => {
    await page.locator('#helpButton').click();
    await page.waitForTimeout(300);

    // Check if modal is visible
    const modal = page.locator('#modalOverlay');
    await expect(modal).toBeVisible();

    // Check modal title
    const modalTitle = await page.locator('#modalTitle').textContent();
    expect(modalTitle).toBe('Help');

    // Close modal
    await page.locator('#closeModalBtn').click();
    await page.waitForTimeout(200);
    await expect(modal).toHaveClass(/hidden/);
  });

  test('generate AI button should open modal', async ({ page }) => {
    await page.locator('#generateLLMBtn').click();
    await page.waitForTimeout(300);

    // Check if modal opened
    const modal = page.locator('#modalOverlay');
    await expect(modal).toBeVisible();

    // Check modal has AI content
    const modalContent = await page.locator('#modalContent').textContent();
    expect(modalContent).toContain('AI');
  });

  test('permalink button should work', async ({ page }) => {
    await page.locator('#permalinkBtn').click();
    await page.waitForTimeout(300);

    // Check if modal opened
    const modal = page.locator('#modalOverlay');
    await expect(modal).toBeVisible();

    // Check for permalink textarea
    const modalContent = await page.locator('#modalContent').textContent();
    expect(modalContent.toLowerCase()).toContain('share');
  });

  test('import URL button should open modal', async ({ page }) => {
    await page.locator('#importURLBtn').click();
    await page.waitForTimeout(300);

    // Check if modal opened
    const modal = page.locator('#modalOverlay');
    await expect(modal).toBeVisible();

    // Check modal title
    const modalTitle = await page.locator('#modalTitle').textContent();
    expect(modalTitle).toContain('Import');
  });

  test('should detect JavaScript errors', async ({ page }) => {
    const errors = [];
    const warnings = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
      if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    // Wait a bit for any async errors
    await page.waitForTimeout(2000);

    // Try clicking various buttons
    await page.locator('#themeToggle').click();
    await page.waitForTimeout(200);

    await page.locator('#helpButton').click();
    await page.waitForTimeout(200);
    await page.locator('#closeModalBtn').click();
    await page.waitForTimeout(200);

    console.log('JavaScript Errors:', errors);
    console.log('JavaScript Warnings:', warnings);

    // Report errors
    if (errors.length > 0) {
      console.error('Found errors:', errors);
    }
  });

  test('should check if Cytoscape is initialized', async ({ page }) => {
    const cyInitialized = await page.evaluate(() => {
      return window.skillTree && window.skillTree.cy !== null;
    });

    expect(cyInitialized).toBe(true);
  });

  test('should check if all global objects exist', async ({ page }) => {
    const globals = await page.evaluate(() => {
      return {
        skillTree: typeof window.skillTree !== 'undefined',
        UIControls: typeof window.UIControls !== 'undefined',
        DataManager: typeof window.DataManager !== 'undefined',
        PermalinkManager: typeof window.PermalinkManager !== 'undefined',
        LLMPrompt: typeof window.LLMPrompt !== 'undefined',
        NodeRenderer: typeof window.NodeRenderer !== 'undefined',
        ThemeManager: typeof window.ThemeManager !== 'undefined',
        cytoscape: typeof window.cytoscape !== 'undefined',
        LZString: typeof window.LZString !== 'undefined',
        marked: typeof window.marked !== 'undefined',
        DOMPurify: typeof window.DOMPurify !== 'undefined'
      };
    });

    console.log('Global objects:', globals);

    expect(globals.cytoscape).toBe(true);
    expect(globals.skillTree).toBe(true);
  });
});
