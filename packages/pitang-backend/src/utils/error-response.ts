import type { Response } from 'express';

const errorLabels: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    500: 'Internal Server Error',
};

export function errorResponse(
    response: Response,
    statusCode: number,
    message: string,
    details?: unknown,
) {
    const body: Record<string, unknown> = {
        message,
        statusCode,
        error: errorLabels[statusCode] ?? 'Error',
    };

    if (details) {
        body.details = details;
    }

    return response.status(statusCode).json(body);
}
