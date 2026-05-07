import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import request from 'supertest';

import { app } from '../src/app';
import { prisma } from '../src/core/PrismaClient';
import { cleanDatabase, createTestUser } from './helpers';

describe('Auth Routes', () => {
    beforeAll(async () => {
        await cleanDatabase();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('POST /users (register)', () => {
        it('should register a new user', async () => {
            const res = await request(app)
                .post('/users')
                .send({ name: 'New User', email: 'new@example.com', password: 'Password1', role: 'EMPLOYEE' });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body.email).toBe('new@example.com');
            expect(res.body.role).toBe('EMPLOYEE');
            expect(res.body).not.toHaveProperty('password');
        });

        it('should return 409 if email already exists', async () => {
            await createTestUser({ email: 'duplicate@example.com' });

            const res = await request(app)
                .post('/users')
                .send({ name: 'Duplicate', email: 'duplicate@example.com', password: 'Password1', role: 'EMPLOYEE' });

            expect(res.status).toBe(409);
            expect(res.body.message).toBe('User already registered');
        });

        it('should return 400 for invalid fields', async () => {
            const res = await request(app)
                .post('/users')
                .send({ name: '', email: 'invalid', password: '123', role: 'INVALID' });

            expect(res.status).toBe(400);
        });
    });

    describe('POST /auth/login', () => {
        it('should login with valid credentials', async () => {
            const password = 'Password1';
            const user = await createTestUser({ email: 'login@example.com', password });

            const res = await request(app)
                .post('/auth/login')
                .send({ email: user.email, password });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
        });

        it('should return 401 with wrong password', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({ email: 'login@example.com', password: 'WrongPassword1' });

            expect(res.status).toBe(401);
        });

        it('should return 400 if credentials missing', async () => {
            const res = await request(app).post('/auth/login').send({});

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Invalid credentials');
        });
    });

    describe('GET /auth/me', () => {
        it('should return the authenticated user', async () => {
            const user = await createTestUser();

            const res = await request(app)
                .get('/auth/me')
                .set('Authorization', `Bearer ${user.token}`);

            expect(res.status).toBe(200);
            expect(res.body.email).toBe(user.email);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).get('/auth/me');

            expect(res.status).toBe(401);
        });
    });
});
