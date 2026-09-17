import { ApiError } from '../../utils/ApiError';
import * as repo from './customers.repository';
import { toPublicCustomer, type PublicCustomer } from './customers.types';
import type { CreateCustomerInput, UpdateCustomerInput, ListCustomersQuery } from './customers.schemas';

function normalizeEmail(email: string | undefined): string | null {
  return email ? email : null;
}

export async function list(
  q: ListCustomersQuery
): Promise<{ customers: PublicCustomer[]; total: number; page: number; pageSize: number }> {
  const { rows, total } = await repo.listCustomers({
    search: q.search,
    page: q.page,
    pageSize: q.pageSize,
  });
  return {
    customers: rows.map(toPublicCustomer),
    total,
    page: q.page,
    pageSize: q.pageSize,
  };
}

export async function getById(id: string): Promise<PublicCustomer> {
  const row = await repo.findCustomerById(id);
  if (!row) throw ApiError.notFound('Customer not found');
  return toPublicCustomer(row);
}

export async function create(input: CreateCustomerInput): Promise<PublicCustomer> {
  const row = await repo.createCustomer({
    name: input.name,
    phone: input.phone,
    email: normalizeEmail(input.email),
    address: input.address,
    city: input.city,
  });
  return toPublicCustomer(row);
}

export async function update(id: string, input: UpdateCustomerInput): Promise<PublicCustomer> {
  // Confirm the record exists first — a 404 here beats a silent no-op update,
  // and matches the shape every other domain in this API uses for by-id routes.
  const existing = await repo.findCustomerById(id);
  if (!existing) throw ApiError.notFound('Customer not found');

  const patch: Partial<Record<'name' | 'phone' | 'email' | 'address' | 'city', string | null>> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.phone !== undefined) patch.phone = input.phone;
  if (input.email !== undefined) patch.email = normalizeEmail(input.email);
  if (input.address !== undefined) patch.address = input.address;
  if (input.city !== undefined) patch.city = input.city;

  const row = await repo.updateCustomer(id, patch);
  // row can't actually be null here (existence already confirmed above),
  // but keep the check rather than asserting non-null.
  if (!row) throw ApiError.notFound('Customer not found');
  return toPublicCustomer(row);
}

export async function remove(id: string): Promise<void> {
  const deleted = await repo.deleteCustomer(id);
  if (!deleted) throw ApiError.notFound('Customer not found');
}
