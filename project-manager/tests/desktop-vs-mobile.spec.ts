import { test, expect } from './fixtures/auth.fixture';

test('debug mobile project links', async ({ adminPage }) => {
  await adminPage.setViewportSize({ width: 375, height: 812 });
  await adminPage.goto('/projects', { waitUntil: 'domcontentloaded' });
  await adminPage.waitForTimeout(2000);
  
  const links = await adminPage.locator('a[href*="/projects/"]').all();
  console.log(`Found ${links.length} project links in mobile view`);
  
  for (let i = 0; i < links.length; i++) {
    const isVisible = await links[i].isVisible();
    const href = await links[i].getAttribute('href');
    const classList = await links[i].getAttribute('class');
    console.log(`Link ${i}: href=${href}, visible=${isVisible}, class=${classList}`);
  }
  
  await adminPage.screenshot({ path: 'mobile-projects-view.png' });
});
