export type ShipmentStatus =
  | 'pending'
  | 'picked_up'
  | 'in_transit'
  | 'customs'
  | 'out_for_delivery'
  | 'delivered'
  | 'flagged';

export type Platform = 'trendyol' | 'shein' | 'aliexpress' | 'alibaba' | 'other';
export type Origin = 'china' | 'dubai';

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  url?: string;
}

export interface Note {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface StatusEvent {
  status: ShipmentStatus;
  timestamp: string;
  note?: string;
  location?: string;
}

// Raw DB row shape (snake_case). `items`, `notes`, and `status_history`
// arrive already-camelCased from json_build_object in the SQL projection,
// so they only need passing through here.
export interface ShipmentRow {
  id: string;
  order_id: string;
  customer_id: string;
  customer_name: string;
  platform: Platform;
  origin: Origin;
  status: ShipmentStatus;
  weight: number;
  dimensions: string | null;
  declared_value: number;
  tracking_number: string | null;
  estimated_delivery: string; // 'YYYY-MM-DD'
  actual_delivery: string | null;
  created_at: Date;
  updated_at: Date;
  items: OrderItem[];
  notes: Note[];
  status_history: StatusEvent[];
}

// Mirrors `Shipment` in the frontend's src/types/index.ts exactly.
export interface PublicShipment {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  platform: Platform;
  origin: Origin;
  status: ShipmentStatus;
  items: OrderItem[];
  weight: number;
  dimensions?: string;
  declaredValue: number;
  trackingNumber?: string;
  estimatedDelivery: string;
  actualDelivery?: string;
  notes: Note[];
  createdAt: string;
  updatedAt: string;
  statusHistory: StatusEvent[];
}

export function toPublicShipment(row: ShipmentRow): PublicShipment {
  return {
    id: row.id,
    orderId: row.order_id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    platform: row.platform,
    origin: row.origin,
    status: row.status,
    items: row.items,
    weight: Number(row.weight),
    dimensions: row.dimensions ?? undefined,
    declaredValue: Number(row.declared_value),
    trackingNumber: row.tracking_number ?? undefined,
    estimatedDelivery: row.estimated_delivery,
    actualDelivery: row.actual_delivery ?? undefined,
    notes: row.notes,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    statusHistory: row.status_history,
  };
}