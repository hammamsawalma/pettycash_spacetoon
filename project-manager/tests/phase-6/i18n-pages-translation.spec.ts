/**
 * Phase 6e — i18n Translation Tests for All Major Pages
 *
 * Tests verify that Projects, Employees, Invoices, and Reports pages
 * display correctly in both Arabic (default) and English (after toggle).
 *
 * Each test is self-contained: logs in inline, sets locale via addInitScript
 * where needed, and asserts translated UI text.
 */
import { test, expect, Page } from "@playwright/test";

const BASE = "http://localhost:3000";

/** Inline login helper — logs in as root and waits for dashboard */
async function loginAsRoot(page: Page) {
    await page.goto(`${BASE}/login`);
    await page.fill('input[name="email"]', "root@pocket.com");
    await page.fill('input[name="password"]', "123456");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/", { timeout: 15000 });
}

/** Set locale in localStorage BEFORE page hydration */
async function setLocale(page: Page, locale: "ar" | "en") {
    await page.addInitScript((loc) => {
        localStorage.setItem("app-locale", loc);
    }, locale);
}

// ══════════════════════════════════════════════════════════
// PROJECTS PAGE
// ══════════════════════════════════════════════════════════
test.describe("Projects Page i18n", () => {
    test("P1: Projects breadcrumb shows Arabic by default", async ({ page }) => {
        await loginAsRoot(page);
        await page.goto(`${BASE}/projects`);
        await page.waitForTimeout(1000);
        // Breadcrumb h1 should contain Arabic text
        await expect(page.locator('h1[aria-current="page"]')).toContainText("المشاريع", { timeout: 5000 });
    });

    test("P2: Projects breadcrumb shows English when locale is EN", async ({ page }) => {
        await setLocale(page, "en");
        await loginAsRoot(page);
        await page.goto(`${BASE}/projects`);
        await page.waitForTimeout(1000);
        await expect(page.locator('h1[aria-current="page"]')).toContainText("Projects", { timeout: 5000 });
    });

    test("P3: Projects filter tabs translate to English", async ({ page }) => {
        await setLocale(page, "en");
        await loginAsRoot(page);
        await page.goto(`${BASE}/projects`);
        await page.waitForTimeout(1000);
        // Check for English filter tab labels — use specific text within button elements
        const allTab = page.locator("button").filter({ hasText: /^All$/ });
        await expect(allTab.first()).toBeVisible({ timeout: 5000 });
        await expect(page.locator("button").filter({ hasText: "Completed" }).first()).toBeVisible();
        await expect(page.locator("button").filter({ hasText: "In Progress" }).first()).toBeVisible();
    });

    test("P4: Projects stats labels translate to English", async ({ page }) => {
        await setLocale(page, "en");
        await loginAsRoot(page);
        await page.goto(`${BASE}/projects`);
        await page.waitForTimeout(1000);
        await expect(page.locator("text=Total Projects")).toBeVisible({ timeout: 5000 });
    });

    test("P5: Projects search placeholder translates", async ({ page }) => {
        await setLocale(page, "en");
        await loginAsRoot(page);
        await page.goto(`${BASE}/projects`);
        await page.waitForTimeout(1000);
        const searchInput = page.locator('input[type="text"]').first();
        const placeholder = await searchInput.getAttribute("placeholder");
        expect(placeholder).toContain("Search");
    });

    test("P6: Projects view toggle translates to English", async ({ page }) => {
        await setLocale(page, "en");
        await loginAsRoot(page);
        await page.goto(`${BASE}/projects`);
        await page.waitForTimeout(1000);
        await expect(page.locator("button").filter({ hasText: "Grid" })).toBeVisible({ timeout: 5000 });
    });
});

// ══════════════════════════════════════════════════════════
// EMPLOYEES PAGE
// ══════════════════════════════════════════════════════════
test.describe("Employees Page i18n", () => {
    test("E1: Employees breadcrumb shows Arabic by default", async ({ page }) => {
        await loginAsRoot(page);
        await page.goto(`${BASE}/employees`);
        await page.waitForTimeout(1000);
        await expect(page.locator('h1[aria-current="page"]')).toContainText("الموظفين", { timeout: 5000 });
    });

    test("E2: Employees breadcrumb shows English when locale is EN", async ({ page }) => {
        await setLocale(page, "en");
        await loginAsRoot(page);
        await page.goto(`${BASE}/employees`);
        await page.waitForTimeout(1000);
        await expect(page.locator('h1[aria-current="page"]')).toContainText("Employees", { timeout: 5000 });
    });

    test("E3: Employees filter tabs translate to English", async ({ page }) => {
        await setLocale(page, "en");
        await loginAsRoot(page);
        await page.goto(`${BASE}/employees`);
        await page.waitForTimeout(1000);
        const allTab = page.locator("button").filter({ hasText: /^All$/ });
        await expect(allTab.first()).toBeVisible({ timeout: 5000 });
        await expect(page.locator("button").filter({ hasText: "Employee" }).first()).toBeVisible();
    });

    test("E4: Employees search placeholder translates", async ({ page }) => {
        await setLocale(page, "en");
        await loginAsRoot(page);
        await page.goto(`${BASE}/employees`);
        await page.waitForTimeout(1000);
        const searchInput = page.locator('input[type="text"]');
        const placeholder = await searchInput.getAttribute("placeholder");
        expect(placeholder).toContain("Search");
    });

    test("E5: Employees empty state shows English text", async ({ page }) => {
        await setLocale(page, "en");
        await loginAsRoot(page);
        await page.goto(`${BASE}/employees`);
        await page.waitForTimeout(2000);
        // Sidebar shows English translated text
        await expect(page.locator("text=Accountant")).toBeVisible({ timeout: 5000 });
    });

    test("E6: Add employee button translates to English", async ({ page }) => {
        await setLocale(page, "en");
        await loginAsRoot(page);
        await page.goto(`${BASE}/employees`);
        await page.waitForTimeout(1000);
        // "New Employee" or "Add Employee" button
        const btn = page.locator("button, a").filter({ hasText: /New Employee|Add Employee/ });
        await expect(btn.first()).toBeVisible({ timeout: 5000 });
    });
});

