const { test, expect } = require('@playwright/test');

test.describe('UI Simplification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('#cy');
    await page.waitForTimeout(2000);
  });

  test('should have only a single Root node by default', async ({ page }) => {
    const nodes = await page.evaluate(() => {
      return window.skillTree.cy.nodes().map(n => ({
        label: n.data('label'),
        parent: n.data('parentId')
      }));
    });

    console.log('Nodes:', nodes);

    expect(nodes.length).toBe(1);
    expect(nodes[0].label).toBe('Root');
    expect(nodes[0].parent).toBeNull();
  });

  test('should not have New Tree, Export, or zoom control buttons', async ({ page }) => {
    const newTreeBtn = await page.locator('#newTreeBtn').count();
    const exportBtn = await page.locator('#exportBtn').count();
    const zoomInBtn = await page.locator('#zoomInBtn').count();
    const zoomOutBtn = await page.locator('#zoomOutBtn').count();
    const fitBtn = await page.locator('#fitBtn').count();
    const resetBtn = await page.locator('#resetBtn').count();

    expect(newTreeBtn).toBe(0);
    expect(exportBtn).toBe(0);
    expect(zoomInBtn).toBe(0);
    expect(zoomOutBtn).toBe(0);
    expect(fitBtn).toBe(0);
    expect(resetBtn).toBe(0);
  });

  test('context menu should have New Tree and Export Tree options', async ({ page }) => {
    const result = await page.evaluate(() => {
      const menu = document.getElementById('contextMenu');
      const newTree = menu.querySelector('[data-action="new-tree"]');
      const exportTree = menu.querySelector('[data-action="export-tree"]');

      return {
        hasNewTree: !!newTree,
        hasExportTree: !!exportTree,
        newTreeText: newTree ? newTree.textContent.trim() : null,
        exportTreeText: exportTree ? exportTree.textContent.trim() : null
      };
    });

    console.log('Context menu items:', result);

    expect(result.hasNewTree).toBe(true);
    expect(result.hasExportTree).toBe(true);
    expect(result.newTreeText).toContain('New Tree');
    expect(result.exportTreeText).toContain('Export Tree');
  });
});
