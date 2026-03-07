/**
 * Unit Tests: RBAC Permissions (permissions.ts)
 *
 * Tests the pure logic of: canDo(), isGlobalFinance(),
 * hasProjectRole(), isProjectCoordinator(), isProjectAccountant()
 *
 * No browser, no DB — pure function tests.
 * Run: npm test -- tests/unit/permissions.spec.ts
 */

import { test, expect } from '@playwright/test';
import {
    canDo,
    isGlobalFinance,
    hasProjectRole,
    isProjectCoordinator,
    isProjectAccountant,
} from '../../src/lib/permissions';

// ══════════════════════════════════════════════════════════════════════════════
//  canDo() — System-Level Role Permissions
// ══════════════════════════════════════════════════════════════════════════════
test.describe('canDo() — system-level permissions', () => {

    // ── Employees ────────────────────────────────────────────────────────────
    test('ADMIN can create employees', () => {
        expect(canDo('ADMIN', 'employees', 'create')).toBe(true);
    });

    test('USER cannot create employees', () => {
        expect(canDo('USER', 'employees', 'create')).toBe(false);
    });

    test('GLOBAL_ACCOUNTANT cannot create employees', () => {
        expect(canDo('GLOBAL_ACCOUNTANT', 'employees', 'create')).toBe(false);
    });

    test('ADMIN, GENERAL_MANAGER, GLOBAL_ACCOUNTANT can viewAll employees', () => {
        expect(canDo('ADMIN', 'employees', 'viewAll')).toBe(true);
        expect(canDo('GENERAL_MANAGER', 'employees', 'viewAll')).toBe(true);
        expect(canDo('GLOBAL_ACCOUNTANT', 'employees', 'viewAll')).toBe(true);
    });

    test('USER cannot viewAll employees', () => {
        expect(canDo('USER', 'employees', 'viewAll')).toBe(false);
    });

    test('All roles can view a single employee profile', () => {
        expect(canDo('ADMIN', 'employees', 'view')).toBe(true);
        expect(canDo('USER', 'employees', 'view')).toBe(true);
        expect(canDo('GLOBAL_ACCOUNTANT', 'employees', 'view')).toBe(true);
        expect(canDo('GENERAL_MANAGER', 'employees', 'view')).toBe(true);
    });

    test('Only management roles can viewSalaries', () => {
        expect(canDo('ADMIN', 'employees', 'viewSalaries')).toBe(true);
        expect(canDo('GENERAL_MANAGER', 'employees', 'viewSalaries')).toBe(true);
        expect(canDo('GLOBAL_ACCOUNTANT', 'employees', 'viewSalaries')).toBe(true);
        expect(canDo('USER', 'employees', 'viewSalaries')).toBe(false);
    });

    // ── Projects ─────────────────────────────────────────────────────────────
    test('Only ADMIN can create projects', () => {
        expect(canDo('ADMIN', 'projects', 'create')).toBe(true);
        expect(canDo('GENERAL_MANAGER', 'projects', 'create')).toBe(false);
        expect(canDo('GLOBAL_ACCOUNTANT', 'projects', 'create')).toBe(false);
        expect(canDo('USER', 'projects', 'create')).toBe(false);
    });

    test('Only ADMIN can close/reopen projects', () => {
        expect(canDo('ADMIN', 'projects', 'close')).toBe(true);
        expect(canDo('ADMIN', 'projects', 'reopen')).toBe(true);
        expect(canDo('GENERAL_MANAGER', 'projects', 'close')).toBe(false);
        expect(canDo('USER', 'projects', 'close')).toBe(false);
    });

    // ── Trash ─────────────────────────────────────────────────────────────────
    test('Only ADMIN can manage trash', () => {
        expect(canDo('ADMIN', 'trash', 'manage')).toBe(true);
        expect(canDo('GENERAL_MANAGER', 'trash', 'manage')).toBe(false);
        expect(canDo('GLOBAL_ACCOUNTANT', 'trash', 'manage')).toBe(false);
        expect(canDo('USER', 'trash', 'manage')).toBe(false);
    });

    // ── Wallet ────────────────────────────────────────────────────────────────
    test('Only ADMIN can deposit to wallet', () => {
        expect(canDo('ADMIN', 'wallet', 'deposit')).toBe(true);
        expect(canDo('GLOBAL_ACCOUNTANT', 'wallet', 'deposit')).toBe(false);
        expect(canDo('USER', 'wallet', 'deposit')).toBe(false);
    });

    test('Management roles can view wallet', () => {
        expect(canDo('ADMIN', 'wallet', 'view')).toBe(true);
        expect(canDo('GENERAL_MANAGER', 'wallet', 'view')).toBe(true);
        expect(canDo('GLOBAL_ACCOUNTANT', 'wallet', 'view')).toBe(true);
        expect(canDo('USER', 'wallet', 'view')).toBe(false);
    });

    // ── Financial Requests ─────────────────────────────────────────────────────
    test('Only ADMIN can approve financial requests', () => {
        expect(canDo('ADMIN', 'financialRequests', 'approve')).toBe(true);
        expect(canDo('GLOBAL_ACCOUNTANT', 'financialRequests', 'approve')).toBe(false);
        expect(canDo('GENERAL_MANAGER', 'financialRequests', 'approve')).toBe(false);
        expect(canDo('USER', 'financialRequests', 'approve')).toBe(false);
    });

    // ── Notifications ─────────────────────────────────────────────────────────
    test('ADMIN and GENERAL_MANAGER can send notifications', () => {
        expect(canDo('ADMIN', 'notifications', 'send')).toBe(true);
        expect(canDo('GENERAL_MANAGER', 'notifications', 'send')).toBe(true);
        expect(canDo('GLOBAL_ACCOUNTANT', 'notifications', 'send')).toBe(false);
        expect(canDo('USER', 'notifications', 'send')).toBe(false);
    });

    // ── Settings ──────────────────────────────────────────────────────────────
    test('Only ADMIN can manage system settings', () => {
        expect(canDo('ADMIN', 'settings', 'manage')).toBe(true);
        expect(canDo('GENERAL_MANAGER', 'settings', 'manage')).toBe(false);
        expect(canDo('USER', 'settings', 'manage')).toBe(false);
    });

    // ── Edge Cases ────────────────────────────────────────────────────────────
    test('null role returns false', () => {
        expect(canDo(null, 'employees', 'create')).toBe(false);
    });

    test('undefined role returns false', () => {
        expect(canDo(undefined, 'projects', 'create')).toBe(false);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
//  isGlobalFinance()
// ══════════════════════════════════════════════════════════════════════════════
test.describe('isGlobalFinance()', () => {

    test('returns true for ADMIN', () => {
        expect(isGlobalFinance('ADMIN')).toBe(true);
    });

    test('returns true for GLOBAL_ACCOUNTANT', () => {
        expect(isGlobalFinance('GLOBAL_ACCOUNTANT')).toBe(true);
    });

    test('returns true for GENERAL_MANAGER', () => {
        expect(isGlobalFinance('GENERAL_MANAGER')).toBe(true);
    });

    test('returns false for USER', () => {
        expect(isGlobalFinance('USER')).toBe(false);
    });

    test('returns false for empty string', () => {
        expect(isGlobalFinance('')).toBe(false);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
//  hasProjectRole()
// ══════════════════════════════════════════════════════════════════════════════
test.describe('hasProjectRole()', () => {

    test('detects single matching role', () => {
        expect(hasProjectRole('PROJECT_MANAGER', ['PROJECT_MANAGER'])).toBe(true);
    });

    test('detects role in CSV string', () => {
        expect(hasProjectRole('PROJECT_MANAGER,PROJECT_EMPLOYEE', ['PROJECT_MANAGER'])).toBe(true);
        expect(hasProjectRole('PROJECT_EMPLOYEE,PROJECT_ACCOUNTANT', ['PROJECT_ACCOUNTANT'])).toBe(true);
    });

    test('returns false when role not in CSV', () => {
        expect(hasProjectRole('PROJECT_EMPLOYEE', ['PROJECT_MANAGER'])).toBe(false);
    });

    test('handles array input (already split)', () => {
        expect(hasProjectRole(['PROJECT_MANAGER', 'PROJECT_EMPLOYEE'], ['PROJECT_MANAGER'])).toBe(true);
    });

    test('handles null gracefully', () => {
        expect(hasProjectRole(null, ['PROJECT_MANAGER'])).toBe(false);
    });

    test('handles undefined gracefully', () => {
        expect(hasProjectRole(undefined, ['PROJECT_MANAGER'])).toBe(false);
    });

    test('handles empty string gracefully', () => {
        expect(hasProjectRole('', ['PROJECT_MANAGER'])).toBe(false);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
//  isProjectCoordinator() and isProjectAccountant()
// ══════════════════════════════════════════════════════════════════════════════
test.describe('isProjectCoordinator() and isProjectAccountant()', () => {

    test('isProjectCoordinator returns true for PROJECT_MANAGER', () => {
        expect(isProjectCoordinator('PROJECT_MANAGER')).toBe(true);
        expect(isProjectCoordinator('PROJECT_MANAGER,PROJECT_EMPLOYEE')).toBe(true);
    });

    test('isProjectCoordinator returns false for non-coordinator roles', () => {
        expect(isProjectCoordinator('PROJECT_EMPLOYEE')).toBe(false);
        expect(isProjectCoordinator('PROJECT_ACCOUNTANT')).toBe(false);
        expect(isProjectCoordinator(null)).toBe(false);
    });

    test('isProjectAccountant returns true for PROJECT_ACCOUNTANT', () => {
        expect(isProjectAccountant('PROJECT_ACCOUNTANT')).toBe(true);
        expect(isProjectAccountant('PROJECT_EMPLOYEE,PROJECT_ACCOUNTANT')).toBe(true);
    });

    test('isProjectAccountant returns false for non-accountant roles', () => {
        expect(isProjectAccountant('PROJECT_EMPLOYEE')).toBe(false);
        expect(isProjectAccountant('PROJECT_MANAGER')).toBe(false);
        expect(isProjectAccountant(undefined)).toBe(false);
    });
});
