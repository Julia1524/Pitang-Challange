import crypto from 'crypto';

import bcrypt from 'bcryptjs';
import jsonwebtoken from 'jsonwebtoken';
import z from 'zod';

import { environment } from '../../core/EnvVars';
import { logger } from '../../core/Logger';
import { prisma } from '../../core/PrismaClient';
import { userSchema } from '../../schemas';
import { errorResponse } from '../../utils/error-response';

import type { Request, Response } from 'express';

export async function getUsers(request: Request, response: Response) {
    const users = await prisma.user.findMany({
        omit: { password: true },
    });

    response.json(users);
}

export async function postUser(request: Request, response: Response) {
    const { data, error } = userSchema.safeParse(request.body);

    if (error) {
        return errorResponse(response, 400, 'Invalid fields', z.treeifyError(error).properties);
    }

    let user = await prisma.user.findUnique({ where: { email: data.email } });

    if (user) {
        logger.error({ emailAddress: data.email }, 'User already registered');

        return errorResponse(response, 409, 'User already registered');
    }

    const salt = bcrypt.genSaltSync(10);

    data.password = await bcrypt.hashSync(data.password, salt);

    user = await prisma.user.create({
        data: {
            ...data
        },
    });

    logger.info(user, 'User registered');

    delete (user as any).password;

    response.status(201).json(user);
}

export async function getUser(request: Request, response: Response) {
    const id = request.params.id as string;

    const user = await prisma.user.findUnique({
        omit: { password: true },
        where: { id },
    });

    if (!user) {
        return errorResponse(response, 404, 'User not found');
    }

    response.json(user);
}

export async function patchUser(request: Request, response: Response) {
    const {
        body,
        params: { id },
    } = request;

    try {
        const user = await prisma.user.update({
            data: body,
            where: { id: id as string },
        });

        response.json(user);
    } catch {
        errorResponse(response, 404, 'User not found');
    }
}

export async function deleteUser(request: Request, response: Response) {
    try {
        await prisma.user.delete({ where: { id: request.params.id as string } });

        response.status(204).send();
    } catch {
        errorResponse(response, 404, 'User not found');
    }
}

export async function login(request: Request, response: Response) {
    const { email, password } = request.body;

    if (!email || !password) {
        return errorResponse(response, 400, 'Invalid credentials');
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        return errorResponse(response, 400, 'User not found');
    }

    if (bcrypt.compareSync(password, user.password)) {
        delete (user as any).password;

        return response.status(200).json({
            token: jsonwebtoken.sign(user, environment.JWT_SECRET, {
                expiresIn: '30minutes',
            }),
        });
    }

    errorResponse(response, 400, 'Invalid password');
}
