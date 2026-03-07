/**
 * Unit Tests: Zod Validation Schemas
 *
 * Tests: loginSchema, createEmployeeSchema, createProjectSchema,
 *        sendMessageSchema, supportTicketSchema
 *
 * Pure logic — no browser, no DB.
 * Run: npm test -- tests/unit/schemas.spec.ts
 */

import { test, expect } from '@playwright/test';
import { loginSchema } from '../../src/lib/validations/auth';
import { createEmployeeSchema } from '../../src/lib/validations/employees';
import { createProjectSchema, sendMessageSchema, supportTicketSchema } from '../../src/lib/validations/app-schemas';

// ══════════════════════════════════════════════════════════════════════════════
//  loginSchema
// ══════════════════════════════════════════════════════════════════════════════
test.describe('loginSchema', () => {

    test('accepts valid email + password', () => {
        const result = loginSchema.safeParse({ email: 'user@example.com', password: '123456' });
        expect(result.success).toBe(true);
    });

    test('rejects invalid email format', () => {
        const result = loginSchema.safeParse({ email: 'not-an-email', password: '123456' });
        expect(result.success).toBe(false);
    });

    test('rejects missing email', () => {
        const result = loginSchema.safeParse({ email: '', password: '123456' });
        expect(result.success).toBe(false);
    });

    test('rejects password shorter than 6 characters', () => {
        const result = loginSchema.safeParse({ email: 'user@example.com', password: '12345' });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toContain('6');
        }
    });

    test('accepts password exactly 6 characters', () => {
        const result = loginSchema.safeParse({ email: 'user@example.com', password: '123456' });
        expect(result.success).toBe(true);
    });

    test('rejects missing password', () => {
        const result = loginSchema.safeParse({ email: 'user@example.com', password: '' });
        expect(result.success).toBe(false);
    });

    test('rejects both fields empty', () => {
        const result = loginSchema.safeParse({ email: '', password: '' });
        expect(result.success).toBe(false);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
//  createEmployeeSchema
// ══════════════════════════════════════════════════════════════════════════════
test.describe('createEmployeeSchema', () => {

    const valid = {
        name: 'أحمد محمد',
        email: 'ahmed@company.com',
        phone: '+966501234567',
        password: 'pass123',
        role: 'USER' as const,
        jobTitle: 'مطور',
        salary: 5000,
    };

    test('accepts valid full employee data', () => {
        const result = createEmployeeSchema.safeParse(valid);
        expect(result.success).toBe(true);
    });

    test('rejects name shorter than 2 characters', () => {
        const result = createEmployeeSchema.safeParse({ ...valid, name: 'أ' });
        expect(result.success).toBe(false);
    });

    test('rejects invalid email format', () => {
        const result = createEmployeeSchema.safeParse({ ...valid, email: 'bad-email' });
        expect(result.success).toBe(false);
    });

    test('accepts empty email (optional field)', () => {
        const result = createEmployeeSchema.safeParse({ ...valid, email: '' });
        expect(result.success).toBe(true);
    });

    test('rejects password shorter than 6 characters', () => {
        const result = createEmployeeSchema.safeParse({ ...valid, password: '12345' });
        expect(result.success).toBe(false);
    });

    test('rejects invalid role enum', () => {
        const result = createEmployeeSchema.safeParse({ ...valid, role: 'SUPERUSER' });
        expect(result.success).toBe(false);
    });

    test('accepts all valid role values', () => {
        const roles = ['ADMIN', 'GENERAL_MANAGER', 'GLOBAL_ACCOUNTANT', 'USER'] as const;
        for (const role of roles) {
            const result = createEmployeeSchema.safeParse({ ...valid, role });
            expect(result.success).toBe(true);
        }
    });

    test('rejects negative salary', () => {
        const result = createEmployeeSchema.safeParse({ ...valid, salary: -100 });
        expect(result.success).toBe(false);
    });

    test('accepts zero salary', () => {
        const result = createEmployeeSchema.safeParse({ ...valid, salary: 0 });
        expect(result.success).toBe(true);
    });

    test('defaults role to USER when omitted', () => {
        const { role: _, ...withoutRole } = valid;
        const result = createEmployeeSchema.safeParse(withoutRole);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.role).toBe('USER');
        }
    });
});

// ══════════════════════════════════════════════════════════════════════════════
//  createProjectSchema
// ══════════════════════════════════════════════════════════════════════════════
test.describe('createProjectSchema', () => {

    test('accepts valid project data', () => {
        const result = createProjectSchema.safeParse({
            name: 'مشروع جديد',
            description: 'وصف قصير',
            budget: 50000,
            custody: 1000,
        });
        expect(result.success).toBe(true);
    });

    test('rejects name shorter than 2 characters', () => {
        const result = createProjectSchema.safeParse({ name: 'م' });
        expect(result.success).toBe(false);
    });

    test('rejects name longer than 100 characters', () => {
        const result = createProjectSchema.safeParse({ name: 'م'.repeat(101) });
        expect(result.success).toBe(false);
    });

    test('accepts optional fields as null', () => {
        const result = createProjectSchema.safeParse({
            name: 'اسم المشروع',
            description: null,
            budget: null,
            custody: null,
        });
        expect(result.success).toBe(true);
    });

    test('rejects negative budget', () => {
        const result = createProjectSchema.safeParse({ name: 'مشروع', budget: -1 });
        expect(result.success).toBe(false);
    });

    test('accepts zero budget', () => {
        const result = createProjectSchema.safeParse({ name: 'مشروع', budget: 0 });
        expect(result.success).toBe(true);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
//  sendMessageSchema
// ══════════════════════════════════════════════════════════════════════════════
test.describe('sendMessageSchema', () => {

    test('accepts valid message content', () => {
        const result = sendMessageSchema.safeParse({ content: 'مرحباً كيف حالك؟' });
        expect(result.success).toBe(true);
    });

    test('rejects empty message', () => {
        const result = sendMessageSchema.safeParse({ content: '' });
        expect(result.success).toBe(false);
    });

    test('rejects message over 2000 characters', () => {
        const result = sendMessageSchema.safeParse({ content: 'أ'.repeat(2001) });
        expect(result.success).toBe(false);
    });

    test('accepts message exactly 2000 characters', () => {
        const result = sendMessageSchema.safeParse({ content: 'أ'.repeat(2000) });
        expect(result.success).toBe(true);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
//  supportTicketSchema
// ══════════════════════════════════════════════════════════════════════════════
test.describe('supportTicketSchema', () => {

    const valid = {
        type: 'BUG',
        priority: 'HIGH',
        title: 'مشكلة في الدخول',
        description: 'لا أستطيع تسجيل الدخول منذ صباح اليوم وحاولت عدة مرات',
    };

    test('accepts valid ticket data', () => {
        const result = supportTicketSchema.safeParse(valid);
        expect(result.success).toBe(true);
    });

    test('rejects title shorter than 3 characters', () => {
        const result = supportTicketSchema.safeParse({ ...valid, title: 'خط' });
        expect(result.success).toBe(false);
    });

    test('rejects title longer than 100 characters', () => {
        const result = supportTicketSchema.safeParse({ ...valid, title: 'م'.repeat(101) });
        expect(result.success).toBe(false);
    });

    test('rejects description shorter than 10 characters', () => {
        const result = supportTicketSchema.safeParse({ ...valid, description: 'قصير' });
        expect(result.success).toBe(false);
    });

    test('rejects description longer than 5000 characters', () => {
        const result = supportTicketSchema.safeParse({ ...valid, description: 'م'.repeat(5001) });
        expect(result.success).toBe(false);
    });

    test('rejects missing type', () => {
        const result = supportTicketSchema.safeParse({ ...valid, type: '' });
        expect(result.success).toBe(false);
    });
});
