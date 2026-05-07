import { describe, it, expect } from 'vitest';

import FetcherError from '@/lib/FetcherError';

describe('FetcherError', () => {
    it('should create error with message', () => {
        const error = new FetcherError('Something went wrong');
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Something went wrong');
    });

    it('should have info and status properties', () => {
        const error = new FetcherError('Not found');
        error.info = { message: 'User not found' };
        error.status = 404;

        expect(error.info.message).toBe('User not found');
        expect(error.status).toBe(404);
    });
});
