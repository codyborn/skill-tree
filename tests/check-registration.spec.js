const { test } = require('@playwright/test');

test('check dagre registration', async ({ page }) => {
  const messages = [];
  page.on('console', msg => {
    messages.push(`[${msg.type()}] ${msg.text()}`);
  });

  await page.goto('http://localhost:8000');
  await page.waitForSelector('#cy');
  await page.waitForTimeout(1000);

  console.log('\n=== Console Messages ===');
  messages.forEach(m => console.log(m));

  const checkExtensions = await page.evaluate(() => {
    // Check if dagre extension is available
    try {
      const testCy = cytoscape({ headless: true });
      let canCreate = false;
      try {
        const layout = testCy.layout({ name: 'dagre' });
        canCreate = layout !== null;
      } catch (e) {
        canCreate = false;
      }

      return {
        cytoscapeAvailable: typeof cytoscape !== 'undefined',
        dagreAvailable: typeof dagre !== 'undefined',
        cytoscapeDagreAvailable: typeof cytoscapeDagre !== 'undefined',
        canCreateDagreLayout: canCreate
      };
    } catch (e) {
      return { error: e.toString() };
    }
  });

  console.log('\n=== Extension Check ===');
  console.log(JSON.stringify(checkExtensions, null, 2));
});
