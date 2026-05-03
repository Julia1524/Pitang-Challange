import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { authMiddleware } from './http/middlewares/auth.middleware';
import { errorFallbackMiddleware } from './http/middlewares/error.fallback.middleware';
import categoryRouter from './http/routes/category.route';
import reimbursementRouter from './http/routes/request.route';
import userRouter from './http/routes/user.route';
import attachmentRouter from './http/routes/attachment.route';

const app = express();

app.use(express.json());

app.use(
    cors({
        allowedHeaders: ['Content-Type', 'Authorization'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        origin: '*',
    }),
);
app.use(morgan('dev'));
app.use(helmet());
app.use(authMiddleware);

app.use('/', userRouter);
app.use('/', categoryRouter);
app.use('/', reimbursementRouter);
app.use('/', attachmentRouter)

app.use(errorFallbackMiddleware);

export { app };
