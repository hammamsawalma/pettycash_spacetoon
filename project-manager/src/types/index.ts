/**
 * Spacetoon Pocket — Centralized Type Re-exports
 * ═══════════════════════════════════════════════════════
 * Barrel file that re-exports shared domain types from their
 * co-located source files. Import from '@/types' for convenience.
 *
 * Component-specific prop types (ButtonProps, CardProps, etc.)
 * remain co-located with their components per React best practice.
 */

// ─── Auth & Session ──────────────────────────────────────────────────────────
export type { SessionData } from '@/lib/auth';

// ─── RBAC & Roles ────────────────────────────────────────────────────────────
export type { ProjectRole } from '@/lib/roles';

// ─── Financial Documents ─────────────────────────────────────────────────────
export type { VoucherData, VoucherType } from '@/lib/voucher';
export type { InvoiceVoucherData } from '@/lib/invoice-voucher';
export type { BrandingInfo } from '@/lib/document-branding';

// ─── Export & Reports ────────────────────────────────────────────────────────
export type { ExportColumn, ReportSummaryItem } from '@/lib/export-utils';

// ─── Data Import ─────────────────────────────────────────────────────────────
export type { ParsedPurchaseItem } from '@/lib/parse-excel';
