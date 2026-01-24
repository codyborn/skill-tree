const { test } = require('@playwright/test');

test('check console for errors on load', async ({ page }) => {
  const errors = [];
  const logs = [];

  page.on('console', msg => {
    const text = msg.text();
    logs.push({ type: msg.type(), text });
    if (msg.type() === 'error') {
      errors.push(text);
    }
  });

  page.on('pageerror', error => {
    errors.push(`Page error: ${error.message}`);
  });

  await page.goto('http://localhost:8000');
  await page.waitForTimeout(3000);

  console.log('\n=== All Console Messages ===');
  logs.forEach(log => {
    console.log(`[${log.type}] ${log.text}`);
  });

  console.log('\n=== Errors ===');
  if (errors.length === 0) {
    console.log('No errors!');
  } else {
    errors.forEach(err => console.log(err));
  }
});
