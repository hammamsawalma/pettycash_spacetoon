/**
 * Debug test to capture screenshots of list pages
 */
import { test, expect } from '../fixtures/auth.fixture';

test('DEBUG: capture page screenshots', async ({ adminPage }) => {
    // Invoice page
    await adminPage.goto('/invoices', { waitUntil: 'networkidle', timeout: 30_000 });
    await adminPage.waitForTimeout(3000);
    await adminPage.screenshot({ path: 'test-results/debug-invoices.png', fullPage: true });

    // Check what's on the page
    const bodyText = await adminPage.textContent('body');
    console.log('INVOICES PAGE TEXT LENGTH:', bodyText?.length);
    console.log('Contains "عرض الفاتورة":', bodyText?.includes('عرض الفاتورة'));
    console.log('Contains "لا توجد فواتير":', bodyText?.includes('لا توجد فواتير'));

    // Check for presence of the button
    const btnCount = await adminPage.locator('button[title="عرض الفاتورة"]').count();
    console.log('BUTTONS with title عرض الفاتورة:', btnCount);

    // Check cursor-pointer elements
    const cpCount = await adminPage.locator('.cursor-pointer').count();
    console.log('Elements with cursor-pointer:', cpCount);

    // Projects page
    await adminPage.goto('/projects', { waitUntil: 'networkidle', timeout: 30_000 });
    await adminPage.waitForTimeout(3000);
    await adminPage.screenshot({ path: 'test-results/debug-projects.png', fullPage: true });
    const projText = await adminPage.textContent('body');
    console.log('PROJECTS TEXT LENGTH:', projText?.length);
    const projCards = await adminPage.locator('.cursor-pointer').count();
    console.log('PROJECT cursor-pointer elements:', projCards);

    // Employees page
    await adminPage.goto('/employees', { waitUntil: 'networkidle', timeout: 30_000 });
    await adminPage.waitForTimeout(5000);
    await adminPage.screenshot({ path: 'test-results/debug-employees.png', fullPage: true });
    const empText = await adminPage.textContent('body');
    console.log('EMPLOYEES TEXT LENGTH:', empText?.length);
    console.log('Contains "المزيد":', empText?.includes('المزيد'));
    const moreBtns = await adminPage.locator('button:has-text("المزيد")').count();
    console.log('BUTTONS with text المزيد:', moreBtns);

    // Purchases page
    await adminPage.goto('/purchases', { waitUntil: 'networkidle', timeout: 30_000 });
    await adminPage.waitForTimeout(3000);
    await adminPage.screenshot({ path: 'test-results/debug-purchases.png', fullPage: true });
    const purchText = await adminPage.textContent('body');
    console.log('PURCHASES TEXT LENGTH:', purchText?.length);
    const purchRows = await adminPage.locator('tr.cursor-pointer').count();
    console.log('Purchase table rows:', purchRows);
});
