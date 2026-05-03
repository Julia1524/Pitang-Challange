import z from 'zod';

import { prisma } from '../../core/PrismaClient';
import { createRequestSchema, rejectRequestSchema, paginationQuery } from '../../schemas';
import { parseDate } from '../../utils/date';
import { errorResponse } from '../../utils/error-response';

import type { Request, Response } from 'express';

export async function getReimbursements(request: Request, response: Response) {
    const { data: pagination, error } = paginationQuery.safeParse(request.query);

    if (error) {
        return errorResponse(response, 400, 'Invalid fields', z.treeifyError(error).properties);
    }

    const isAdminOrFinance = ['ADMIN', 'FINANCE'].includes(request.loggedUser!.role);

    const [totalCount, requests] = await Promise.all([
        prisma.request.count(),
        prisma.request.findMany({
            include: { category: true, attachments: true, history: true },
            orderBy: { id: pagination.sort },
            skip: (pagination.page - 1) * pagination.pageSize,
            take: pagination.pageSize,
        }),
    ]);

    const filtered = requests.map((req) => {
        if (!isAdminOrFinance && req.requesterId !== request.loggedUser!.id) {
            req.history = [];
        }
        return req;
    });

    response.json({
        items: filtered,
        lastPage: Math.ceil(totalCount / pagination.pageSize) === pagination.page,
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalCount,
    });
}

export async function getRequestById(request: Request, response: Response) {
    const id = request.params.id as string;

    const req = await prisma.request.findUnique({
        where: { id },
        include: { category: true, attachments: true, history: true },
    });

    if (!req) {
        return errorResponse(response, 404, 'Reimbursement request not found');
    }

    const hasHistoryAccess = ['ADMIN', 'FINANCE', 'MANAGER'].includes(request.loggedUser!.role) || req.requesterId === request.loggedUser!.id;

    if (!hasHistoryAccess) {
        req.history = [];
    }

    response.json(req);
}

export async function postRequest(request: Request, response: Response) {
    const { data, error } = createRequestSchema.safeParse(request.body);

    if (error) {
        return errorResponse(response, 400, 'Invalid fields', z.treeifyError(error).properties);
    }

    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });

    if (!category) {
        return errorResponse(response, 400, 'Category not found');
    }

    if (!category.active) {
        return errorResponse(response, 400, 'Inactive category cannot be used');
    }

    const created = await prisma.request.create({
        data: {
            requesterId: request.loggedUser!.id,
            categoryId: data.categoryId,
            description: data.description,
            value: data.value,
            expenseDate: parseDate(data.expenseDate),
            status: 'DRAFT',
        },
    });

    await prisma.history.create({
        data: {
            requestId: created.id,
            userId: request.loggedUser!.id,
            action: 'CREATED',
            createdAt: new Date(),
            observation: 'Reimbursement request created as draft',
        },
    });

    response.status(201).json(created);
}

export async function patchRequest(request: Request, response: Response) {
    const id = request.params.id as string;

    const existing = await prisma.request.findUnique({ where: { id } });

    if (!existing) {
        return errorResponse(response, 404, 'Reimbursement request not found');
    }

    if (existing.requesterId !== request.loggedUser!.id) {
        return errorResponse(response, 403, 'You can only edit your own reimbursement requests');
    }

    if (existing.status !== 'DRAFT') {
        return errorResponse(response, 400, 'You can only edit reimbursement requests in draft status');
    }

    const { data, error } = createRequestSchema.partial().safeParse(request.body);

    if (error) {
        return errorResponse(response, 400, 'Invalid fields', z.treeifyError(error).properties);
    }

    if (data.categoryId) {
        const category = await prisma.category.findUnique({ where: { id: data.categoryId } });

        if (!category) {
            return errorResponse(response, 400, 'Category not found');
        }

        if (!category.active) {
            return errorResponse(response, 400, 'Inactive category cannot be used');
        }
    }

    const updated = await prisma.request.update({
        where: { id },
        data: {
            ...data,
            expenseDate: data.expenseDate ? parseDate(data.expenseDate) : undefined,
        },
    });

    await prisma.history.create({
        data: {
            requestId: id,
            userId: request.loggedUser!.id,
            action: 'UPDATED',
            createdAt: new Date(),
            observation: 'Reimbursement request updated',
        },
    });

    response.json(updated);
}

