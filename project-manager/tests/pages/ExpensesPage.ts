import { Page, Locator, expect } from '@playwright/test';

export class ExpensesPage {
    readonly page: Page;
    readonly confirmReceiptButton: Locator;
    readonly signModalHeader: Locator;
    readonly signatureCanvas: Locator;
    readonly finalizeConfirmButton: Locator;
    readonly rejectButton: Locator;
    readonly rejectReasonTextarea: Locator;
    readonly finalizeRejectButton: Locator;

    constructor(page: Page) {
        this.page = page;
        
        // Locators based on MyCustodiesClient UI
        this.confirmReceiptButton = page.getByRole('button', { name: /توقيع واستلام|Sign & Receive/i });
        this.signModalHeader = page.locator('h3', { hasText: /توقيع استلام|Sign Custody/i });
        this.signatureCanvas = page.locator('canvas'); // SignaturePad component
        this.finalizeConfirmButton = page.getByRole('button', { name: /تأكيد الاستلام|Confirm Receipt/i });
        
        // Rejection locators
        this.rejectButton = page.locator('button.bg-red-50'); // The XCircle button
        this.rejectReasonTextarea = page.locator('textarea[placeholder*="سبب الرفض"]');
        this.finalizeRejectButton = page.getByRole('button', { name: /تأكيد الرفض|Confirm Rejection/i });
    }

    async navigate() {
        await this.page.goto('/my-custodies');
        // Wait for page to drop hydration state fully
        await this.page.waitForLoadState('networkidle');
    }

    async verifyPendingCustodyExists(amount: number) {
        // Assert the formatted amount exists in the pending cards
        const formattedAmount = amount.toLocaleString('en-US');
        await expect(this.page.locator(`text=${formattedAmount}`).first()).toBeVisible();
    }

    async signAndConfirm() {
        await this.confirmReceiptButton.first().click();
        await expect(this.signModalHeader).toBeVisible();

        // Simulate drawing on the canvas to activate the "Save" aspect 
        const canvasBox = await this.signatureCanvas.boundingBox();
        if (canvasBox) {
            await this.page.mouse.move(canvasBox.x + 10, canvasBox.y + 10);
            await this.page.mouse.down();
            await this.page.mouse.move(canvasBox.x + 50, canvasBox.y + 50);
            await this.page.mouse.up();
        }

        // Click confirm
        await this.finalizeConfirmButton.click();
        
        // Wait for toast and refresh completion
        await expect(this.signModalHeader).not.toBeVisible({ timeout: 10000 });
    }

    async rejectCustody(reason: string) {
        await this.rejectButton.first().click();
        await expect(this.rejectReasonTextarea).toBeVisible();
        await this.rejectReasonTextarea.fill(reason);
        await this.finalizeRejectButton.click();
        
        // Wait for removal from UI (it either moves to rejected section or disappears from top)
        await expect(this.rejectReasonTextarea).not.toBeVisible({ timeout: 10000 });
    }
}
