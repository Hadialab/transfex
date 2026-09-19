import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/requireAuth';
import { aiLimiter } from '../../middleware/rateLimiters';
import { chatSchema } from './ai.schemas';
import * as controller from './ai.controller';

export const aiRouter = Router();

aiRouter.use(requireAuth);

// Dedicated tighter limiter - LLM requests have a direct dollar cost.
aiRouter.post(
  '/chat',
  aiLimiter,
  validate({ body: chatSchema }),
  asyncHandler(controller.chat)
);