import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/requireAuth';
import { listActivityQuerySchema } from './activity.schemas';
import * as controller from './activity.controller';

export const activityRouter = Router();

activityRouter.use(requireAuth);

activityRouter.get(
  '/',
  validate({ query: listActivityQuerySchema }),
  asyncHandler(controller.list)
);