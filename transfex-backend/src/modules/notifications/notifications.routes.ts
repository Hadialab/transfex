import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/requireAuth';
import { notificationIdParamsSchema } from './notifications.schemas';
import * as controller from './notifications.controller';

export const notificationRouter = Router();

notificationRouter.use(requireAuth);

notificationRouter.get('/', asyncHandler(controller.list));

// Declared before the dynamic route for clarity, though the shapes can't
// actually collide: /read-all is one segment, /:id/read is two.
notificationRouter.patch('/read-all', asyncHandler(controller.markAllRead));

notificationRouter.patch(
  '/:id/read',
  validate({ params: notificationIdParamsSchema }),
  asyncHandler(controller.markRead)
);