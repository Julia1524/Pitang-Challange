import { prisma } from '../src/core/PrismaClient';
import bcrypt from 'bcryptjs';

async function main() {
    await prisma.history.deleteMany();
    await prisma.attachment.deleteMany();
    await prisma.request.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    const hashedPassword = await bcrypt.hash('123456', 10);

    const admin = await prisma.user.create({
        data: {
            name: 'Admin User',
            email: 'admin@pitang.com',
            password: hashedPassword,
            role: 'ADMIN',
        },
    });

    const manager = await prisma.user.create({
        data: {
            name: 'Manager User',
            email: 'manager@pitang.com',
            password: hashedPassword,
            role: 'MANAGER',
        },
    });

    const finance = await prisma.user.create({
        data: {
            name: 'Finance User',
            email: 'finance@pitang.com',
            password: hashedPassword,
            role: 'FINANCE',
        },
    });

    const employee = await prisma.user.create({
        data: {
            name: 'Employee User',
            email: 'employee@pitang.com',
            password: hashedPassword,
            role: 'EMPLOYEE',
        },
    });

    const categories = await Promise.all([
        prisma.category.create({ data: { name: 'Alimentação', active: true } }),
        prisma.category.create({ data: { name: 'Transporte', active: true } }),
        prisma.category.create({ data: { name: 'Hospedagem', active: true } }),
        prisma.category.create({ data: { name: 'Material de escritório', active: false } }),
    ]);

    const today = new Date();

    await prisma.request.create({
        data: {
            requesterId: employee.id,
            categoryId: categories[0].id,
            description: 'Almoço com cliente',
            value: 150.00,
            expenseDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
            status: 'SUBMITTED',
            history: {
                create: {
                    userId: employee.id,
                    action: 'CREATED',
                    observation: 'Reimbursement request created as draft',
                },
            },
        },
    });

    await prisma.request.create({
        data: {
            requesterId: employee.id,
            categoryId: categories[1].id,
            description: 'Uber para aeroporto',
            value: 85.50,
            expenseDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
            status: 'APPROVED',
            history: {
                create: [
                    {
                        userId: employee.id,
                        action: 'CREATED',
                        observation: 'Reimbursement request created as draft',
                    },
                    {
                        userId: manager.id,
                        action: 'APPROVED',
                        observation: 'Reimbursement request approved by manager',
                    },
                ],
            },
        },
    });

    await prisma.request.create({
        data: {
            requesterId: manager.id,
            categoryId: categories[2].id,
            description: 'Hotel para treinamento',
            value: 450.00,
            expenseDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
            status: 'PAID',
            history: {
                create: [
                    {
                        userId: manager.id,
                        action: 'CREATED',
                        observation: 'Reimbursement request created as draft',
                    },
                    {
                        userId: admin.id,
                        action: 'APPROVED',
                        observation: 'Reimbursement request approved by admin',
                    },
                    {
                        userId: finance.id,
                        action: 'PAID',
                        observation: 'Reimbursement request marked as paid by finance',
                    },
                ],
            },
        },
    });
}

main()
    .then(() => {
        console.log('Seed completed successfully');
        process.exit(0);
    })
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
