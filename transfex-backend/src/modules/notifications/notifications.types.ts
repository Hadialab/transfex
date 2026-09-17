export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  shipment_id: string | null;
  created_at: Date;
}

// Mirrors `Notification` in the frontend's src/types/index.ts exactly.
export interface PublicNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  shipmentId?: string;
}

export function toPublicNotification(row: NotificationRow): PublicNotification {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type,
    read: row.read,
    createdAt: row.created_at.toISOString(),
    shipmentId: row.shipment_id ?? undefined,
  };
}