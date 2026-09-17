import * as repo from './activity.repository';
import {
  STATUS_LABEL,
  type ActivityRow,
  type ActivityType,
  type PublicActivity,
} from './activity.types';

function classify(row: ActivityRow): ActivityType {
  if (Number(row.rn) === 1) return 'new_order';
  if (row.status === 'delivered') return 'delivery';
  if (row.status === 'customs') return 'customs';
  if (row.status === 'flagged') return 'flagged';
  return 'status_change';
}

function buildMessage(row: ActivityRow, type: ActivityType): string {
  const { order_id, customer_name, status, note, location } = row;

  switch (type) {
    case 'new_order':
      return `New order ${order_id} placed by ${customer_name}`;
    case 'delivery':
      return location
        ? `Order ${order_id} delivered to ${location}`
        : `Order ${order_id} delivered`;
    case 'customs':
      return `Order ${order_id} arrived at customs`;
    case 'flagged':
      return note
        ? `Order ${order_id} flagged - ${note}`
        : `Order ${order_id} flagged`;
    case 'status_change':
    default:
      return `Order ${order_id} is now ${STATUS_LABEL[status]}`;
  }
}

function toPublicActivity(row: ActivityRow): PublicActivity {
  const type = classify(row);
  return {
    id: row.id,
    message: buildMessage(row, type),
    type,
    timestamp: row.timestamp.toISOString(),
    shipmentId: row.shipment_id,
    orderId: row.order_id,
  };
}

export async function listRecent(limit: number): Promise<PublicActivity[]> {
  const rows = await repo.listRecent(limit);
  return rows.map(toPublicActivity);
}