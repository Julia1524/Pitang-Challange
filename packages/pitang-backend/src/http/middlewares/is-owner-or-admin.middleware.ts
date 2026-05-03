import type { NextFunction, Request, Response } from 'express';

import { errorResponse } from '../../utils/error-response';

export function isOwnerOrAdmin(request: Request, response: Response, next: NextFunction) {
    if (!request.loggedUser) {
        return errorResponse(response, 401, 'User not authenticated');
    }

    if (request.loggedUser.role === 'ADMIN') {
        return next();
    }

    if (request.loggedUser.id === request.params.id) {
        return next();
    }

    return errorResponse(response, 403, 'You can only edit your own profile');
}