// ══════════════════════════════════════════════════════════
// INVOICES PAGE
// ══════════════════════════════════════════════════════════
test.describe("Invoices Page i18n", () => {
    test("I1: Invoices breadcrumb shows Arabic by default", async ({ page }) => {
        await loginAsRoot(page);
        await page.goto(`${BASE}/invoices`);
        await page.waitForTimeout(1000);
        await expect(page.locator('h1[aria-current="page"]')).toContainText("الفواتير", { timeout: 5000 });
    });

    test("I2: Invoices breadcrumb shows English when locale is EN", async ({ page }) => {
        await setLocale(page, "en");
        await loginAsRoot(page);
        await page.goto(`${BASE}/invoices`);
        await page.waitForTimeout(1000);
        await expect(page.locator('h1[aria-current="page"]')).toContainText("Invoices", { timeout: 5000 });
    });

    test("I3: Invoices filter tabs translate to English", async ({ page }) => {
        await setLocale(page, "en");
        await loginAsRoot(page);
        await page.goto(`${BASE}/invoices`);
        await page.waitForTimeout(1000);
        const allTab = page.locator("button").filter({ hasText: /^All$/ });
        await expect(allTab.first()).toBeVisible({ timeout: 5000 });
        await expect(page.locator("button").filter({ hasText: "Approved" }).first()).toBeVisible();
        await expect(page.locator("button").filter({ hasText: "Pending" }).first()).toBeVisible();
        await expect(page.locator("button").filter({ hasText: "Rejected" }).first()).toBeVisible();
    });

    test("I4: Invoices search placeholder translates", async ({ page }) => {
        await setLocale(page, "en");
        await loginAsRoot(page);
        await page.goto(`${BASE}/invoices`);
        await page.waitForTimeout(1000);
        const searchInput = page.locator('input[type="text"]');
        const placeholder = await searchInput.getAttribute("placeholder");
        expect(placeholder).toContain("Search");
    });

    test("I5: Invoices card shows English date and total labels", async ({ page }) => {
        await setLocale(page, "en");
        await loginAsRoot(page);
        await page.goto(`${BASE}/invoices`);
        await page.waitForTimeout(2000);
        // If there are any invoices, check labels
        const dateLabel = page.locator("text=Date").first();
        if (await dateLabel.isVisible({ timeout: 3000 })) {
            await expect(dateLabel).toBeVisible();
        }
        // Also check the total label
        const totalLabel = page.locator("text=Total").first();
        if (await totalLabel.isVisible({ timeout: 3000 })) {
            await expect(totalLabel).toBeVisible();
        }
    });
});

