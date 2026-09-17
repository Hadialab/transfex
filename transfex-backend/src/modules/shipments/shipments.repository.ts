import { query } from '../../db/pool';
import type { Platform, ShipmentRow, ShipmentStatus, Origin } from './shipments.types';

// Single projection reused by every read. `items`, `notes`, and
// `status_history` are aggregated in one round trip per row, so the detail
// endpoint doesn't need a second query. Numeric columns are cast to float
// because the pg driver returns `numeric` as string by default.
const SHIPMENT_COLUMNS = `
  s.id,
  s.order_id,
  s.customer_id,
  s.customer_name,
  s.platform,
  s.origin,
  s.status,
  s.weight::float AS weight,
  s.dimensions,
  s.declared_value::float AS declared_value,
  s.tracking_number,
  to_char(s.estimated_delivery, 'YYYY-MM-DD') AS estimated_delivery,
  to_char(s.actual_delivery, 'YYYY-MM-DD') AS actual_delivery,
  s.created_at,
  s.updated_at,
  COALESCE(
    (
      SELECT json_agg(
  json_build_object(
    'name', oi.name,
    'quantity', oi.quantity,
    'price', oi.price::float,
    'url', oi.url
  )
  ORDER BY oi.id ASC
)
      FROM order_items oi
      WHERE oi.shipment_id = s.id
    ),
    '[]'::json
  ) AS items,
  COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'id', n.id,
          'text', n.text,
          'author', n.author,
          'createdAt', n.created_at
        )
        ORDER BY n.created_at ASC, n.id ASC
      )
      FROM notes n
      WHERE n.shipment_id = s.id
    ),
    '[]'::json
  ) AS notes,
  COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'status', sh.status,
          'timestamp', sh.created_at,
          'note', sh.note,
          'location', sh.location
        )
        ORDER BY sh.created_at ASC, sh.id ASC
      )
      FROM status_history sh
      WHERE sh.shipment_id = s.id
    ),
    '[]'::json
  ) AS status_history
`;

interface ListParams {
  status?: ShipmentStatus;
  platform?: Platform;
  origin?: Origin;
  customerId?: string;
  search?: string;
  page: number;
  pageSize: number;
}

export async function listShipments(
  params: ListParams
): Promise<{ rows: ShipmentRow[]; total: number }> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (params.status) {
    values.push(params.status);
    conditions.push(`s.status = $${values.length}`);
  }
  if (params.platform) {
    values.push(params.platform);
    conditions.push(`s.platform = $${values.length}`);
  }
  if (params.origin) {
    values.push(params.origin);
    conditions.push(`s.origin = $${values.length}`);
  }
  if (params.customerId) {
    values.push(params.customerId);
    conditions.push(`s.customer_id = $${values.length}`);
  }
  if (params.search) {
    values.push(`%${params.search.toLowerCase()}%`);
    const idx = values.length;
    // Matches the three fields Header.tsx and Shipments.tsx search on:
    // orderId, customerName, trackingNumber. Lowered on both sides.
    conditions.push(
      `(lower(s.order_id) LIKE $${idx}
        OR lower(s.customer_name) LIKE $${idx}
        OR lower(coalesce(s.tracking_number, '')) LIKE $${idx})`
    );
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM shipments s ${where}`,
    values
  );
  const total = Number(countResult.rows[0].count);

  const offset = (params.page - 1) * params.pageSize;
  const listValues = [...values, params.pageSize, offset];

  const result = await query<ShipmentRow>(
    `SELECT ${SHIPMENT_COLUMNS}
     FROM shipments s
     ${where}
     ORDER BY s.created_at DESC
     LIMIT $${listValues.length - 1} OFFSET $${listValues.length}`,
    listValues
  );

  return { rows: result.rows, total };
}

export async function findShipmentById(id: string): Promise<ShipmentRow | null> {
  const result = await query<ShipmentRow>(
    `SELECT ${SHIPMENT_COLUMNS} FROM shipments s WHERE s.id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

// Fixed allowlist for PATCH - never build the SET clause from Object.keys
// of the request body. Same belt-and-suspenders against mass assignment that
// the customers repository uses.
const UPDATEABLE_FIELDS = [
  'weight',
  'dimensions',
  'declared_value',
  'tracking_number',
  'estimated_delivery',
] as const;
type UpdateableField = (typeof UPDATEABLE_FIELDS)[number];

export async function updateShipment(
  id: string,
  patch: Partial<Record<UpdateableField, unknown>>
): Promise<ShipmentRow | null> {
  const setClauses: string[] = [];
  const values: unknown[] = [];

  for (const field of UPDATEABLE_FIELDS) {
    if (field in patch) {
      values.push(patch[field]);
      setClauses.push(`${field} = $${values.length}`);
    }
  }

  if (setClauses.length === 0) {
    return findShipmentById(id);
  }

  // Always bump updated_at when anything changes.
  setClauses.push('updated_at = now()');

  values.push(id);
  const result = await query<{ id: string }>(
    `UPDATE shipments SET ${setClauses.join(', ')}
     WHERE id = $${values.length}
     RETURNING id`,
    values
  );

  if (!result.rows[0]) return null;
  return findShipmentById(id);
}

export async function deleteShipment(id: string): Promise<boolean> {
  const result = await query('DELETE FROM shipments WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}