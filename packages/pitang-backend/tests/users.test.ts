import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import request from 'supertest';

import { app } from '../src/app';
import { prisma } from '../src/core/PrismaClient';
import { cleanDatabase, createTestUser } from './helpers';

describe('Users Routes', () => {
    beforeAll(async () => {
        await cleanDatabase();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('GET /users', () => {
        it('should return all users for admin', async () => {
            const admin = await createTestUser({ role: 'ADMIN' });
            await createTestUser();
            await createTestUser();

            const res = await request(app)
                .get('/users')
                .set('Authorization', `Bearer ${admin.token}`);

            expect(res.status).toBe(200);
            expect(res.body.length).toBeGreaterThanOrEqual(3);
            res.body.forEach((u: any) => {
                expect(u).not.toHaveProperty('password');
            });
        });

        it('should return 403 for non-admin users', async () => {
            const employee = await createTestUser({ role: 'EMPLOYEE' });

            const res = await request(app)
                .get('/users')
                .set('Authorization', `Bearer ${employee.token}`);

            expect(res.status).toBe(403);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).get('/users');
            expect(res.status).toBe(401);
        });
    });

    describe('GET /users/:id', () => {
        it('should return user by id for admin', async () => {
            const admin = await createTestUser({ role: 'ADMIN' });
            const target = await createTestUser();

            const res = await request(app)
                .get(`/users/${target.id}`)
                .set('Authorization', `Bearer ${admin.token}`);

            expect(res.status).toBe(200);
            expect(res.body.email).toBe(target.email);
        });

        it('should return 404 for non-existent user', async () => {
            const admin = await createTestUser({ role: 'ADMIN' });

            const res = await request(app)
                .get('/users/non-existent-id')
                .set('Authorization', `Bearer ${admin.token}`);

            expect(res.status).toBe(404);
        });
    });

    describe('PATCH /users/:id', () => {
        it('should allow user to update own profile', async () => {
            const user = await createTestUser();

            const res = await request(app)
                .patch(`/users/${user.id}`)
                .set('Authorization', `Bearer ${user.token}`)
                .send({ name: 'Updated Name' });

            expect(res.status).toBe(200);
            expect(res.body.name).toBe('Updated Name');
        });

        it('should block non-admin from changing role', async () => {
            const user = await createTestUser();

            const res = await request(app)
                .patch(`/users/${user.id}`)
                .set('Authorization', `Bearer ${user.token}`)
                .send({ role: 'ADMIN' });

            expect(res.status).toBe(403);
            expect(res.body.message).toBe('Only administrators can change user roles');
        });

        it('should allow admin to change role', async () => {
            const admin = await createTestUser({ role: 'ADMIN' });
            const target = await createTestUser();

            const res = await request(app)
                .patch(`/users/${target.id}`)
                .set('Authorization', `Bearer ${admin.token}`)
                .send({ role: 'MANAGER' });

            expect(res.status).toBe(200);
            expect(res.body.role).toBe('MANAGER');
        });
    });

    describe('DELETE /users/:id', () => {
        it('should allow user to delete own account', async () => {
            const user = await createTestUser();

            const res = await request(app)
                .delete(`/users/${user.id}`)
                .set('Authorization', `Bearer ${user.token}`);

            expect(res.status).toBe(204);
        });

        it('should allow admin to delete any user', async () => {
            const admin = await createTestUser({ role: 'ADMIN' });
            const target = await createTestUser();

            const res = await request(app)
                .delete(`/users/${target.id}`)
                .set('Authorization', `Bearer ${admin.token}`);

            expect(res.status).toBe(204);
        });

        it('should block non-owner from deleting', async () => {
            const user1 = await createTestUser();
            const user2 = await createTestUser();

            const res = await request(app)
                .delete(`/users/${user2.id}`)
                .set('Authorization', `Bearer ${user1.token}`);

            expect(res.status).toBe(403);
        });
    });
});
