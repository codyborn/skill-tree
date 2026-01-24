const { test, expect } = require('@playwright/test');

test.describe('Node Positioning', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000');
    await page.waitForSelector('#cy');
    await page.waitForTimeout(2000);
  });

  test('child nodes should be positioned away from parent', async ({ page }) => {
    // Get initial node positions
    const initialPositions = await page.evaluate(() => {
      const positions = {};
      window.skillTree.cy.nodes().forEach(node => {
        positions[node.id()] = {
          x: node.position().x,
          y: node.position().y,
          label: node.data('label')
        };
      });
      return positions;
    });

    console.log('Initial positions:', JSON.stringify(initialPositions, null, 2));

    // Directly add a child node programmatically
    const result = await page.evaluate(() => {
      const rootNode = window.skillTree.cy.nodes().filter(n => !n.data('parentId'))[0];
      if (!rootNode) return { error: 'No root node found' };

      const rootPos = { x: rootNode.position().x, y: rootNode.position().y };

      // Add child
      window.skillTree.addChildNode(rootNode);

      // Wait for layout to complete
      return new Promise(resolve => {
        setTimeout(() => {
          const newPositions = {};
          window.skillTree.cy.nodes().forEach(node => {
            newPositions[node.id()] = {
              x: node.position().x,
              y: node.position().y,
              label: node.data('label')
            };
          });
          resolve({ rootPos, newPositions });
        }, 1500);
      });
    });

    if (result.error) {
      console.error(result.error);
      expect(result.error).toBeUndefined();
      return;
    }

    console.log('New positions after adding child:', JSON.stringify(result.newPositions, null, 2));

    // Find the newly added node
    const nodeIds = Object.keys(result.newPositions);
    const newNodeId = nodeIds.find(id => !initialPositions[id]);

    expect(newNodeId).toBeDefined();

    if (newNodeId) {
      const newNode = result.newPositions[newNodeId];
      console.log(`New node "${newNode.label}" at position:`, newNode);

      // Check that the new node is not at (0, 0)
      expect(newNode.x).not.toBe(0);
      expect(newNode.y).not.toBe(0);

      // The new node should be positioned differently from its parent
      const distance = Math.sqrt(
        Math.pow(newNode.x - result.rootPos.x, 2) +
        Math.pow(newNode.y - result.rootPos.y, 2)
      );

      console.log(`Distance from parent: ${distance}px`);
      expect(distance).toBeGreaterThan(50); // Should be at least 50px away
    }
  });

  test('nodes should not overlap after layout', async ({ page }) => {
    await page.waitForTimeout(2000);

    const overlapping = await page.evaluate(() => {
      const nodes = window.skillTree.cy.nodes();
      const positions = nodes.map(n => ({
        id: n.id(),
        label: n.data('label'),
        x: n.position().x,
        y: n.position().y
      }));

      // Check for overlaps (nodes closer than 40px)
      const overlaps = [];
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const dist = Math.sqrt(
            Math.pow(positions[i].x - positions[j].x, 2) +
            Math.pow(positions[i].y - positions[j].y, 2)
          );
          if (dist < 40) {
            overlaps.push({
              node1: positions[i].label,
              node2: positions[j].label,
              distance: dist
            });
          }
        }
      }

      return overlaps;
    });

    console.log('Overlapping nodes:', overlapping);
    expect(overlapping.length).toBe(0);
  });
});
