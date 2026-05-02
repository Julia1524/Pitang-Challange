import z from 'zod';

import { prisma } from '../../core/PrismaClient';
import { createRequestSchema, rejectRequestSchema, paginationQuery } from '../../schemas';
import { parseDate } from '../../utils/date';
import { errorResponse } from '../utils/error-response';

import type { Request, Response } from 'express';

const allowedTransitions: Record<string, string[]> = {
    DRAFT: ['SUBMITTED', 'CANCELLED'],
    SUBMITTED: ['APPROVED', 'REJECTED'],
    APPROVED: ['PAID'],
    REJECTED: [],
    PAID: [],
    CANCELLED: [],
};

export async function getReimbursements(request: Request, response: Response) {
    const { data: pagination, error } = paginationQuery.safeParse(request.query);

    if (error) {
        return errorResponse(response, 400, 'Campos inválidos', z.treeifyError(error).properties);
    }

    const [totalCount, requests] = await Promise.all([
        prisma.request.count(),
        prisma.request.findMany({
            include: { category: true, attachments: true, history: true },
            orderBy: { id: pagination.sort },
            skip: (pagination.page - 1) * pagination.pageSize,
            take: pagination.pageSize,
        }),
    ]);

    response.json({
        items: requests,
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
        return errorResponse(response, 404, 'Solicitação não encontrada');
    }

    response.json(req);
}

export async function postRequest(request: Request, response: Response) {
    const { data, error } = createRequestSchema.safeParse(request.body);

    if (error) {
        return errorResponse(response, 400, 'Campos inválidos', z.treeifyError(error).properties);
    }

    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });

    if (!category) {
        return errorResponse(response, 400, 'Categoria não encontrada');
    }

    if (!category.active) {
        return errorResponse(response, 400, 'Categoria inativa não pode ser usada');
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
        },
    });

    response.status(201).json(created);
}

export async function patchRequest(request: Request, response: Response) {
    const id = request.params.id as string;

    const existing = await prisma.request.findUnique({ where: { id } });

    if (!existing) {
        return errorResponse(response, 404, 'Solicitação não encontrada');
    }

    if (existing.requesterId !== request.loggedUser!.id) {
        return errorResponse(response, 403, 'Você só pode editar suas próprias solicitações');
    }

    if (existing.status !== 'DRAFT') {
        return errorResponse(response, 400, 'Só é possível editar solicitações em RASCUNHO');
    }

    const { data, error } = createRequestSchema.partial().safeParse(request.body);

    if (error) {
        return errorResponse(response, 400, 'Campos inválidos', z.treeifyError(error).properties);
    }

    if (data.categoryId) {
        const category = await prisma.category.findUnique({ where: { id: data.categoryId } });

        if (!category) {
            return errorResponse(response, 400, 'Categoria não encontrada');
        }

        if (!category.active) {
            return errorResponse(response, 400, 'Categoria inativa não pode ser usada');
        }
    }

    const updated = await prisma.request.update({
        where: { id },
        data: {
            ...data,
            expenseDate: data.expenseDate ? parseDate(data.expenseDate) : undefined,
        },
    });

    response.json(updated);
}

export async function submitRequest(request: Request, response: Response) {
    const id = request.params.id as string;

    const existing = await prisma.request.findUnique({ where: { id } });

    if (!existing) {
        return errorResponse(response, 404, 'Solicitação não encontrada');
    }

    if (existing.requesterId !== request.loggedUser!.id) {
        return errorResponse(response, 403, 'Você só pode enviar suas próprias solicitações');
    }

    if (existing.status !== 'DRAFT') {
        return errorResponse(response, 400, 'Transição de status inválida');
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
        },
    });

    response.json(updated);
}

export async function approveRequest(request: Request, response: Response) {
    const id = request.params.id as string;

    const existing = await prisma.request.findUnique({ where: { id } });

    if (!existing) {
        return errorResponse(response, 404, 'Solicitação não encontrada');
    }

    if (existing.status !== 'SUBMITTED') {
        return errorResponse(response, 400, 'Transição de status inválida');
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
        },
    });

    response.json(updated);
}

export async function rejectRequest(request: Request, response: Response) {
    const id = request.params.id as string;

    const existing = await prisma.request.findUnique({ where: { id } });

    if (!existing) {
        return errorResponse(response, 404, 'Solicitação não encontrada');
    }

    if (existing.status !== 'SUBMITTED') {
        return errorResponse(response, 400, 'Transição de status inválida');
    }

    const { data, error } = rejectRequestSchema.safeParse(request.body);

    if (error) {
        return errorResponse(response, 400, 'Justificativa de rejeição é obrigatória');
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
            observation: data.rejectionJustification,
        },
    });

    response.json(updated);
}

export async function markAsPaid(request: Request, response: Response) {
    const id = request.params.id as string;

    const existing = await prisma.request.findUnique({ where: { id } });

    if (!existing) {
        return errorResponse(response, 404, 'Solicitação não encontrada');
    }

    if (existing.status !== 'APPROVED') {
        return errorResponse(response, 400, 'Transição de status inválida');
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
        },
    });

    response.json(updated);
}

export async function cancelRequest(request: Request, response: Response) {
    const id = request.params.id as string;

    const existing = await prisma.request.findUnique({ where: { id } });

    if (!existing) {
        return errorResponse(response, 404, 'Solicitação não encontrada');
    }

    if (existing.requesterId !== request.loggedUser!.id) {
        return errorResponse(response, 403, 'Você só pode cancelar suas próprias solicitações');
    }

    if (existing.status !== 'DRAFT') {
        return errorResponse(response, 400, 'Transição de status inválida');
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
        },
    });

    response.json(updated);
}

export async function getRequestHistory(request: Request, response: Response) {
    const id = request.params.id as string;

    const existing = await prisma.request.findUnique({ where: { id } });

    if (!existing) {
        return errorResponse(response, 404, 'Solicitação não encontrada');
    }

    const history = await prisma.history.findMany({
        where: { requestId: id },
        include: { user: { omit: { password: true } } },
        orderBy: { createdAt: 'asc' },
    });

    response.json(history);
}
