import { z } from 'zod';

const statusEnum = z.enum([
  'pending',
  'picked_up',
  'in_transit',
  'customs',
  'out_for_delivery',
  'delivered',
  'flagged',
]);

const platformEnum = z.enum(['trendyol', 'shein', 'aliexpress', 'alibaba', 'other']);
const originEnum = z.enum(['china', 'dubai']);

const orderItemSchema = z.object({
  name: z.string().trim().min(1, 'Item name is required').max(500),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  url: z
    .string()
    .trim()
    .url('Enter a valid URL')
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined),
});

// Inline new-customer details, used when the form doesn't pick an existing
// customer. Same rules as the customers module so validation stays consistent.
const inlineCustomerSchema = z.object({
  name: z.string().trim().min(2, 'Enter a name').max(200),
  phone: z.string().trim().min(6, 'Enter a valid phone number').max(30),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Enter a valid email address')
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined),
  address: z.string().trim().min(1, 'Enter an address').max(500),
  city: z.string().trim().min(1, 'Enter a city').max(200),
});

export const createShipmentSchema = z
  .object({
    customerId: z.string().uuid('Invalid customer id').optional(),
    customer: inlineCustomerSchema.optional(),
    platform: platformEnum,
    origin: originEnum,
    items: z.array(orderItemSchema).min(1, 'At least one item is required'),
    // The form can send 0 when weight is left blank; numeric(10,2) has no
    // positive constraint, so min(0) is the honest server-side rule.
    weight: z.coerce.number().min(0, 'Weight cannot be negative'),
    dimensions: z
      .string()
      .trim()
      .max(100)
      .optional()
      .or(z.literal(''))
      .transform((v) => v || undefined),
    declaredValue: z.coerce.number().min(0, 'Declared value cannot be negative'),
    trackingNumber: z
      .string()
      .trim()
      .max(100)
      .optional()
      .or(z.literal(''))
      .transform((v) => v || undefined),
    // Required. Frontend computes it from origin and sends an ISO string.
    estimatedDelivery: z.coerce.date(),
  })
  .refine((data) => data.customerId || data.customer, {
    message: 'Provide an existing customerId or new customer details',
    path: ['customerId'],
  })
  .refine((data) => !(data.customerId && data.customer), {
    message: 'Provide customerId or new customer details, not both',
    path: ['customerId'],
  });

export const updateShipmentSchema = z
  .object({
    weight: z.coerce.number().min(0).optional(),
    dimensions: z
      .string()
      .trim()
      .max(100)
      .optional()
      .or(z.literal(''))
      .transform((v) => v ?? null),
    declaredValue: z.coerce.number().min(0).optional(),
    trackingNumber: z
      .string()
      .trim()
      .max(100)
      .optional()
      .or(z.literal(''))
      .transform((v) => v ?? null),
    estimatedDelivery: z.coerce.date().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

export const updateStatusSchema = z.object({
  status: statusEnum,
  note: z.string().trim().max(1000).optional(),
  location: z.string().trim().max(200).optional(),
});

export const addNoteSchema = z.object({
  text: z.string().trim().min(1, 'Note cannot be empty').max(2000),
});

export const listShipmentsQuerySchema = z.object({
  status: statusEnum.optional(),
  platform: platformEnum.optional(),
  origin: originEnum.optional(),
  customerId: z.string().uuid().optional(),
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const shipmentIdParamsSchema = z.object({
  id: z.string().uuid('Invalid shipment id'),
});

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
export type UpdateShipmentInput = z.infer<typeof updateShipmentSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type AddNoteInput = z.infer<typeof addNoteSchema>;
export type ListShipmentsQuery = z.infer<typeof listShipmentsQuerySchema>;