import jsonwebtoken from 'jsonwebtoken';

import { environment } from '../../core/EnvVars';
import { errorResponse } from '../utils/error-response';

import type { NextFunction, Request, Response } from 'express';

const allowedPaths = {
    GET: ['/'],
    POST: ['/login', '/users'],
} as const;

function matchPath(path: string, pattern: string): boolean {
    if (pattern.endsWith('/*')) {
        const prefix = pattern.slice(0, -1);
        return path.startsWith(prefix);
    }

    return path === pattern;
}

export function authMiddleware(
    request: Request,
    response: Response,
    next: NextFunction,
) {
    const paths =
        allowedPaths[request.method as keyof typeof allowedPaths] ?? [];

    if (paths.some((path) => matchPath(request.path, path))) {
        return next();
    }

    const {
        headers: { authorization },
    } = request;

    if (!authorization) {
        return errorResponse(response, 401, 'Usuário não autenticado');
    }

    const [, token = ''] = authorization.split(' ');

    try {
        request.loggedUser = jsonwebtoken.verify(token, environment.JWT_SECRET);

        next();
    } catch {
        errorResponse(response, 401, 'Token inválido ou expirado');
    }
}
