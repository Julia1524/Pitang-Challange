import { describe, it, expect } from 'vitest';

import { loginSchema, registerSchema, requestSchema } from '@/zodSchemas';

describe('loginSchema', () => {
    it('should validate correct login data', () => {
        const result = loginSchema.safeParse({ email: 'user@example.com', password: 'Password1' });
        expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
        const result = loginSchema.safeParse({ email: 'invalid', password: 'Password1' });
        expect(result.success).toBe(false);
    });

    it('should accept empty password (backend validates)', () => {
        const result = loginSchema.safeParse({ email: 'user@example.com', password: '' });
        expect(result.success).toBe(true);
    });
});

describe('registerSchema', () => {
    it('should validate correct register data', () => {
        const result = registerSchema.safeParse({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'Password1',
            confirmPassword: 'Password1',
            role: 'EMPLOYEE',
        });
        expect(result.success).toBe(true);
    });

    it('should reject short name', () => {
        const result = registerSchema.safeParse({
            name: 'Jo',
            email: 'john@example.com',
            password: 'Password1',
            confirmPassword: 'Password1',
            role: 'EMPLOYEE',
        });
        expect(result.success).toBe(false);
    });

    it('should reject mismatched passwords', () => {
        const result = registerSchema.safeParse({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'Password1',
            confirmPassword: 'DifferentPassword1',
            role: 'EMPLOYEE',
        });
        expect(result.success).toBe(false);
    });

    it('should reject invalid role', () => {
        const result = registerSchema.safeParse({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'Password1',
            confirmPassword: 'Password1',
            role: 'INVALID',
        });
        expect(result.success).toBe(false);
    });

    it('should reject ADMIN role in registration', () => {
        const result = registerSchema.safeParse({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'Password1',
            confirmPassword: 'Password1',
            role: 'ADMIN',
        });
        expect(result.success).toBe(false);
    });
});

describe('requestSchema', () => {
    it('should validate correct request data', () => {
        const result = requestSchema.safeParse({
            description: 'Office supplies',
            value: 100.50,
            expenseDate: '2026-05-01',
            categoryId: 'some-category-id',
        });
        expect(result.success).toBe(true);
    });

    it('should reject short description', () => {
        const result = requestSchema.safeParse({
            description: 'AB',
            value: 50,
            expenseDate: '2026-05-01',
            categoryId: 'cat-id',
        });
        expect(result.success).toBe(false);
    });

    it('should reject negative value', () => {
        const result = requestSchema.safeParse({
            description: 'Office supplies',
            value: -10,
            expenseDate: '2026-05-01',
            categoryId: 'cat-id',
        });
        expect(result.success).toBe(false);
    });
});
