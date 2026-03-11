import { test, expect } from '@playwright/test';

test('production test', async ({ page }) => {
  await page.goto('https://stpocket.com/welcome');
  
  await page.waitForSelector('text=Spacetoon Pocket', { state: 'visible', timeout: 10000 });
  await page.screenshot({ path: 'prod-welcome.png' });

  // Click Access Portal
  const btn = await page.$('button:has-text("الدخول لبوابة الفروع")');
  if (btn) await btn.click();
  
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'prod-branches.png' });

  // Click Qatar
  const qatar = await page.$('button:has-text("قطر")');
  if (qatar) {
      await qatar.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'prod-connecting.png' }); // Capture connecting state

      await page.waitForURL('**/login**', { timeout: 3000 });
      await page.waitForTimeout(1000); // Give it time to render the login page
      await page.screenshot({ path: 'prod-login.png' }); // Capture personalized login state
  } else {
      console.log('Qatar branch button not found!');
  }
});
