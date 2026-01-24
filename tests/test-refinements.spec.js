const { test, expect } = require('@playwright/test');

test.describe('User Refinements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('#cy');
    await page.waitForTimeout(2000);
  });

  test('nodes should start with no icon and display text label', async ({ page }) => {
    const result = await page.evaluate(() => {
      const node = window.skillTree.cy.nodes()[0];
      return {
        iconData: node.data('iconData'),
        label: node.data('label'),
        renderedLabel: node.style('label')
      };
    });

    console.log('Node display:', result);

    // Should have null iconData
    expect(result.iconData).toBeNull();
    // Should show the text label "Root"
    expect(result.label).toBe('Root');
    expect(result.renderedLabel).toBe('Root');
  });

  test('child nodes should inherit parent color', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const rootNode = window.skillTree.cy.nodes()[0];

      // Set icon/color on root
      window.skillTree.updateNode(rootNode.id(), {
        iconData: { type: 'emoji', icon: '⚔️', color: '#ef4444' }
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      // Add child node
      window.skillTree.addChildNode(rootNode);

      await new Promise(resolve => setTimeout(resolve, 500));

      // Get child node
      const childNode = window.skillTree.cy.nodes().filter(n => n.data('parentId') === rootNode.id())[0];

      return {
        parentIconData: rootNode.data('iconData'),
        childIconData: childNode.data('iconData'),
        colorsMatch: rootNode.data('iconData')?.color === childNode.data('iconData')?.color
      };
    });

    console.log('Color inheritance:', result);

    expect(result.colorsMatch).toBe(true);
    expect(result.childIconData.color).toBe('#ef4444');
  });

  test('remove icon button should set iconData to null', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const rootNode = window.skillTree.cy.nodes()[0];

      // First set an icon
      window.skillTree.updateNode(rootNode.id(), {
        iconData: { type: 'emoji', icon: '🎮', color: '#6366f1' }
      });

      const beforeRemove = rootNode.data('iconData');

      // Open detail panel and icon picker
      rootNode.trigger('tap');
      await new Promise(resolve => setTimeout(resolve, 300));

      document.getElementById('iconPickerBtn').click();
      await new Promise(resolve => setTimeout(resolve, 300));

      // Click remove icon button
      document.getElementById('removeIconBtn').click();
      await new Promise(resolve => setTimeout(resolve, 500));

      const afterRemove = rootNode.data('iconData');
      const renderedLabel = rootNode.style('label');

      return {
        beforeRemove,
        afterRemove,
        renderedLabel
      };
    });

    console.log('Remove icon:', result);

    expect(result.beforeRemove).not.toBeNull();
    expect(result.afterRemove).toBeNull();
    expect(result.renderedLabel).toBe('Root');
  });

  test('auto-save should work on input changes', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const rootNode = window.skillTree.cy.nodes()[0];

      // Open detail panel
      rootNode.trigger('tap');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Change label
      const labelField = document.getElementById('nodeLabel');
      labelField.value = 'Updated Label';
      labelField.dispatchEvent(new Event('input'));

      await new Promise(resolve => setTimeout(resolve, 200));

      // Change description
      const descField = document.getElementById('nodeDescription');
      descField.value = 'Updated description';
      descField.dispatchEvent(new Event('input'));

      await new Promise(resolve => setTimeout(resolve, 200));

      // Toggle completion
      const checkbox = document.getElementById('nodeCompleted');
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change'));

      await new Promise(resolve => setTimeout(resolve, 200));

      return {
        label: rootNode.data('label'),
        description: rootNode.data('description'),
        completed: rootNode.data('completed')
      };
    });

    console.log('Auto-save result:', result);

    expect(result.label).toBe('Updated Label');
    expect(result.description).toBe('Updated description');
    expect(result.completed).toBe(true);
  });

  test('nodes should grow on hover (including text/icon)', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const rootNode = window.skillTree.cy.nodes()[0];

      // Get normal size
      const normalSize = {
        width: rootNode.style('width'),
        height: rootNode.style('height'),
        fontSize: rootNode.style('font-size')
      };

      // Trigger mouseover
      rootNode.trigger('mouseover');

      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 200));

      const hoverSize = {
        width: rootNode.style('width'),
        height: rootNode.style('height'),
        fontSize: rootNode.style('font-size')
      };

      // Trigger mouseout
      rootNode.trigger('mouseout');

      await new Promise(resolve => setTimeout(resolve, 200));

      const afterSize = {
        width: rootNode.style('width'),
        height: rootNode.style('height'),
        fontSize: rootNode.style('font-size')
      };

      return {
        normalSize,
        hoverSize,
        afterSize
      };
    });

    console.log('Hover sizes:', result);

    // Hover size should be larger (both dimensions and font)
    expect(parseInt(result.hoverSize.width)).toBeGreaterThan(parseInt(result.normalSize.width));
    expect(parseInt(result.hoverSize.height)).toBeGreaterThan(parseInt(result.normalSize.height));
    expect(parseInt(result.hoverSize.fontSize)).toBeGreaterThan(parseInt(result.normalSize.fontSize));

    // Should return to normal after mouseout (parse ints to handle "70" vs "70px")
    expect(parseInt(result.afterSize.width)).toBe(parseInt(result.normalSize.width));
    expect(parseInt(result.afterSize.height)).toBe(parseInt(result.normalSize.height));
    expect(parseInt(result.afterSize.fontSize)).toBe(parseInt(result.normalSize.fontSize));
  });
});
