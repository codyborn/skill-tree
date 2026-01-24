const { test } = require('@playwright/test');

test('debug dagre layout', async ({ page }) => {
  await page.goto('http://localhost:8000');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('#cy');
  await page.waitForTimeout(1000);

  // Check what's in the graph
  const graphInfo = await page.evaluate(() => {
    return {
      nodeCount: window.skillTree.cy.nodes().length,
      edgeCount: window.skillTree.cy.edges().length,
      nodes: window.skillTree.cy.nodes().map(n => ({
        id: n.id(),
        label: n.data('label'),
        parent: n.data('parent')
      })),
      edges: window.skillTree.cy.edges().map(e => ({
        id: e.id(),
        source: e.data('source'),
        target: e.data('target')
      })),
      dagreAvailable: typeof window.dagre !== 'undefined'
    };
  });

  console.log('\n=== Graph Structure ===');
  console.log(JSON.stringify(graphInfo, null, 2));

  // Manually run layout and check positions before/after
  const layoutTest = await page.evaluate(() => {
    const before = {};
    window.skillTree.cy.nodes().forEach(n => {
      before[n.data('label')] = { x: n.position().x, y: n.position().y };
    });

    // Try running layout manually
    const layout = window.skillTree.cy.layout({
      name: 'dagre',
      rankDir: 'TB',
      nodeSep: 80,
      rankSep: 100
    });

    return new Promise(resolve => {
      layout.on('layoutstop', () => {
        const after = {};
        window.skillTree.cy.nodes().forEach(n => {
          after[n.data('label')] = { x: n.position().x, y: n.position().y };
        });
        resolve({ before, after });
      });

      layout.run();
    });
  });

  console.log('\n=== Layout Before/After ===');
  console.log('BEFORE:', JSON.stringify(layoutTest.before, null, 2));
  console.log('AFTER:', JSON.stringify(layoutTest.after, null, 2));
});
