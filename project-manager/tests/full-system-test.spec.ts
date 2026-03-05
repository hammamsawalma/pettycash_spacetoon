import { test, expect, Page } from '@playwright/test';

const users = {
    ADMIN: { email: 'admin@pocket.com', pass: '123456' },
    COORDINATOR: { email: 'coordinator@pocket.com', pass: '123456' },
    ACCOUNTANT: { email: 'accountant@pocket.com', pass: '123456' },
    EMPLOYEE: { email: 'emp1@pocket.com', pass: '123456' },
};

const routes = [
    { path: '/', name: 'Dashboard', roles: ['ADMIN', 'COORDINATOR', 'ACCOUNTANT', 'EMPLOYEE'] },
    { path: '/projects', name: 'Projects', roles: ['ADMIN', 'COORDINATOR', 'EMPLOYEE'] },
    { path: '/employees', name: 'Employees', roles: ['ADMIN'] }, // Typically only admins see all employees
    { path: '/invoices', name: 'Invoices', roles: ['ADMIN', 'ACCOUNTANT'] },
    { path: '/purchases', name: 'Purchases', roles: ['ADMIN', 'ACCOUNTANT', 'EMPLOYEE'] }, // Employee might create
    { path: '/deposits', name: 'Deposits', roles: ['ADMIN', 'ACCOUNTANT'] },
    { path: '/chat', name: 'Chat', roles: ['ADMIN', 'COORDINATOR', 'ACCOUNTANT', 'EMPLOYEE'] },
    { path: '/notifications', name: 'Notifications', roles: ['ADMIN', 'COORDINATOR', 'ACCOUNTANT', 'EMPLOYEE'] },
];

async function loginUser(page: Page, email: string, pass: string) {
    await page.goto('/login');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', pass);
    await page.click('button[type="submit"]');
    // Wait for navigation with a generous timeout
    await page.waitForURL('http://localhost:3000/', { timeout: 15000 }).catch(() => { });
    await page.waitForSelector('nav', { timeout: 8000 }).catch(() => { });
}

async function verifyRouteAccess(page: Page, role: string) {
    console.log(`\n--- Testing Route Access for ${role} ---`);
    for (const route of routes) {
        await page.goto(route.path);
        // Wait for the page to settle
        await page.waitForTimeout(600);
        const url = page.url();

        // Check if the role is allowed
        const isAllowed = route.roles.includes(role);
        const isOnTarget = url.includes(route.path);
        const isRedirectedToDashboardOrLogin = url.endsWith('/') || url.includes('/login');

        // Check if there's a React error overlay or known 404/unauth text
        const hasError = await page.evaluate(() => {
            const bodyText = document.body.innerText.toLowerCase();
            return bodyText.includes('client-side exception') ||
                bodyText.includes('unauthorized') ||
                bodyText.includes('application error');
        });

        if (hasError) {
            console.log(`[BUG] ${role} navigating to ${route.path} caused an Application Error!`);
        } else if (isAllowed && !isOnTarget && isRedirectedToDashboardOrLogin) {
            console.log(`[BUG] ${role} SHOULD access ${route.path} but was redirected to ${url}`);
        } else if (!isAllowed && isOnTarget) {
            console.log(`[BUG] ${role} SHOULD NOT access ${route.path} but page loaded! (Unauthorized access)`);
        } else {
            console.log(`[SUCCESS] ${role} access to ${route.path} handled correctly (URL: ${url}).`);
        }
    }
}

async function testEdgeCaseForms(page: Page, role: string) {
    // Test empty form submission for Projects (if Admin or Coordinator)
    if (role === 'ADMIN' || role === 'COORDINATOR') {
        await page.goto('/projects');
        await page.waitForTimeout(1000);
        // Find Add Project button
        const addBtn = await page.$('button:has-text("اضافة مشروع"), button:has-text("Add Project"), a:has-text("اضافة مشروع")');
        if (addBtn) {
            await addBtn.click();
            await page.waitForTimeout(1000);
            const submitBtn = await page.$('button:has-text("حفظ"), button[type="submit"]');
            if (submitBtn) {
                await submitBtn.click();
                await page.waitForTimeout(500);
                // Check for toast or validation errors
                const hasErrors = await page.evaluate(() => {
                    const bodyText = document.body.innerText;
                    return bodyText.includes('مطلوب') || bodyText.includes('required') || document.querySelectorAll('.text-red-500').length > 0;
                });
                if (!hasErrors) {
                    console.log(`[BUG] ${role} was able to submit an EMPTY project form without visible validation errors!`);
                } else {
                    console.log(`[SUCCESS] ${role} project form validation caught empty fields.`);
                }
            }
        }
    }
}

test.describe('Comprehensive Role and Edge Case Testing', () => {
    for (const [role, creds] of Object.entries(users)) {
        test(`Test full system access and edge cases for ${role}`, async ({ page }) => {
            // Allow up to 60s for this multi-route test
            test.setTimeout(60000);

            // Capture unexpected console errors
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    console.log(`[CONSOLE ERROR] (${role}): ${msg.text()}`);
                }
            });

            page.on('pageerror', exception => {
                console.log(`[FRONTEND UNCAUGHT EXCEPTION] (${role}): ${exception}`);
            });

            await loginUser(page, creds.email, creds.pass);
            await verifyRouteAccess(page, role);
            await testEdgeCaseForms(page, role);
        });
    }
});
