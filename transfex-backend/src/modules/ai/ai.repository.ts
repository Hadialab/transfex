import { query } from '../../db/pool';
import type { ShipmentContext } from './ai.types';

export async function buildContextForUser(_userId: string): Promise<ShipmentContext> {
  // Status counts, scoped to all shipments for now. If staff ever get
  // scoped to their own shipments, this is the query that changes.
  const statusRows = await query<{ status: string; count: string }>(
    `SELECT status, COUNT(*)::text AS count FROM shipments GROUP BY status`
  );
  const statusBreakdown: Record<string, number> = {};
  for (const r of statusRows.rows) statusBreakdown[r.status] = Number(r.count);

  const originRows = await query<{ origin: string; count: string }>(
    `SELECT origin, COUNT(*)::text AS count FROM shipments GROUP BY origin`
  );
  const originBreakdown: Record<string, number> = {};
  for (const r of originRows.rows) originBreakdown[r.origin] = Number(r.count);

  const total = statusRows.rows.reduce((acc, r) => acc + Number(r.count), 0);

  // Flagged shipments with their most recent note, so the assistant can
  // actually explain why something was flagged instead of just counting.
  const flaggedRows = await query<{
    order_id: string;
    customer_name: string;
    latest_note: string | null;
  }>(
    `SELECT s.order_id, s.customer_name,
            (SELECT text FROM notes WHERE shipment_id = s.id
             ORDER BY created_at DESC LIMIT 1) AS latest_note
     FROM shipments s
     WHERE s.status = 'flagged'
     ORDER BY s.updated_at DESC
     LIMIT 10`
  );

  const customsRows = await query<{
    order_id: string;
    customer_name: string;
    origin: string;
  }>(
    `SELECT order_id, customer_name, origin
     FROM shipments
     WHERE status = 'customs'
     ORDER BY updated_at DESC
     LIMIT 10`
  );

  // Reuse the activity feed's derivation - this is the same data the
  // dashboard shows, so the assistant describes what the user sees.
  const activityRows = await query<{
    status: string;
    created_at: Date;
    order_id: string;
    rn: string;
  }>(
    `SELECT sh.status, sh.created_at, s.order_id,
            ROW_NUMBER() OVER (
              PARTITION BY sh.shipment_id
              ORDER BY sh.created_at ASC, sh.id ASC
            )::text AS rn
     FROM status_history sh
     JOIN shipments s ON s.id = sh.shipment_id
     ORDER BY sh.created_at DESC, sh.id DESC
     LIMIT 8`
  );

  const STATUS_LABEL: Record<string, string> = {
    pending: 'pending',
    picked_up: 'picked up',
    in_transit: 'in transit',
    customs: 'in customs',
    out_for_delivery: 'out for delivery',
    delivered: 'delivered',
    flagged: 'flagged',
  };

  const recentActivity = activityRows.rows.map((r) => {
    if (Number(r.rn) === 1) {
      return { message: `New order ${r.order_id} placed`, timestamp: r.created_at.toISOString() };
    }
    if (r.status === 'delivered') {
      return { message: `Order ${r.order_id} delivered`, timestamp: r.created_at.toISOString() };
    }
    if (r.status === 'customs') {
      return { message: `Order ${r.order_id} arrived at customs`, timestamp: r.created_at.toISOString() };
    }
    if (r.status === 'flagged') {
      return { message: `Order ${r.order_id} flagged`, timestamp: r.created_at.toISOString() };
    }
    return {
      message: `Order ${r.order_id} is now ${STATUS_LABEL[r.status] ?? r.status}`,
      timestamp: r.created_at.toISOString(),
    };
  });

  return {
    totalShipments: total,
    statusBreakdown,
    originBreakdown,
    flagged: flaggedRows.rows.map((r) => ({
      orderId: r.order_id,
      customerName: r.customer_name,
      latestNote: r.latest_note,
    })),
    inCustoms: customsRows.rows.map((r) => ({
      orderId: r.order_id,
      customerName: r.customer_name,
      origin: r.origin,
    })),
    recentActivity,
  };
}