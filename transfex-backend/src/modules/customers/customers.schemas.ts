import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().trim().min(2, 'Enter a name').max(200),
  phone: z.string().trim().min(6, 'Enter a valid phone number').max(30),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').optional().or(z.literal('')),
  address: z.string().trim().min(1, 'Enter an address').max(500),
  city: z.string().trim().min(1, 'Enter a city').max(200),
});

// Same fields, all optional — at least one must be present.
export const updateCustomerSchema = createCustomerSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Provide at least one field to update' }
);

export const listCustomersQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const customerIdParamSchema = z.object({
  id: z.string().uuid('Invalid customer id'),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
