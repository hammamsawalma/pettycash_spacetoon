const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://stpocket.com/welcome');
  await page.waitForTimeout(2000);
  const btn = await page.$('button:has-text("الدخول لبوابة الفروع")');
  if (btn) {
      await btn.click();
      await page.waitForTimeout(2000);
  }
  const text = await page.innerText('body');
  console.log(text);
  await browser.close();
})();
