import express from 'express';

import { isOwnerOrAdmin } from '../middlewares/is-owner-or-admin.middleware';
import { permissionsMiddleware } from '../middlewares/permissions.middleware';
import {
    deleteUser,
    getMe,
    getUser,
    getUsers,
    login,
    patchUser,
    postUser,
} from '../controllers/user.controller';

const userRouter = express.Router();

userRouter.post('/auth/login', login);
userRouter.get('/auth/me', getMe);
userRouter.get('/users', permissionsMiddleware('ADMIN'), getUsers);
userRouter.get('/users/:id',permissionsMiddleware('ADMIN'),  getUser);
userRouter.post('/users', postUser);
userRouter.patch('/users/:id', isOwnerOrAdmin, patchUser);
userRouter.delete('/users/:id', isOwnerOrAdmin, deleteUser);

export default userRouter;
