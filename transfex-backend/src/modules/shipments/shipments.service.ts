import type { PoolClient } from 'pg';
import { withTransaction } from '../../db/pool';
import { ApiError } from '../../utils/ApiError';
import * as repo from './shipments.repository';
import {
  toPublicShipment,
  type PublicShipment,
  type ShipmentStatus,
} from './shipments.types';
import type {
  CreateShipmentInput,
  UpdateShipmentInput,
  UpdateStatusInput,
  ListShipmentsQuery,
} from './shipments.schemas';

// Ladder the frontend renders in Timeline.tsx. `flagged` is deliberately not
// on it - it's a side state reachable from anywhere (see isAllowedTransition).
const STATUS_ORDER: ShipmentStatus[] = [
  'pending',
  'picked_up',
  'in_transit',
  'customs',
  'out_for_delivery',
  'delivered',
];

// Mirrors ShipmentDetail.tsx's `nextStatuses` logic: forward-only on the
// ladder, plus flagged reachable from any state, plus any state reachable
// from flagged (the UI shows every status as a next option once flagged).
function isAllowedTransition(from: ShipmentStatus, to: ShipmentStatus): boolean {
  if (from === to) return false;
  if (to === 'flagged') return true;
  if (from === 'flagged') return true;
  const fromIdx = STATUS_ORDER.indexOf(from);
  const toIdx = STATUS_ORDER.indexOf(to);
  return fromIdx >= 0 && toIdx === fromIdx + 1;
}

function allowedNextStatuses(from: ShipmentStatus): ShipmentStatus[] {
  return [...STATUS_ORDER, 'flagged' as ShipmentStatus].filter((s) =>
    isAllowedTransition(from, s)
  );
}

