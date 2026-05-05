import path from 'path';

import z from 'zod';

import { prisma } from '../../core/PrismaClient';
import { errorResponse } from '../../utils/error-response';

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

    const file = request.file;

    if (!file) {
        return errorResponse(response, 400, 'No file uploaded');
    }

    const attachment = await prisma.attachment.create({
        data: {
            requestId: id,
            fileName: file.originalname,
            fileUrl: `/uploads/${file.filename}`,
            fileType: file.mimetype,
            storedFileName: file.filename,
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

    const hasAccess = ['ADMIN'].includes(request.loggedUser!.role) || attachment.request.requesterId === request.loggedUser!.id;

    if (!hasAccess) {
        return errorResponse(response, 403, 'You do not have permission to delete this attachment');
    }

     if (attachment.request.status !== 'DRAFT') {
        return errorResponse(response, 400, 'You can only edit reimbursement requests in draft status');
    }


    const fs = await import('fs');
    const filePath = path.join(process.cwd(), 'uploads', attachment.storedFileName);

    try {
        await fs.promises.unlink(filePath);
    } catch {
        // File may not exist, continue with DB deletion
    }

    await prisma.attachment.delete({ where: { id: attachmentId } });

    response.status(204).send();
}

