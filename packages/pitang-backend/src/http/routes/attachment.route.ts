import express from 'express';

import { permissionsMiddleware } from '../middlewares/permissions.middleware';
import {
    deleteAttachment,
    getAttachments,
    postAttachment,
} from '../controllers/attachment.controller';

const attachmentRouter = express.Router();

attachmentRouter.get('/requests/:requestId/attachments', getAttachments);
attachmentRouter.post('/requests/:requestId/attachments', permissionsMiddleware('EMPLOYEE'), postAttachment);
attachmentRouter.delete('/attachments/:id', deleteAttachment);

export default attachmentRouter;
