import { describe, it, expect } from 'vitest';

import { formatDate, formatCurrency } from '@/lib/date-format';

describe('formatDate', () => {
    it('should format date in short format (DD/MM/YYYY)', () => {
        const result = formatDate('2026-05-07');
        expect(result).toBe('07/05/2026');
    });

    it('should format date in full format (DD/MM/YYYY HH:mm)', () => {
        const result = formatDate('2026-05-07T14:30:00', 'full');
        expect(result).toBe('07/05/2026 14:30');
    });

    it('should handle Date object', () => {
        const result = formatDate(new Date('2026-01-15'));
        expect(result).toBe('15/01/2026');
    });
});

describe('formatCurrency', () => {
    const nbsp = '\u00a0';

    it('should format number as BRL currency', () => {
        const result = formatCurrency(150.5);
        expect(result).toBe(`R$${nbsp}150,50`);
    });

    it('should format string number as BRL currency', () => {
        const result = formatCurrency('2500.00');
        expect(result).toBe(`R$${nbsp}2.500,00`);
    });

    it('should format zero', () => {
        const result = formatCurrency(0);
        expect(result).toBe(`R$${nbsp}0,00`);
    });

    it('should format large values', () => {
        const result = formatCurrency(1000000.99);
        expect(result).toBe(`R$${nbsp}1.000.000,99`);
    });
});
