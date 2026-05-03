import z from 'zod';

import { prisma } from '../../core/PrismaClient';
import { paginationQuery, categorySchema } from '../../schemas';

import type { Request, Response } from 'express';
import { errorResponse } from '../utils/error-response';

export async function getCategoryById(request: Request, response: Response) {
    const id = request.params.id as string;

     const category = await prisma.category.findUnique({
            where: { id  },
        });
    
        if (!category) {
            return errorResponse(response, 404, 'Category not found');
        }
    
        response.json(category);
}

export async function getCategory(request: Request, response: Response) {
    const { data: pagination, error } = paginationQuery.safeParse(
        request.query,
    );

    if (error) {
        return errorResponse(response, 400, 'Invalid fields', z.treeifyError(error).properties);
    }

    const [totalCount, categories] = await Promise.all([
        prisma.category.count(),
        prisma.category.findMany({
            orderBy: { id: pagination.sort },
            skip: (pagination.page - 1) * pagination.pageSize,
            take: pagination.pageSize,
        }),
    ]);

    response.json({
        items: categories,
        lastPage:
            Math.ceil(totalCount / pagination.pageSize) === pagination.page,
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalCount: totalCount,
    });
}

export async function postCategory(request: Request, response: Response) {
    const { data, error } = categorySchema.safeParse(request.body);

    if (error) {
        return errorResponse(response, 400, 'Invalid fields', z.treeifyError(error).properties);
    }

    let category = await prisma.category.findUnique({
        where: { name: data.name },
    });
    
    if (category) {
        return errorResponse(response, 409, 'Category already exists');
    }

     category = await prisma.category.create({
        data: {
            ...data,
        },
    });

    response.status(201).json(category);
}

export async function patchCategory(request: Request, response: Response) {
    const id = request.params.id as string;

    const { data, error } = categorySchema.partial().safeParse(request.body);

    if (error) {
        return errorResponse(response, 400, 'Invalid fields', z.treeifyError(error).properties);
    }

    if (data.name) {
        const existingCategory = await prisma.category.findUnique({
            where: { name: data.name },
        });

        if (existingCategory && existingCategory.id !== id) {
            return errorResponse(response, 409, 'Category already exists');
        }
    }

    const category = await prisma.category.update({
        where: { id },
        data: {
            ...data,
        },
    });

    response.json(category);
}

export async function deleteCategory(request: Request, response: Response) {
    const id = request.params.id as string;

    await prisma.category.delete({
        where: { id },
    });

    response.status(204).send();
}