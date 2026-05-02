import express from 'express';

import { isOwnerOrAdmin } from '../middlewares/is-owner-or-admin.middleware';
import { permissionsMiddleware } from '../middlewares/permissions.middleware';
import {
    getCategory,
    getCategoryById,
    postCategory,
    patchCategory,
    deleteCategory,
} from '../controllers/catogory.controller';

const categoryRouter = express.Router();

categoryRouter.get('/categories', getCategory);
categoryRouter.get('/categories/:id', getCategoryById);
categoryRouter.post('/categories',permissionsMiddleware('ADMIN'),  postCategory);
categoryRouter.patch('/categories/:id', permissionsMiddleware('ADMIN'), patchCategory);
categoryRouter.delete('/categories/:id', permissionsMiddleware('ADMIN'), deleteCategory); 
export default categoryRouter;
