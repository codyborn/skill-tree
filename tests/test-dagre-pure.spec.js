const { test } = require('@playwright/test');

test('test pure dagre layout without compound nodes', async ({ page }) => {
  await page.goto('http://localhost:8000');
  await page.waitForSelector('#cy');

  const result = await page.evaluate(() => {
    // Create a test graph WITHOUT parent property, only edges
    const testCy = cytoscape({
      headless: true,
      elements: [
        { data: { id: 'a' } },
        { data: { id: 'b' } },
        { data: { id: 'c' } },
        { data: { id: 'd' } },
        { data: { source: 'a', target: 'b' } },
        { data: { source: 'a', target: 'c' } },
        { data: { source: 'b', target: 'd' } }
      ]
    });

    const before = {};
    testCy.nodes().forEach(n => {
      before[n.id()] = { x: n.position().x, y: n.position().y };
    });

    const layout = testCy.layout({
      name: 'dagre',
      rankDir: 'TB',
      nodeSep: 80,
      rankSep: 100
    });

    layout.run();

    const after = {};
    testCy.nodes().forEach(n => {
      after[n.id()] = { x: n.position().x, y: n.position().y };
    });

    return { before, after };
  });

  console.log('\n=== Pure Dagre Test (no compound nodes) ===');
  console.log('BEFORE:', JSON.stringify(result.before, null, 2));
  console.log('AFTER:', JSON.stringify(result.after, null, 2));

  // Check if Y positions changed
  const yPositions = Object.values(result.after).map(p => p.y);
  const uniqueY = [...new Set(yPositions)];
  console.log('\nUnique Y positions:', uniqueY);
  console.log('Has hierarchy:', uniqueY.length > 1);
});
