import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/requireAuth';
import { authLimiter } from '../../middleware/rateLimiters';
import { registerSchema, loginSchema } from './auth.schemas';
import * as controller from './auth.controller';

export const authRouter = Router();

authRouter.post(
  '/register',
  authLimiter,
  validate({ body: registerSchema }),
  asyncHandler(controller.register)
);

authRouter.post(
  '/login',
  authLimiter,
  validate({ body: loginSchema }),
  asyncHandler(controller.login)
);

authRouter.post('/refresh', asyncHandler(controller.refresh));
authRouter.post('/logout', asyncHandler(controller.logout));
authRouter.get('/me', requireAuth, asyncHandler(controller.me));
