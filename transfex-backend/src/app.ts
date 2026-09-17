import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './config/logger';
import { generalLimiter } from './middleware/rateLimiters';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import { authRouter } from './modules/auth/auth.routes';
import { customersRouter } from './modules/customers/customers.routes';
import { shipmentRouter } from './modules/shipments/shipments.routes';
export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_ORIGIN,
    credentials: true, // required so the browser sends/accepts the refresh cookie
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(pinoHttp({ logger }));
app.use(generalLimiter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/customers', customersRouter);

// Later phases mount here:
 app.use('/api/shipments', shipmentRouter);
// app.use('/api/notifications', notificationsRouter);
// app.use('/api/track', trackRouter);
// app.use('/api/ai', aiRouter);
// app.use('/api/analytics', analyticsRouter);

app.use(notFoundHandler);
app.use(errorHandler);
