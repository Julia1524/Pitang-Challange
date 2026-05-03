import express from 'express';

import { permissionsMiddleware } from '../middlewares/permissions.middleware';
import { upload } from '../middlewares/upload.middleware';
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
import {
    deleteAttachment,
    getAttachments,
    postAttachment,
} from '../controllers/attachment.controller';
import { isOwnerOrAdmin } from '../middlewares/is-owner-or-admin.middleware';

const reimbursementRouter = express.Router();

reimbursementRouter.get('/reimbursements', getReimbursements);
reimbursementRouter.get('/reimbursements/:id', getRequestById);
reimbursementRouter.post('/reimbursements', permissionsMiddleware('EMPLOYEE'), postRequest);
reimbursementRouter.put('/reimbursements/:id', patchRequest);
reimbursementRouter.post('/reimbursements/:id/submit', submitRequest);
reimbursementRouter.post('/reimbursements/:id/cancel', cancelRequest);
reimbursementRouter.post('/reimbursements/:id/approve', permissionsMiddleware('MANAGER'), approveRequest);
reimbursementRouter.post('/reimbursements/:id/reject', permissionsMiddleware('MANAGER'), rejectRequest);
reimbursementRouter.post('/reimbursements/:id/pay', permissionsMiddleware('FINANCE'), markAsPaid);
reimbursementRouter.get('/reimbursements/:id/history', getRequestHistory);
reimbursementRouter.get('/reimbursements/:id/attachments', getAttachments);
reimbursementRouter.post('/reimbursements/:id/attachments', permissionsMiddleware('EMPLOYEE'), upload.single('file'), postAttachment);
reimbursementRouter.delete('/reimbursements/attachments/:attachmentId', deleteAttachment);

export default reimbursementRouter;
