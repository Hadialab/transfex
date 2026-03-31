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

export interface Shipment {
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

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  shipmentId?: string;
}

export interface ActivityItem {
  id: string;
  message: string;
  type: 'status_change' | 'new_order' | 'delivery' | 'customs' | 'flagged';
  timestamp: string;
  shipmentId: string;
  orderId: string;
}
