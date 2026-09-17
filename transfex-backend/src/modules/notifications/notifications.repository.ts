import type { PoolClient } from 'pg';
import { query } from '../../db/pool';
import type { NotificationRow, NotificationType } from './notifications.types';

export async function listForUser(userId: string): Promise<NotificationRow[]> {
  // Bounded limit - the UI bell only ever shows the top 8, and there is no
  // separate notifications page. 200 is generous headroom for the badge count
  // and any future "View all" screen.
  const result = await query<NotificationRow>(
    `SELECT * FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC, id DESC
     LIMIT 200`,
    [userId]
  );
  return result.rows;
}

/**
 * Marks a single notification read. The `user_id = $2` clause is the IDOR
 * guard: even if a caller guesses someone else's notification id, this
 * affects zero rows. Caller turns rowCount 0 into a 404 (never 403, so
 * existence isn't leaked either).
 */
export async function markRead(id: string, userId: string): Promise<boolean> {
  const result = await query(
    'UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function markAllRead(userId: string): Promise<number> {
  const result = await query(
    'UPDATE notifications SET read = true WHERE user_id = $1 AND read = false',
    [userId]
  );
  return result.rowCount ?? 0;
}

/**
 * Fan-out insert used by the shipments service inside the status-change
 * transaction. Takes the client so it participates in that transaction -
 * if the status change rolls back, the notifications roll back with it.
 *
 * Scope: every `admin` user gets a copy. If shipments later gain an
 * assignee concept, this query is the one place to change.
 */
export async function insertForAdmins(
  client: PoolClient,
  input: {
    title: string;
    message: string;
    type: NotificationType;
    shipmentId: string;
  }
): Promise<void> {
  await client.query(
    `INSERT INTO notifications (user_id, title, message, type, shipment_id)
     SELECT id, $1, $2, $3, $4 FROM users WHERE role = 'admin'`,
    [input.title, input.message, input.type, input.shipmentId]
  );
}