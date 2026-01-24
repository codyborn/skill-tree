const { test, expect } = require('@playwright/test');

test.describe('Hover Effect with Icons', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('#cy');
    await page.waitForTimeout(2000);
  });

  test('emoji icon should grow on hover', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const rootNode = window.skillTree.cy.nodes()[0];

      // Set an emoji icon
      window.skillTree.updateNode(rootNode.id(), {
        iconData: { type: 'emoji', icon: '⚔️', color: '#ef4444' }
      });

      await new Promise(resolve => setTimeout(resolve, 300));

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

    console.log('Emoji hover sizes:', result);

    // Normal emoji should be 32px
    expect(parseInt(result.normalSize.fontSize)).toBe(32);

    // Hover emoji should be 40px
    expect(parseInt(result.hoverSize.fontSize)).toBe(40);

    // Should return to normal
    expect(parseInt(result.afterSize.fontSize)).toBe(32);

    // Dimensions should also grow
    expect(parseInt(result.hoverSize.width)).toBeGreaterThan(parseInt(result.normalSize.width));
    expect(parseInt(result.hoverSize.height)).toBeGreaterThan(parseInt(result.normalSize.height));
  });
});