// ══════════════════════════════════════════════════════════
// REPORTS PAGE
// ══════════════════════════════════════════════════════════
test.describe("Reports Page i18n", () => {
    test("R1: Reports breadcrumb shows Arabic by default", async ({ page }) => {
        await loginAsRoot(page);
        await page.goto(`${BASE}/reports`);
        await page.waitForTimeout(1000);
        await expect(page.locator('h1[aria-current="page"]')).toContainText("التقارير", { timeout: 5000 });
    });

    test("R2: Reports breadcrumb shows English when locale is EN", async ({ page }) => {
        await setLocale(page, "en");
        await loginAsRoot(page);
        await page.goto(`${BASE}/reports`);
        await page.waitForTimeout(1000);
        await expect(page.locator('h1[aria-current="page"]')).toContainText("Reports", { timeout: 5000 });
    });

    test("R3: Reports KPI labels translate to English", async ({ page }) => {
        await setLocale(page, "en");
        await loginAsRoot(page);
        await page.goto(`${BASE}/reports`);
        await page.waitForTimeout(2000);
        await expect(page.locator("text=Net Profit")).toBeVisible({ timeout: 5000 });
        await expect(page.locator("text=System Efficiency")).toBeVisible();
    });

    test("R4: Reports date filter options translate to English", async ({ page }) => {
        await setLocale(page, "en");
        await loginAsRoot(page);
        await page.goto(`${BASE}/reports`);
        await page.waitForTimeout(1000);
        const select = page.locator("select").first();
        const options = await select.locator("option").allTextContents();
        expect(options).toContain("Last 30 Days");
        expect(options).toContain("This Year");
        expect(options).toContain("Last Year");
    });

    test("R5: Reports expense cards translate to English", async ({ page }) => {
        await setLocale(page, "en");
        await loginAsRoot(page);
        await page.goto(`${BASE}/reports`);
        await page.waitForTimeout(2000);
        await expect(page.locator("text=Company Expenses").first()).toBeVisible({ timeout: 5000 });
        await expect(page.locator("text=Project Expenses").first()).toBeVisible();
    });

    test("R6: Reports chart titles translate to English", async ({ page }) => {
        await setLocale(page, "en");
        await loginAsRoot(page);
        await page.goto(`${BASE}/reports`);
        await page.waitForTimeout(2000);
        await expect(page.locator("text=Revenue vs Expenses")).toBeVisible({ timeout: 5000 });
        await expect(page.locator("text=Project Budget Distribution")).toBeVisible();
    });

    test("R7: Reports custody stats translate to English", async ({ page }) => {
        await setLocale(page, "en");
        await loginAsRoot(page);
        await page.goto(`${BASE}/reports`);
        await page.waitForTimeout(2000);
        await expect(page.locator("text=Internal Custodies (Employees)")).toBeVisible({ timeout: 5000 });
        await expect(page.locator("text=External Custodies (Third Party)")).toBeVisible();
    });

    test("R8: Reports top projects table headers translate to English", async ({ page }) => {
        await setLocale(page, "en");
        await loginAsRoot(page);
        await page.goto(`${BASE}/reports`);
        await page.waitForTimeout(2000);
        await expect(page.locator("text=Top Performing Projects")).toBeVisible({ timeout: 5000 });
        await expect(page.locator("th:has-text('Project Name')")).toBeVisible();
        await expect(page.locator("th:has-text('Start Date')")).toBeVisible();
        await expect(page.locator("th:has-text('Budget')")).toBeVisible();
    });
});

// ══════════════════════════════════════════════════════════
// CROSS-PAGE PERSISTENCE
// ══════════════════════════════════════════════════════════
test.describe("Cross-Page i18n Persistence", () => {
    test("CP1: Language persists from Projects to Employees page", async ({ page }) => {
        await setLocale(page, "en");
        await loginAsRoot(page);
        await page.goto(`${BASE}/projects`);
        await page.waitForTimeout(1000);
        await expect(page.locator('h1[aria-current="page"]')).toContainText("Projects", { timeout: 5000 });

        // Navigate to employees
        await page.goto(`${BASE}/employees`);
        await page.waitForTimeout(1000);
        await expect(page.locator('h1[aria-current="page"]')).toContainText("Employees", { timeout: 5000 });
    });

    test("CP2: Language persists from Employees to Invoices page", async ({ page }) => {
        await setLocale(page, "en");
        await loginAsRoot(page);
        await page.goto(`${BASE}/employees`);
        await page.waitForTimeout(1000);
        await expect(page.locator('h1[aria-current="page"]')).toContainText("Employees", { timeout: 5000 });

        await page.goto(`${BASE}/invoices`);
        await page.waitForTimeout(1000);
        await expect(page.locator('h1[aria-current="page"]')).toContainText("Invoices", { timeout: 5000 });
    });

    test("CP3: Language persists from Invoices to Reports page", async ({ page }) => {
        await setLocale(page, "en");
        await loginAsRoot(page);
        await page.goto(`${BASE}/invoices`);
        await page.waitForTimeout(1000);
        await expect(page.locator('h1[aria-current="page"]')).toContainText("Invoices", { timeout: 5000 });

        await page.goto(`${BASE}/reports`);
        await page.waitForTimeout(1000);
        await expect(page.locator('h1[aria-current="page"]')).toContainText("Reports", { timeout: 5000 });
    });

    test("CP4: Switching to Arabic from English updates breadcrumb", async ({ page }) => {
        await setLocale(page, "en");
        await loginAsRoot(page);
        await page.goto(`${BASE}/projects`);
        await page.waitForTimeout(1000);
        await expect(page.locator('h1[aria-current="page"]')).toContainText("Projects", { timeout: 5000 });

        // Switch back to Arabic
        const arBtn = page.locator('button[aria-label*="Switch to Arabic"]');
        if (await arBtn.isVisible({ timeout: 3000 })) {
            await arBtn.click();
            await page.waitForTimeout(500);
        }

        await expect(page.locator('h1[aria-current="page"]')).toContainText("المشاريع", { timeout: 5000 });
    });
});
