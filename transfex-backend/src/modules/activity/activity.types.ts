import type { ShipmentStatus } from '../shipments/shipments.types';

export type ActivityType =
  | 'status_change'
  | 'new_order'
  | 'delivery'
  | 'customs'
  | 'flagged';

export interface ActivityRow {
  id: string;
  status: ShipmentStatus;
  timestamp: Date;
  note: string | null;
  location: string | null;
  shipment_id: string;
  order_id: string;
  customer_name: string;
  // ROW_NUMBER() returns bigint, which the pg driver surfaces as a string.
  rn: string;
}

// Mirrors `ActivityItem` in the frontend's src/types/index.ts exactly.
export interface PublicActivity {
  id: string;
  message: string;
  type: ActivityType;
  timestamp: string;
  shipmentId: string;
  orderId: string;
}

// Server-side label map so the activity feed doesn't have to trust or
// duplicate the frontend's statusConfig.
export const STATUS_LABEL: Record<ShipmentStatus, string> = {
  pending: 'pending',
  picked_up: 'picked up',
  in_transit: 'in transit',
  customs: 'in customs',
  out_for_delivery: 'out for delivery',
  delivered: 'delivered',
  flagged: 'flagged',
};