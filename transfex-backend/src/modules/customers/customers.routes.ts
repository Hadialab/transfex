import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';
import {
  createCustomerSchema,
  updateCustomerSchema,
  listCustomersQuerySchema,
  customerIdParamSchema,
} from './customers.schemas';
import * as controller from './customers.controller';

export const customersRouter = Router();

customersRouter.use(requireAuth);

customersRouter.get(
  '/',
  validate({ query: listCustomersQuerySchema }),
  asyncHandler(controller.list)
);

customersRouter.get(
  '/:id',
  validate({ params: customerIdParamSchema }),
  asyncHandler(controller.getOne)
);

customersRouter.post(
  '/',
  validate({ body: createCustomerSchema }),
  asyncHandler(controller.create)
);

customersRouter.patch(
  '/:id',
  validate({ params: customerIdParamSchema, body: updateCustomerSchema }),
  asyncHandler(controller.update)
);

customersRouter.delete(
  '/:id',
  requireRole('admin'),
  validate({ params: customerIdParamSchema }),
  asyncHandler(controller.remove)
);
