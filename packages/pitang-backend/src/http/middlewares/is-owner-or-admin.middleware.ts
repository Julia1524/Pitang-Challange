import type { NextFunction, Request, Response } from 'express';

import { errorResponse } from '../utils/error-response';

export function isOwnerOrAdmin(request: Request, response: Response, next: NextFunction) {
    if (!request.loggedUser) {
        return errorResponse(response, 401, 'Usuário não autenticado');
    }

    if (request.loggedUser.role === 'ADMIN') {
        return next();
    }

    if (request.loggedUser.id === request.params.id) {
        return next();
    }

    return errorResponse(response, 403, 'Você só pode editar seu próprio perfil');
}
