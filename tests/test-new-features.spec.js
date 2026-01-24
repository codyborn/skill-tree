const { test, expect } = require('@playwright/test');

test.describe('New Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('#cy');
    await page.waitForTimeout(2000);
  });

  test('dark/light mode should apply to entire board', async ({ page }) => {
    // Check initial theme (should be light or dark)
    const initialBg = await page.evaluate(() => {
      return window.getComputedStyle(document.querySelector('.cytoscape-container')).backgroundColor;
    });

    // Toggle theme
    await page.click('#themeToggle');
    await page.waitForTimeout(500);

    // Check that background changed
    const newBg = await page.evaluate(() => {
      return window.getComputedStyle(document.querySelector('.cytoscape-container')).backgroundColor;
    });

    expect(newBg).not.toBe(initialBg);
  });

  test('global progress bar should be removed', async ({ page }) => {
    const progressBarExists = await page.locator('#progressFill').count();
    const progressTextExists = await page.locator('#progressText').count();

    expect(progressBarExists).toBe(0);
    expect(progressTextExists).toBe(0);
  });

  test('node should have weight field in detail panel', async ({ page }) => {
    // Open detail panel by clicking on root node
    await page.evaluate(() => {
      const node = window.skillTree.cy.nodes()[0];
      node.trigger('tap');
    });

    await page.waitForTimeout(500);

    // Check weight field exists
    const weightField = await page.locator('#nodeWeight').count();
    expect(weightField).toBe(1);

    // Check root node default value is 5
    const weightValue = await page.locator('#nodeWeight').inputValue();
    expect(weightValue).toBe('5');
  });

  test('node progress bar should be shown in detail panel', async ({ page }) => {
    // Open detail panel
    await page.evaluate(() => {
      const node = window.skillTree.cy.nodes()[0];
      node.trigger('tap');
    });

    await page.waitForTimeout(500);

    // Check progress bar exists
    const progressFill = await page.locator('#nodeProgressFill').count();
    const progressText = await page.locator('#nodeProgressText').count();

    expect(progressFill).toBe(1);
    expect(progressText).toBe(1);

    // Check progress text format
    const text = await page.locator('#nodeProgressText').textContent();
    expect(text).toMatch(/\d+% \(\d+\/\d+\)/);
  });

  test('weight field should auto-save', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const node = window.skillTree.cy.nodes()[0];
      node.trigger('tap');

      await new Promise(resolve => setTimeout(resolve, 500));

      // Change weight
      const weightField = document.getElementById('nodeWeight');
      weightField.value = '5';
      weightField.dispatchEvent(new Event('input'));

      await new Promise(resolve => setTimeout(resolve, 300));

      return node.data('weight');
    });

    expect(result).toBe(5);
  });

  test('selecting node should highlight all children', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const rootNode = window.skillTree.cy.nodes()[0];

      // Add some children
      window.skillTree.addChildNode(rootNode);
      window.skillTree.addChildNode(rootNode);

      await new Promise(resolve => setTimeout(resolve, 500));

      // Select root node
      rootNode.trigger('tap');

      await new Promise(resolve => setTimeout(resolve, 300));

      // Check if children are highlighted
      const children = window.skillTree.cy.nodes().filter(n => n.data('parentId') === rootNode.id());
      const highlightedChildren = children.filter(n => n.data('_childHighlight')).length;

      return {
        totalChildren: children.length,
        highlightedChildren: highlightedChildren,
        rootSelected: rootNode.data('_selected')
      };
    });

    expect(result.totalChildren).toBe(2);
    expect(result.highlightedChildren).toBe(2);
    expect(result.rootSelected).toBe(true);
  });

  test('weighted subtree progress should calculate correctly', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const rootNode = window.skillTree.cy.nodes()[0];

      // Set root weight to 2
      window.skillTree.updateNode(rootNode.id(), { weight: 2 });

      // Add child with weight 3
      window.skillTree.addChildNode(rootNode);
      const child = window.skillTree.cy.nodes().filter(n => n.data('parentId') === rootNode.id())[0];
      window.skillTree.updateNode(child.id(), { weight: 3 });

      await new Promise(resolve => setTimeout(resolve, 500));

      // Get initial progress (nothing completed, total should be 5)
      const initialProgress = rootNode.data('subtreeProgress');

      // Complete child
      window.skillTree.updateNode(child.id(), { completed: true });

      await new Promise(resolve => setTimeout(resolve, 500));

      // Get updated progress (child completed, should be 3/5)
      const afterChildProgress = rootNode.data('subtreeProgress');

      return {
        initialProgress,
        afterChildProgress
      };
    });

    expect(result.initialProgress.total).toBe(5);
    expect(result.initialProgress.completed).toBe(0);
    expect(result.afterChildProgress.total).toBe(5);
    expect(result.afterChildProgress.completed).toBe(3);
  });
});
