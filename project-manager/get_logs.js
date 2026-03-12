const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("https://github.com/hammamsawalma/pettycash_spacetoon/actions/runs/23007684240");
  await page.waitForTimeout(5000);
  const text = await page.innerText('body');
  console.log("BODY CONTENT:");
  console.log(text.substring(0, 5000));
  await browser.close();
})();
