import express from 'express';

import { permissionsMiddleware } from '../middlewares/permissions.middleware';
import {
    approveRequest,
    cancelRequest,
    getRequestById,
    getRequestHistory,
    getReimbursements,
    markAsPaid,
    patchRequest,
    postRequest,
    rejectRequest,
    submitRequest,
} from '../controllers/request.controller';

const reimbursementRouter = express.Router();

reimbursementRouter.get('/reimbursements', getReimbursements);
reimbursementRouter.get('/reimbursements/:id', getRequestById);
reimbursementRouter.post('/reimbursements', permissionsMiddleware('EMPLOYEE'), postRequest);
reimbursementRouter.put('/reimbursements/:id', patchRequest);
reimbursementRouter.post('/reimbursements/:id/submit', submitRequest);
reimbursementRouter.post('/reimbursements/:id/approve', permissionsMiddleware('MANAGER'), approveRequest);
reimbursementRouter.post('/reimbursements/:id/reject', permissionsMiddleware('MANAGER'), rejectRequest);
reimbursementRouter.post('/reimbursements/:id/pay', permissionsMiddleware('FINANCE'), markAsPaid);
reimbursementRouter.post('/reimbursements/:id/cancel', cancelRequest);
reimbursementRouter.get('/reimbursements/:id/history', getRequestHistory);

export default reimbursementRouter;
