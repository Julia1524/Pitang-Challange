import express from 'express';

import { permissionsMiddleware } from '../middlewares/permissions.middleware';
import { upload } from '../middlewares/upload.middleware';
import {
    approveRequest,
    cancelRequest,
    deleteRequest,
    getRequestById,
    getRequestHistory,
    getReimbursements,
    getUserReimbursements,
    markAsPaid,
    patchRequest,
    postRequest,
    rejectRequest,
    submitRequest,
} from '../controllers/request.controller';
import {
    deleteAttachment,
    getAttachments,
    postAttachment,
} from '../controllers/attachment.controller';

const reimbursementRouter = express.Router();

reimbursementRouter.get('/reimbursements', getReimbursements);
reimbursementRouter.get('/reimbursements/user/:userId', permissionsMiddleware('ADMIN'), getUserReimbursements);
reimbursementRouter.get('/reimbursements/:id', getRequestById);
reimbursementRouter.post('/reimbursements', permissionsMiddleware('EMPLOYEE'), postRequest);
reimbursementRouter.put('/reimbursements/:id', patchRequest);
reimbursementRouter.post('/reimbursements/:id/submit',permissionsMiddleware('EMPLOYEE'), submitRequest);
reimbursementRouter.post('/reimbursements/:id/cancel', permissionsMiddleware('EMPLOYEE'), cancelRequest);
reimbursementRouter.post('/reimbursements/:id/approve', permissionsMiddleware('MANAGER', 'ADMIN'), approveRequest);
reimbursementRouter.post('/reimbursements/:id/reject', permissionsMiddleware('MANAGER', 'ADMIN'), rejectRequest);
reimbursementRouter.post('/reimbursements/:id/pay', permissionsMiddleware('FINANCE', 'ADMIN'), markAsPaid);
reimbursementRouter.delete('/reimbursements/:id', deleteRequest);
reimbursementRouter.get('/reimbursements/:id/history', getRequestHistory);
reimbursementRouter.get('/reimbursements/:id/attachments', getAttachments);
reimbursementRouter.post('/reimbursements/:id/attachments', permissionsMiddleware('EMPLOYEE'), upload.single('file'), postAttachment);
reimbursementRouter.delete('/reimbursements/attachments/:attachmentId', deleteAttachment);

export default reimbursementRouter;
