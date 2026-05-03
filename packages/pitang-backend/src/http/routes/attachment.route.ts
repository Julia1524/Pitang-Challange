import express from 'express';

import { permissionsMiddleware } from '../middlewares/permissions.middleware';
import {
    deleteAttachment,
    getAttachments,
    postAttachment,
} from '../controllers/attachment.controller';
import { isOwnerOrAdmin } from '../middlewares/is-owner-or-admin.middleware';

const attachmentRouter = express.Router();

attachmentRouter.get('/reimbursements/:id/attachments', getAttachments);
attachmentRouter.post('/reimbursements/:id/attachments', postAttachment);
attachmentRouter.delete('/attachments/:attachmentId', isOwnerOrAdmin, deleteAttachment);

export default attachmentRouter;
