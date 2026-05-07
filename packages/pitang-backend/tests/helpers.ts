import bcrypt from 'bcryptjs';
import jsonwebtoken from 'jsonwebtoken';

import { prisma } from '../src/core/PrismaClient';

export function generateToken(user: { id: string; email: string; role: string }) {
    return jsonwebtoken.sign(user, process.env.JWT_SECRET!, { expiresIn: '30m' });
}

export async function createTestUser(overrides: Partial<{ name: string; email: string; password: string; role: 'EMPLOYEE' | 'MANAGER' | 'FINANCE' | 'ADMIN' }> = {}) {
    const data = {
        name: overrides.name || 'Test User',
        email: overrides.email || `test_${Date.now()}@example.com`,
        password: await bcrypt.hash(overrides.password || 'Password1', 10),
        role: overrides.role || 'EMPLOYEE',
    };

    const user = await prisma.user.create({ data });

    return {
        ...user,
        token: generateToken({ id: user.id, email: user.email, role: user.role }),
    };
}

export async function createTestCategory(overrides: Partial<{ name: string; active: boolean }> = {}) {
    return prisma.category.create({
        data: {
            name: overrides.name || `Category_${Date.now()}`,
            active: overrides.active ?? true,
        },
    });
}

export async function createTestRequest(overrides: Partial<{
    requesterId: string;
    categoryId: string;
    description: string;
    value: number;
    status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PAID' | 'CANCELLED';
}> = {}) {
    return prisma.request.create({
        data: {
            requesterId: overrides.requesterId!,
            categoryId: overrides.categoryId!,
            description: overrides.description || 'Test expense',
            value: overrides.value || 100,
            expenseDate: new Date(),
            status: overrides.status || 'DRAFT',
        },
    });
}

export async function cleanDatabase() {
    await prisma.attachment.deleteMany();
    await prisma.history.deleteMany();
    await prisma.request.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
}
