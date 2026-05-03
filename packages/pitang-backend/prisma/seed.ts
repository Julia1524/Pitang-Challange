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