export async function list(
  q: ListShipmentsQuery
): Promise<{
  shipments: PublicShipment[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const { rows, total } = await repo.listShipments(q);
  return {
    shipments: rows.map(toPublicShipment),
    total,
    page: q.page,
    pageSize: q.pageSize,
  };
}

export async function getById(id: string): Promise<PublicShipment> {
  const row = await repo.findShipmentById(id);
  if (!row) throw ApiError.notFound('Shipment not found');
  return toPublicShipment(row);
}

export async function create(input: CreateShipmentInput): Promise<PublicShipment> {
  const newId = await withTransaction(async (client: PoolClient) => {
    // Resolve or create the customer inside the same transaction so a
    // shipment can never reference a customer row that wasn't committed.
    let customerId: string;
    let customerName: string;

    if (input.customerId) {
      const found = await client.query<{ id: string; name: string }>(
        'SELECT id, name FROM customers WHERE id = $1',
        [input.customerId]
      );
      if (!found.rows[0]) throw ApiError.badRequest('Customer not found');
      customerId = found.rows[0].id;
      customerName = found.rows[0].name;
    } else {
      // .refine() on the schema guarantees input.customer exists here.
      const nc = input.customer!;
      const created = await client.query<{ id: string; name: string }>(
        `INSERT INTO customers (name, phone, email, address, city)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name`,
        [nc.name, nc.phone, nc.email ?? null, nc.address, nc.city]
      );
      customerId = created.rows[0].id;
      customerName = created.rows[0].name;
    }

    // Server-assigned order id. Sequence-backed, so no client-side collision
    // window (the mock generated a random 4-digit number).
    const seq = await client.query<{ n: string }>(
      "SELECT nextval('shipments_order_seq')::text AS n"
    );
    const orderId = `TFX-${seq.rows[0].n}`;

    // Extract the YYYY-MM-DD in UTC before storing so the date column can't
    // shift by a day based on the server's timezone.
    const estimatedDeliveryYmd = input.estimatedDelivery
      .toISOString()
      .slice(0, 10);

    const inserted = await client.query<{ id: string }>(
      `INSERT INTO shipments (
         order_id, customer_id, customer_name, platform, origin,
         weight, dimensions, declared_value, tracking_number, estimated_delivery
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::date)
       RETURNING id`,
      [
        orderId,
        customerId,
        customerName,
        input.platform,
        input.origin,
        input.weight,
        input.dimensions ?? null,
        input.declaredValue,
        input.trackingNumber ?? null,
        estimatedDeliveryYmd,
      ]
    );
    const shipmentId = inserted.rows[0].id;

    for (const item of input.items) {
      await client.query(
        `INSERT INTO order_items (shipment_id, name, quantity, price, url)
         VALUES ($1, $2, $3, $4, $5)`,
        [shipmentId, item.name, item.quantity, item.price, item.url ?? null]
      );
    }

    // The frontend expects statusHistory to never be empty, so the initial
    // transition is written here, not lazily on first read.
    await client.query(
      `INSERT INTO status_history (shipment_id, status, location)
       VALUES ($1, 'pending', $2)`,
      [shipmentId, input.origin === 'china' ? 'China' : 'Dubai']
    );

    return shipmentId;
  });

  return getById(newId);
}

export async function update(
  id: string,
  input: UpdateShipmentInput
): Promise<PublicShipment> {
  // Translate the validated camelCase patch to the repository's snake_case
  // allowlist keys. Only keys the schema permits can end up here.
  const patch: Record<string, unknown> = {};
  if (input.weight !== undefined) patch.weight = input.weight;
  if (input.dimensions !== undefined) patch.dimensions = input.dimensions;
  if (input.declaredValue !== undefined) patch.declared_value = input.declaredValue;
  if (input.trackingNumber !== undefined) patch.tracking_number = input.trackingNumber;
  if (input.estimatedDelivery !== undefined) {
    patch.estimated_delivery = input.estimatedDelivery.toISOString().slice(0, 10);
  }

  const row = await repo.updateShipment(id, patch);
  if (!row) throw ApiError.notFound('Shipment not found');
  return toPublicShipment(row);
}

export async function updateStatus(
  id: string,
  input: UpdateStatusInput
): Promise<PublicShipment> {
  await withTransaction(async (client: PoolClient) => {
    // Lock the row so two concurrent status updates can't both pass the
    // ladder check and append conflicting history entries.
    const current = await client.query<{ status: ShipmentStatus }>(
      'SELECT status FROM shipments WHERE id = $1 FOR UPDATE',
      [id]
    );
    if (!current.rows[0]) throw ApiError.notFound('Shipment not found');

    const from = current.rows[0].status;
    if (!isAllowedTransition(from, input.status)) {
      throw ApiError.badRequest(
        `Cannot move status from "${from}" to "${input.status}"`,
        { allowed: allowedNextStatuses(from) }
      );
    }

    await client.query(
      `UPDATE shipments
         SET status = $1,
             updated_at = now(),
             actual_delivery = CASE
               WHEN $1::text = 'delivered' AND actual_delivery IS NULL
                 THEN now()::date
               ELSE actual_delivery
             END
       WHERE id = $2`,
      [input.status, id]
    );

    await client.query(
      `INSERT INTO status_history (shipment_id, status, note, location)
       VALUES ($1, $2, $3, $4)`,
      [id, input.status, input.note ?? null, input.location ?? null]
    );
  });

  return getById(id);
}

export async function addNote(
  shipmentId: string,
  text: string,
  actingUserId: string
): Promise<PublicShipment> {
  await withTransaction(async (client: PoolClient) => {
    const existing = await client.query<{ id: string }>(
      'SELECT id FROM shipments WHERE id = $1',
      [shipmentId]
    );
    if (!existing.rows[0]) throw ApiError.notFound('Shipment not found');

    // Author comes from req.user.sub resolved server-side, never from the
    // request body. Snapshot the name at write time so a later rename
    // doesn't rewrite history.
    const user = await client.query<{ name: string }>(
      'SELECT name FROM users WHERE id = $1',
      [actingUserId]
    );
    if (!user.rows[0]) throw ApiError.unauthorized('User no longer exists');

    await client.query(
      'INSERT INTO notes (shipment_id, text, author) VALUES ($1, $2, $3)',
      [shipmentId, text, user.rows[0].name]
    );

    // Bump the parent shipment so Dashboard's "recent" sort picks it up.
    await client.query(
      'UPDATE shipments SET updated_at = now() WHERE id = $1',
      [shipmentId]
    );
  });

  return getById(shipmentId);
}

export async function remove(id: string): Promise<void> {
  const deleted = await repo.deleteShipment(id);
  if (!deleted) throw ApiError.notFound('Shipment not found');
}