import type { NextFunction, Request, Response } from 'express';

import { errorResponse } from '../utils/error-response';

type UserRole = 'EMPLOYEE' | 'MANAGER' | 'FINANCE' | 'ADMIN';

export function permissionsMiddleware(...allowedRoles: UserRole[]) {
    return (request: Request, response: Response, next: NextFunction) => {
        if (!request.loggedUser) {
            return errorResponse(response, 401, 'User not authenticated');
        }

        if (!allowedRoles.includes(request.loggedUser.role)) {
            return errorResponse(response, 403, 'User does not have permission');
        }

        next();
    };
}
