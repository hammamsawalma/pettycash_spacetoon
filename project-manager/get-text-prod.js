const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://stpocket.com/welcome');
  await page.waitForTimeout(4000);
  const text = await page.innerText('body');
  if (text.includes("الدخول لبوابة الفروع")) {
     console.log("SUCCESS: NEW BRANCHES PORTAL FOUND!");
  } else if (text.includes("ابدأ الآن")) {
     console.log("FAILURE: OLD START NOW BUTTON FOUND");
  } else {
     console.log("NEITHER BUTTON FOUND. Output:", text);
  }
  await browser.close();
})();
