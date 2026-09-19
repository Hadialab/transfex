import type { ShipmentStatus } from '../shipments/shipments.types';

export interface TrackStatusEvent {
  status: ShipmentStatus;
  timestamp: string;
  location?: string;
}

/**
 * Deliberately NOT the full Shipment shape. A stranger with a tracking
 * number gets enough to know where their package is, and nothing else:
 * no customer name, no phone, no address, no items, no declared value,
 * no platform (which would leak the merchant), no tracking number echo.
 */
export interface PublicTracking {
  orderId: string;
  status: ShipmentStatus;
  estimatedDelivery: string;
  actualDelivery?: string;
  statusHistory: TrackStatusEvent[];
}

export interface TrackRow {
  id: string;
  order_id: string;
  status: ShipmentStatus;
  estimated_delivery: string;
  actual_delivery: string | null;
  history: TrackStatusEvent[];
}