import z from 'zod';

import { prisma } from '../../core/PrismaClient';
import { attachmentSchema } from '../../schemas';
import { errorResponse } from '../utils/error-response';

import type { Request, Response } from 'express';

export async function getAttachments(request: Request, response: Response) {
    const id = request.params.id as string;

    const existing = await prisma.request.findUnique({ where: { id } });

    if (!existing) {
        return errorResponse(response, 404, 'Solicitação não encontrada');
    }

    const attachments = await prisma.attachment.findMany({ where: { requestId: id } });

    response.json(attachments);
}

export async function postAttachment(request: Request, response: Response) {
    const id = request.params.id as string;

    const existing = await prisma.request.findUnique({ where: { id } });

    if (!existing) {
        return errorResponse(response, 404, 'Solicitação não encontrada');
    }

    if (existing.requesterId !== request.loggedUser!.id) {
        return errorResponse(response, 403, 'Você só pode adicionar anexos às suas próprias solicitações');
    }

    const { data, error } = attachmentSchema.safeParse(request.body);

    if (error) {
        return errorResponse(response, 400, 'Campos inválidos', z.treeifyError(error).properties);
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
        return errorResponse(response, 404, 'Anexo não encontrado');
    }

    if (attachment.request.requesterId !== request.loggedUser!.id) {
        return errorResponse(response, 403, 'Você só pode remover anexos das suas próprias solicitações');
    }

    await prisma.attachment.delete({ where: { id: attachmentId } });

    response.status(204).send();
}
