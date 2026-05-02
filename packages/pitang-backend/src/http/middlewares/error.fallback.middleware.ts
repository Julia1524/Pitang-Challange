import { environment } from '../../core/EnvVars';
import { logger } from '../../core/Logger';

import type { NextFunction, Request, Response } from 'express';

export function errorFallbackMiddleware(
    error: Error,
    request: Request,
    response: Response,
    _next: NextFunction,
) {
    logger.error(error);

    const body: Record<string, unknown> = {
        message: 'Erro inesperado no servidor',
        statusCode: 500,
        error: 'Internal Server Error',
    };

    if (environment.NODE_ENV === 'development') {
        body.stack = error.stack;
    }

    response.status(500).json(body);
}
