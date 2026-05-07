import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import request from 'supertest';

import { app } from '../src/app';
import { prisma } from '../src/core/PrismaClient';
import { cleanDatabase, createTestUser, createTestCategory } from './helpers';

describe('Categories Routes', () => {
    beforeAll(async () => {
        await cleanDatabase();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('GET /categories', () => {
        it('should list all categories with auth', async () => {
            const user = await createTestUser({ role: 'MANAGER' });
            await createTestCategory({ name: 'Food' });
            await createTestCategory({ name: 'Transport' });

            const res = await request(app)
                .get('/categories')
                .set('Authorization', `Bearer ${user.token}`);

            expect(res.status).toBe(200);
            expect(res.body.items.length).toBeGreaterThanOrEqual(2);
            expect(res.body).toHaveProperty('totalCount');
            expect(res.body).toHaveProperty('page');
            expect(res.body).toHaveProperty('pageSize');
        });
    });

    describe('POST /categories', () => {
        it('should create category as admin', async () => {
            const admin = await createTestUser({ role: 'ADMIN' });

            const res = await request(app)
                .post('/categories')
                .set('Authorization', `Bearer ${admin.token}`)
                .send({ name: 'Health' });

            expect(res.status).toBe(201);
            expect(res.body.name).toBe('Health');
        });

        it('should return 403 for non-admin', async () => {
            const employee = await createTestUser({ role: 'EMPLOYEE' });

            const res = await request(app)
                .post('/categories')
                .set('Authorization', `Bearer ${employee.token}`)
                .send({ name: 'Health' });

            expect(res.status).toBe(403);
        });

        it('should return 409 for duplicate name', async () => {
            const admin = await createTestUser({ role: 'ADMIN' });

            await createTestCategory({ name: 'UniqueCat' });

            const res = await request(app)
                .post('/categories')
                .set('Authorization', `Bearer ${admin.token}`)
                .send({ name: 'UniqueCat' });

            expect(res.status).toBe(409);
        });
    });

    describe('PATCH /categories/:id', () => {
        it('should update category as admin', async () => {
            const admin = await createTestUser({ role: 'ADMIN' });
            const cat = await createTestCategory({ name: 'OldName' });

            const res = await request(app)
                .patch(`/categories/${cat.id}`)
                .set('Authorization', `Bearer ${admin.token}`)
                .send({ name: 'NewName' });

            expect(res.status).toBe(200);
            expect(res.body.name).toBe('NewName');
        });

        it('should toggle active status', async () => {
            const admin = await createTestUser({ role: 'ADMIN' });
            const cat = await createTestCategory({ name: 'ToggleCat' });

            const res = await request(app)
                .patch(`/categories/${cat.id}`)
                .set('Authorization', `Bearer ${admin.token}`)
                .send({ active: false });

            expect(res.status).toBe(200);
            expect(res.body.active).toBe(false);
        });
    });

    describe('DELETE /categories/:id', () => {
        it('should delete category as admin', async () => {
            const admin = await createTestUser({ role: 'ADMIN' });
            const cat = await createTestCategory({ name: 'DeleteCat' });

            const res = await request(app)
                .delete(`/categories/${cat.id}`)
                .set('Authorization', `Bearer ${admin.token}`);

            expect(res.status).toBe(204);
        });
    });
});
