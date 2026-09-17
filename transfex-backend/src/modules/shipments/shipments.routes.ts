import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';
import {
  createShipmentSchema,
  updateShipmentSchema,
  updateStatusSchema,
  addNoteSchema,
  listShipmentsQuerySchema,
  shipmentIdParamsSchema,
} from './shipments.schemas';
import * as controller from './shipments.controller';

export const shipmentRouter = Router();

shipmentRouter.use(requireAuth);

shipmentRouter.get(
  '/',
  validate({ query: listShipmentsQuerySchema }),
  asyncHandler(controller.list)
);

shipmentRouter.get(
  '/:id',
  validate({ params: shipmentIdParamsSchema }),
  asyncHandler(controller.getOne)
);

shipmentRouter.post(
  '/',
  validate({ body: createShipmentSchema }),
  asyncHandler(controller.create)
);

shipmentRouter.patch(
  '/:id',
  validate({ params: shipmentIdParamsSchema, body: updateShipmentSchema }),
  asyncHandler(controller.update)
);

shipmentRouter.patch(
  '/:id/status',
  validate({ params: shipmentIdParamsSchema, body: updateStatusSchema }),
  asyncHandler(controller.updateStatus)
);

shipmentRouter.post(
  '/:id/notes',
  validate({ params: shipmentIdParamsSchema, body: addNoteSchema }),
  asyncHandler(controller.addNote)
);

shipmentRouter.delete(
  '/:id',
  requireRole('admin'),
  validate({ params: shipmentIdParamsSchema }),
  asyncHandler(controller.remove)
);