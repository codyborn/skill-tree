const { test, expect } = require('@playwright/test');

test.describe('Fresh Start Test', () => {
  test('clear localStorage and verify tree loads correctly', async ({ page }) => {
    await page.goto('http://localhost:8000');

    // Clear localStorage
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Reload to get fresh tree
    await page.reload();
    await page.waitForSelector('#cy');
    await page.waitForTimeout(3000); // Wait for layout to complete

    // Get node positions
    const positions = await page.evaluate(() => {
      const positions = [];
      window.skillTree.cy.nodes().forEach(node => {
        positions.push({
          id: node.id(),
          label: node.data('label'),
          parent: node.data('parentId'),
          x: Math.round(node.position().x),
          y: Math.round(node.position().y)
        });
      });
      return positions.sort((a, b) => a.y - b.y); // Sort by Y position
    });

    console.log('\n=== Node Positions (sorted by Y) ===');
    positions.forEach(p => {
      console.log(`${p.label.padEnd(35)} - Y: ${p.y}, X: ${p.x}, Parent: ${p.parent || 'ROOT'}`);
    });

    // Check for overlaps
    const overlaps = [];
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dist = Math.sqrt(
          Math.pow(positions[i].x - positions[j].x, 2) +
          Math.pow(positions[i].y - positions[j].y, 2)
        );
        if (dist < 60) { // Nodes should be at least 60px apart
          overlaps.push({
            node1: positions[i].label,
            node2: positions[j].label,
            distance: Math.round(dist)
          });
        }
      }
    }

    console.log('\n=== Overlapping Nodes ===');
    if (overlaps.length === 0) {
      console.log('No overlaps - nodes are properly spaced! ✓');
    } else {
      console.log('Found overlaps:');
      overlaps.forEach(o => {
        console.log(`  ${o.node1} <-> ${o.node2}: ${o.distance}px apart`);
      });
    }

    // Check that nodes are in hierarchical layers
    const yPositions = [...new Set(positions.map(p => p.y))].sort((a, b) => a - b);
    console.log('\n=== Y Position Layers ===');
    console.log(`Number of layers: ${yPositions.length}`);
    console.log(`Layers: ${yPositions.join(', ')}`);

    // With just a root node, should have 1 layer. When child nodes are added, should have more.
    expect(yPositions.length).toBeGreaterThanOrEqual(1);

    // Overlaps should be minimal
    expect(overlaps.length).toBeLessThan(2); // Allow at most 1 slight overlap
  });

  test('adding a child node positions it correctly', async ({ page }) => {
    await page.goto('http://localhost:8000');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('#cy');
    await page.waitForTimeout(2000);

    // Find the root node and add a child programmatically
    const result = await page.evaluate(() => {
      const rootNode = window.skillTree.cy.nodes().filter(n => !n.data('parentId'))[0];
      if (!rootNode) return { error: 'No root node found' };

      const beforeCount = window.skillTree.cy.nodes().length;
      const rootPos = { x: rootNode.position().x, y: rootNode.position().y };

      // Add child
      window.skillTree.addChildNode(rootNode);

      // Wait a bit for layout
      return new Promise(resolve => {
        setTimeout(() => {
          const afterCount = window.skillTree.cy.nodes().length;
          const newNode = window.skillTree.cy.nodes().filter(n =>
            n.data('parentId') === rootNode.id() && n.data('label') === 'New Skill'
          )[0];

          if (newNode) {
            const newPos = { x: newNode.position().x, y: newNode.position().y };
            const distance = Math.sqrt(
              Math.pow(newPos.x - rootPos.x, 2) +
              Math.pow(newPos.y - rootPos.y, 2)
            );

            resolve({
              beforeCount,
              afterCount,
              rootPos,
              newPos,
              distance: Math.round(distance)
            });
          } else {
            resolve({ error: 'New node not found' });
          }
        }, 1500); // Wait for layout animation
      });
    });

    console.log('\n=== Add Child Result ===');
    console.log(JSON.stringify(result, null, 2));

    expect(result.error).toBeUndefined();
    expect(result.afterCount).toBe(result.beforeCount + 1);
    expect(result.distance).toBeGreaterThan(60); // Should be well separated
  });
});
