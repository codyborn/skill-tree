const { test, expect } = require('@playwright/test');

test.describe('Game Aesthetics & Icon Picker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('#cy');
    await page.waitForTimeout(2000);
  });

  test('should load with necessary libraries', async ({ page }) => {
    const result = await page.evaluate(() => {
      return {
        cytoscapeAvailable: typeof cytoscape !== 'undefined',
        iconPickerAvailable: typeof IconPicker !== 'undefined',
        nodeRendererAvailable: typeof NodeRenderer !== 'undefined'
      };
    });

    console.log('Libraries:', result);

    expect(result.cytoscapeAvailable).toBe(true);
    expect(result.iconPickerAvailable).toBe(true);
    expect(result.nodeRendererAvailable).toBe(true);
  });

  test('nodes should start with no icon (null iconData)', async ({ page }) => {
    const result = await page.evaluate(() => {
      const node = window.skillTree.cy.nodes()[0];
      return {
        iconData: node.data('iconData'),
        hasSubtreeCompletion: node.data('subtreeCompletion') !== undefined,
        label: node.data('label')
      };
    });

    console.log('Node data:', result);

    // Nodes should start with null iconData (no default icon)
    expect(result.iconData).toBeNull();
    expect(result.hasSubtreeCompletion).toBe(true);
    expect(result.label).toBe('Root');
  });

  test('detail panel should have icon picker button', async ({ page }) => {
    // Click on root node to open detail panel
    await page.evaluate(() => {
      const node = window.skillTree.cy.nodes()[0];
      node.trigger('tap');
    });

    await page.waitForTimeout(500);

    const iconPickerBtn = await page.locator('#iconPickerBtn').count();
    const addChildBtn = await page.locator('#addChildPanelBtn').count();
    const nodeIconDisplay = await page.locator('#nodeIconDisplay').count();

    expect(iconPickerBtn).toBe(1);
    expect(addChildBtn).toBe(1);
    expect(nodeIconDisplay).toBe(1);
  });

  test('should not have image URL field in detail panel', async ({ page }) => {
    // Click on root node to open detail panel
    await page.evaluate(() => {
      const node = window.skillTree.cy.nodes()[0];
      node.trigger('tap');
    });

    await page.waitForTimeout(500);

    const imageURLField = await page.locator('#nodeImageURL').count();
    expect(imageURLField).toBe(0);
  });

  test('multi-directional layout should position nodes in different directions', async ({ page }) => {
    // Add several child nodes
    const positions = await page.evaluate(async () => {
      const rootNode = window.skillTree.cy.nodes()[0];

      // Add 4 children
      for (let i = 0; i < 4; i++) {
        window.skillTree.addChildNode(rootNode);
      }

      // Wait for layout
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Get positions
      const positions = [];
      window.skillTree.cy.nodes().forEach(node => {
        positions.push({
          id: node.id(),
          label: node.data('label'),
          x: Math.round(node.position().x),
          y: Math.round(node.position().y)
        });
      });
      return positions;
    });

    console.log('Node positions:', positions);

    // Should have 5 nodes total (1 root + 4 children)
    expect(positions.length).toBe(5);

    // Get unique X and Y positions
    const xPositions = [...new Set(positions.map(p => p.x))];
    const yPositions = [...new Set(positions.map(p => p.y))];

    console.log('Unique X positions:', xPositions.length);
    console.log('Unique Y positions:', yPositions.length);

    // With cose layout, nodes should spread in multiple directions
    // Should have variety in both X and Y positions
    expect(xPositions.length).toBeGreaterThan(1);
    expect(yPositions.length).toBeGreaterThan(1);
  });

  test('subtree completion should be calculated', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const rootNode = window.skillTree.cy.nodes()[0];

      // Add 2 children
      window.skillTree.addChildNode(rootNode);
      window.skillTree.addChildNode(rootNode);

      await new Promise(resolve => setTimeout(resolve, 500));

      // Check root subtree completion (0 completed / 3 total = 0)
      const rootCompletion = rootNode.data('subtreeCompletion');

      // Mark root complete
      window.skillTree.updateNode(rootNode.id(), { completed: true });

      // Check completion again (1 completed / 3 total = 0.33)
      const rootCompletionAfter = rootNode.data('subtreeCompletion');

      return {
        before: rootCompletion,
        after: rootCompletionAfter,
        afterGreaterThanBefore: rootCompletionAfter > rootCompletion
      };
    });

    console.log('Subtree completion:', result);

    expect(result.before).toBe(0);
    expect(result.afterGreaterThanBefore).toBe(true);
  });
});
