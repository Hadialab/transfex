import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { trackLimiter } from '../../middleware/rateLimiters';
import { trackParamsSchema } from './track.schemas';
import * as controller from './track.controller';

export const trackRouter = Router();

// The ONLY route in this API without requireAuth. Everything it returns is
// deliberately non-sensitive (see track.types.ts) and the limiter above is
// the tightest in the app because of it.
trackRouter.get(
  '/:code',
  trackLimiter,
  validate({ params: trackParamsSchema }),
  asyncHandler(controller.lookup)
);