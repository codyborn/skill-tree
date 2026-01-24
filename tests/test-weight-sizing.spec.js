const { test, expect } = require('@playwright/test');

test.describe('Weight-Based Node Sizing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('#cy');
    await page.waitForTimeout(2000);
  });

  test('root node should start with weight 5', async ({ page }) => {
    const weight = await page.evaluate(() => {
      const node = window.skillTree.cy.nodes()[0];
      return node.data('weight');
    });

    expect(weight).toBe(5);
  });

  test('child nodes should start with weight 1', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const rootNode = window.skillTree.cy.nodes()[0];
      window.skillTree.addChildNode(rootNode);

      await new Promise(resolve => setTimeout(resolve, 500));

      const child = window.skillTree.cy.nodes().filter(n => n.data('parentId') === rootNode.id())[0];
      return child.data('weight');
    });

    expect(result).toBe(1);
  });

  test('nodes with higher weight should be larger', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const rootNode = window.skillTree.cy.nodes()[0];

      // Add two children with different weights
      window.skillTree.addChildNode(rootNode);
      window.skillTree.addChildNode(rootNode);

      await new Promise(resolve => setTimeout(resolve, 500));

      const children = window.skillTree.cy.nodes().filter(n => n.data('parentId') === rootNode.id());
      const child1 = children[0];
      const child2 = children[1];

      // Set different weights
      window.skillTree.updateNode(child1.id(), { weight: 1 });
      window.skillTree.updateNode(child2.id(), { weight: 10 });

      await new Promise(resolve => setTimeout(resolve, 300));

      return {
        child1Size: parseInt(child1.style('width')),
        child2Size: parseInt(child2.style('width')),
        rootSize: parseInt(rootNode.style('width'))
      };
    });

    console.log('Node sizes:', result);

    // Child with weight 10 should be larger than child with weight 1
    expect(result.child2Size).toBeGreaterThan(result.child1Size);

    // Root with weight 5 should be between the two
    expect(result.rootSize).toBeGreaterThan(result.child1Size);
    expect(result.rootSize).toBeLessThan(result.child2Size);

    // Check specific sizes based on formula: baseSize = 50 + (weight * 8)
    expect(result.child1Size).toBe(58); // 50 + 1*8
    expect(result.rootSize).toBe(90); // 50 + 5*8
    expect(result.child2Size).toBe(130); // 50 + 10*8
  });

  test('font size should scale with node weight', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const rootNode = window.skillTree.cy.nodes()[0];

      // Set an icon on root
      window.skillTree.updateNode(rootNode.id(), {
        iconData: { type: 'emoji', icon: '⚔️', color: '#ef4444' }
      });

      // Add child with weight 1
      window.skillTree.addChildNode(rootNode);
      const child = window.skillTree.cy.nodes().filter(n => n.data('parentId') === rootNode.id())[0];
      window.skillTree.updateNode(child.id(), {
        iconData: { type: 'emoji', icon: '🛡️', color: '#3b82f6' }
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        rootFontSize: parseFloat(rootNode.style('font-size')),
        childFontSize: parseFloat(child.style('font-size'))
      };
    });

    console.log('Font sizes:', result);

    // Root (weight 5) should have larger font than child (weight 1)
    expect(result.rootFontSize).toBeGreaterThan(result.childFontSize);
  });
});