export async function submitRequest(request: Request, response: Response) {
    const id = request.params.id as string;

    const existing = await prisma.request.findUnique({ where: { id } });

    if (!existing) {
        return errorResponse(response, 404, 'Reimbursement request not found');
    }

    if (existing.requesterId !== request.loggedUser!.id) {
        return errorResponse(response, 403, 'You can only submit your own reimbursement requests');
    }

    if (existing.status !== 'DRAFT') {
        return errorResponse(response, 400, 'Invalid status transition');
    }

    const updated = await prisma.request.update({
        where: { id },
        data: { status: 'SUBMITTED' },
    });

    await prisma.history.create({
        data: {
            requestId: id,
            userId: request.loggedUser!.id,
            action: 'SUBMITTED',
            createdAt: new Date(),
            observation: 'Reimbursement request submitted for review',
        },
    });

    response.json(updated);
}

export async function approveRequest(request: Request, response: Response) {
    const id = request.params.id as string;

    const existing = await prisma.request.findUnique({ where: { id } });

    if (!existing) {
        return errorResponse(response, 404, 'Reimbursement request not found');
    }

    if (existing.status !== 'SUBMITTED') {
        return errorResponse(response, 400, 'Invalid status transition');
    }

    const updated = await prisma.request.update({
        where: { id },
        data: { status: 'APPROVED' },
    });

    await prisma.history.create({
        data: {
            requestId: id,
            userId: request.loggedUser!.id,
            action: 'APPROVED',
            createdAt: new Date(),
            observation: 'Reimbursement request approved by manager',
        },
    });

    response.json(updated);
}

export async function rejectRequest(request: Request, response: Response) {
    const id = request.params.id as string;

    const existing = await prisma.request.findUnique({ where: { id } });

    if (!existing) {
        return errorResponse(response, 404, 'Reimbursement request not found');
    }

    if (existing.status !== 'SUBMITTED') {
        return errorResponse(response, 400, 'Invalid status transition');
    }

    const { data, error } = rejectRequestSchema.safeParse(request.body);

    if (error) {
        return errorResponse(response, 400, 'Rejection justification is required');
    }

    const updated = await prisma.request.update({
        where: { id },
        data: { status: 'REJECTED', rejectionJustification: data.rejectionJustification },
    });

    await prisma.history.create({
        data: {
            requestId: id,
            userId: request.loggedUser!.id,
            action: 'REJECTED',
            createdAt: new Date(),
            observation: data.rejectionJustification,
        },
    });

    response.json(updated);
}

export async function markAsPaid(request: Request, response: Response) {
    const id = request.params.id as string;

    const existing = await prisma.request.findUnique({ where: { id } });

    if (!existing) {
        return errorResponse(response, 404, 'Reimbursement request not found');
    }

    if (existing.status !== 'APPROVED') {
        return errorResponse(response, 400, 'Invalid status transition');
    }

    const updated = await prisma.request.update({
        where: { id },
        data: { status: 'PAID' },
    });

    await prisma.history.create({
        data: {
            requestId: id,
            userId: request.loggedUser!.id,
            action: 'PAID',
            createdAt: new Date(),
            observation: 'Reimbursement request marked as paid by finance',
        },
    });

    response.json(updated);
}

export async function cancelRequest(request: Request, response: Response) {
    const id = request.params.id as string;

    const existing = await prisma.request.findUnique({ where: { id } });

    if (!existing) {
        return errorResponse(response, 404, 'Reimbursement request not found');
    }

    if (existing.requesterId !== request.loggedUser!.id) {
        return errorResponse(response, 403, 'You can only cancel your own reimbursement requests');
    }

    if (existing.status !== 'DRAFT') {
        return errorResponse(response, 400, 'Invalid status transition');
    }

    const updated = await prisma.request.update({
        where: { id },
        data: { status: 'CANCELLED' },
    });

    await prisma.history.create({
        data: {
            requestId: id,
            userId: request.loggedUser!.id,
            action: 'CANCELLED',
            createdAt: new Date(),
            observation: 'Reimbursement request cancelled by requester',
        },
    });

    response.json(updated);
}

export async function getRequestHistory(request: Request, response: Response) {
    const id = request.params.id as string;

    const existing = await prisma.request.findUnique({ where: { id } });

    if (!existing) {
        return errorResponse(response, 404, 'Reimbursement request not found');
    }

    const hasHistoryAccess = ['ADMIN', 'MANAGER', 'FINANCE'].includes(request.loggedUser!.role) || existing.requesterId === request.loggedUser!.id;

    if (!hasHistoryAccess) {
        return errorResponse(response, 403, 'You do not have permission to view the history of this request');
    }

    const history = await prisma.history.findMany({
        where: { requestId: id },
        include: { user: { omit: { password: true } } },
        orderBy: { createdAt: 'asc' },
    });

    response.json(history);
}
