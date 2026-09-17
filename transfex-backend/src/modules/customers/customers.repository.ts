import { query } from '../../db/pool';
import type { CustomerRow } from './customers.types';

interface ListParams {
  search?: string;
  page: number;
  pageSize: number;
}

export async function listCustomers(
  params: ListParams
): Promise<{ rows: CustomerRow[]; total: number }> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (params.search) {
    values.push(`%${params.search.toLowerCase()}%`);
    const idx = values.length;
    conditions.push(
      `(lower(name) LIKE $${idx} OR lower(phone) LIKE $${idx} OR lower(coalesce(email, '')) LIKE $${idx})`
    );
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM customers ${where}`,
    values
  );
  const total = Number(countResult.rows[0].count);

  const limit = params.pageSize;
  const offset = (params.page - 1) * params.pageSize;
  const listValues = [...values, limit, offset];

  const result = await query<CustomerRow>(
    `SELECT * FROM customers ${where}
     ORDER BY created_at DESC
     LIMIT $${listValues.length - 1} OFFSET $${listValues.length}`,
    listValues
  );

  return { rows: result.rows, total };
}

export async function findCustomerById(id: string): Promise<CustomerRow | null> {
  const result = await query<CustomerRow>('SELECT * FROM customers WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function createCustomer(input: {
  name: string;
  phone: string;
  email: string | null;
  address: string;
  city: string;
}): Promise<CustomerRow> {
  const result = await query<CustomerRow>(
    `INSERT INTO customers (name, phone, email, address, city)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [input.name, input.phone, input.email, input.address, input.city]
  );
  return result.rows[0];
}

// Fixed allowlist — never build this from Object.keys(req.body) directly,
// even though the input already passed zod. Belt and suspenders against
// mass assignment (the exact bug class flagged in the Coderaas audit).
const UPDATABLE_FIELDS = ['name', 'phone', 'email', 'address', 'city'] as const;
type UpdatableField = (typeof UPDATABLE_FIELDS)[number];

export async function updateCustomer(
  id: string,
  patch: Partial<Record<UpdatableField, string | null>>
): Promise<CustomerRow | null> {
  const setClauses: string[] = [];
  const values: unknown[] = [];

  for (const field of UPDATABLE_FIELDS) {
    if (field in patch) {
      values.push(patch[field]);
      setClauses.push(`${field} = $${values.length}`);
    }
  }

  if (setClauses.length === 0) {
    return findCustomerById(id);
  }

  values.push(id);
  const result = await query<CustomerRow>(
    `UPDATE customers SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return result.rows[0] ?? null;
}

export async function deleteCustomer(id: string): Promise<boolean> {
  const result = await query('DELETE FROM customers WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}
