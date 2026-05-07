import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import request from 'supertest';

import { app } from '../src/app';
import { prisma } from '../src/core/PrismaClient';
import { cleanDatabase, createTestUser, createTestCategory, createTestRequest } from './helpers';

describe('Reimbursement Routes', () => {
    let employee: any;
    let manager: any;
    let finance: any;
    let admin: any;
    let category: any;

    beforeAll(async () => {
        await cleanDatabase();

        employee = await createTestUser({ role: 'EMPLOYEE', email: 'emp@test.com' });
        manager = await createTestUser({ role: 'MANAGER', email: 'mgr@test.com' });
        finance = await createTestUser({ role: 'FINANCE', email: 'fin@test.com' });
        admin = await createTestUser({ role: 'ADMIN', email: 'adm@test.com' });
        category = await createTestCategory({ name: 'Test Category' });
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('GET /reimbursements', () => {
        it('should list own requests for employee', async () => {
            await createTestRequest({ requesterId: employee.id, categoryId: category.id });

            const res = await request(app)
                .get('/reimbursements')
                .set('Authorization', `Bearer ${employee.token}`);

            expect(res.status).toBe(200);
        });

        it('should list all requests for admin', async () => {
            const res = await request(app)
                .get('/reimbursements')
                .set('Authorization', `Bearer ${admin.token}`);

            expect(res.status).toBe(200);
        });
    });

    describe('POST /reimbursements', () => {
        it('should create a request as employee', async () => {
            const res = await request(app)
                .post('/reimbursements')
                .set('Authorization', `Bearer ${employee.token}`)
                .send({
                    categoryId: category.id,
                    description: 'Office supplies',
                    value: 150.50,
                    expenseDate: '2026-05-01',
                });

            expect(res.status).toBe(201);
            expect(res.body.status).toBe('DRAFT');
            expect(res.body.description).toBe('Office supplies');
        });

        it('should return 403 for non-employee creating request', async () => {
            const res = await request(app)
                .post('/reimbursements')
                .set('Authorization', `Bearer ${manager.token}`)
                .send({
                    categoryId: category.id,
                    description: 'Test',
                    value: 50,
                    expenseDate: '2026-05-01',
                });

            expect(res.status).toBe(403);
        });

        it('should return 400 for invalid data', async () => {
            const res = await request(app)
                .post('/reimbursements')
                .set('Authorization', `Bearer ${employee.token}`)
                .send({});

            expect(res.status).toBe(400);
        });
    });

    describe('Request Status Transitions', () => {
        let draftRequest: any;

        beforeEach(async () => {
            await prisma.history.deleteMany();
            await prisma.request.deleteMany();

            draftRequest = await createTestRequest({
                requesterId: employee.id,
                categoryId: category.id,
                status: 'DRAFT',
            });
        });

        it('should submit a draft request', async () => {
            const res = await request(app)
                .post(`/reimbursements/${draftRequest.id}/submit`)
                .set('Authorization', `Bearer ${employee.token}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('SUBMITTED');
        });

        it('should approve a submitted request as manager', async () => {
            const submitted = await createTestRequest({
                requesterId: employee.id,
                categoryId: category.id,
                status: 'SUBMITTED',
            });

            const res = await request(app)
                .post(`/reimbursements/${submitted.id}/approve`)
                .set('Authorization', `Bearer ${manager.token}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('APPROVED');
        });

        it('should reject a submitted request with justification', async () => {
            const submitted = await createTestRequest({
                requesterId: employee.id,
                categoryId: category.id,
                status: 'SUBMITTED',
            });

            const res = await request(app)
                .post(`/reimbursements/${submitted.id}/reject`)
                .set('Authorization', `Bearer ${manager.token}`)
                .send({ rejectionJustification: 'Invalid expense' });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('REJECTED');
            expect(res.body.rejectionJustification).toBe('Invalid expense');
        });

        it('should mark approved request as paid by finance', async () => {
            const approved = await createTestRequest({
                requesterId: employee.id,
                categoryId: category.id,
                status: 'APPROVED',
            });

            const res = await request(app)
                .post(`/reimbursements/${approved.id}/pay`)
                .set('Authorization', `Bearer ${finance.token}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('PAID');
        });

        it('should cancel a draft request by owner', async () => {
            const res = await request(app)
                .post(`/reimbursements/${draftRequest.id}/cancel`)
                .set('Authorization', `Bearer ${employee.token}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('CANCELLED');
        });

        it('should return 403 if manager tries to pay', async () => {
            const approved = await createTestRequest({
                requesterId: employee.id,
                categoryId: category.id,
                status: 'APPROVED',
            });

            const res = await request(app)
                .post(`/reimbursements/${approved.id}/pay`)
                .set('Authorization', `Bearer ${manager.token}`);

            expect(res.status).toBe(403);
        });

        it('should return 400 for invalid status transition', async () => {
            const draft = await createTestRequest({
                requesterId: employee.id,
                categoryId: category.id,
                status: 'DRAFT',
            });

            const res = await request(app)
                .post(`/reimbursements/${draft.id}/approve`)
                .set('Authorization', `Bearer ${manager.token}`);

            expect(res.status).toBe(400);
        });
    });

    describe('GET /reimbursements/:id', () => {
        it('should allow owner to view', async () => {
            const req = await createTestRequest({
                requesterId: employee.id,
                categoryId: category.id,
            });

            const res = await request(app)
                .get(`/reimbursements/${req.id}`)
                .set('Authorization', `Bearer ${employee.token}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('history');
            expect(res.body).toHaveProperty('category');
        });

        it('should allow manager to view', async () => {
            const req = await createTestRequest({
                requesterId: employee.id,
                categoryId: category.id,
            });

            const res = await request(app)
                .get(`/reimbursements/${req.id}`)
                .set('Authorization', `Bearer ${manager.token}`);

            expect(res.status).toBe(200);
        });

        it('should allow finance to view', async () => {
            const req = await createTestRequest({
                requesterId: employee.id,
                categoryId: category.id,
            });

            const res = await request(app)
                .get(`/reimbursements/${req.id}`)
                .set('Authorization', `Bearer ${finance.token}`);

            expect(res.status).toBe(200);
        });

        it('should allow admin to view', async () => {
            const req = await createTestRequest({
                requesterId: employee.id,
                categoryId: category.id,
            });

            const res = await request(app)
                .get(`/reimbursements/${req.id}`)
                .set('Authorization', `Bearer ${admin.token}`);

            expect(res.status).toBe(200);
        });

        it('should return 403 for other employee', async () => {
            const other = await createTestUser({ role: 'EMPLOYEE', email: 'other@test.com' });
            const req = await createTestRequest({
                requesterId: employee.id,
                categoryId: category.id,
            });

            const res = await request(app)
                .get(`/reimbursements/${req.id}`)
                .set('Authorization', `Bearer ${other.token}`);

            expect(res.status).toBe(403);
        });
    });

    describe('PUT /reimbursements/:id (edit)', () => {
        it('should allow owner to edit draft', async () => {
            const req = await createTestRequest({
                requesterId: employee.id,
                categoryId: category.id,
            });

            const res = await request(app)
                .put(`/reimbursements/${req.id}`)
                .set('Authorization', `Bearer ${employee.token}`)
                .send({ description: 'Updated description' });

            expect(res.status).toBe(200);
            expect(res.body.description).toBe('Updated description');
        });

        it('should return 403 for manager trying to edit', async () => {
            const req = await createTestRequest({
                requesterId: employee.id,
                categoryId: category.id,
            });

            const res = await request(app)
                .put(`/reimbursements/${req.id}`)
                .set('Authorization', `Bearer ${manager.token}`)
                .send({ description: 'Edited by manager' });

            expect(res.status).toBe(403);
        });

        it('should return 403 for finance trying to edit', async () => {
            const req = await createTestRequest({
                requesterId: employee.id,
                categoryId: category.id,
            });

            const res = await request(app)
                .put(`/reimbursements/${req.id}`)
                .set('Authorization', `Bearer ${finance.token}`)
                .send({ description: 'Edited by finance' });

            expect(res.status).toBe(403);
        });

        it('should allow admin to edit draft', async () => {
            const req = await createTestRequest({
                requesterId: employee.id,
                categoryId: category.id,
            });

            const res = await request(app)
                .put(`/reimbursements/${req.id}`)
                .set('Authorization', `Bearer ${admin.token}`)
                .send({ description: 'Edited by admin' });

            expect(res.status).toBe(200);
        });

        it('should return 403 for other employee', async () => {
            const other = await createTestUser({ role: 'EMPLOYEE', email: 'other2@test.com' });
            const req = await createTestRequest({
                requesterId: employee.id,
                categoryId: category.id,
            });

            const res = await request(app)
                .put(`/reimbursements/${req.id}`)
                .set('Authorization', `Bearer ${other.token}`)
                .send({ description: 'Should fail' });

            expect(res.status).toBe(403);
        });

        it('should return 400 if not draft status', async () => {
            const submitted = await createTestRequest({
                requesterId: employee.id,
                categoryId: category.id,
                status: 'SUBMITTED',
            });

            const res = await request(app)
                .put(`/reimbursements/${submitted.id}`)
                .set('Authorization', `Bearer ${admin.token}`)
                .send({ description: 'Should fail' });

            expect(res.status).toBe(400);
        });
    });

    describe('GET /reimbursements/:id/history', () => {
        it('should return history for owner', async () => {
            const req = await createTestRequest({
                requesterId: employee.id,
                categoryId: category.id,
            });

            const res = await request(app)
                .get(`/reimbursements/${req.id}/history`)
                .set('Authorization', `Bearer ${employee.token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });
});
