import z from 'zod';

import { prisma } from '../../core/PrismaClient';
import { attachmentSchema } from '../../schemas';
import { errorResponse } from '../utils/error-response';

import type { Request, Response } from 'express';

export async function getAttachments(request: Request, response: Response) {
    const id = request.params.id as string;

    const existing = await prisma.request.findUnique({ where: { id } });

    if (!existing) {
        return errorResponse(response, 404, 'Reimbursement request not found');
    }

    const hasAccess = ['ADMIN', 'MANAGER', 'FINANCE'].includes(request.loggedUser!.role) || existing.requesterId === request.loggedUser!.id;

    if (!hasAccess) {
        return errorResponse(response, 403, 'You do not have permission to view attachments for this request');
    }

    const attachments = await prisma.attachment.findMany({ where: { requestId: id } });

    response.json(attachments);
}

export async function postAttachment(request: Request, response: Response) {
    const id = request.params.id as string;

    const existing = await prisma.request.findUnique({ where: { id } });

    if (!existing) {
        return errorResponse(response, 404, 'Reimbursement request not found');
    }

    if (existing.requesterId !== request.loggedUser!.id) {
        return errorResponse(response, 403, 'You can only add attachments to your own requests');
    }

    const { data, error } = attachmentSchema.safeParse(request.body);

    if (error) {
        return errorResponse(response, 400, 'Invalid fields', z.treeifyError(error).properties);
    }

    const attachment = await prisma.attachment.create({
        data: {
            requestId: id,
            fileName: data.fileName,
            fileUrl: data.fileUrl,
            fileType: data.fileType,
        },
    });

    response.status(201).json(attachment);
}

export async function deleteAttachment(request: Request, response: Response) {
    const attachmentId = request.params.attachmentId as string;

    const attachment = await prisma.attachment.findUnique({
        where: { id: attachmentId },
        include: { request: true },
    });

    if (!attachment) {
        return errorResponse(response, 404, 'Attachment not found');
    }

    await prisma.attachment.delete({ where: { id: attachmentId } });

    response.status(204).send();
}

