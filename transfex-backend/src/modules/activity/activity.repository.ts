import { query } from '../../db/pool';
import type { ActivityRow } from './activity.types';

/**
 * Activity is derived from `status_history` joined to `shipments` - it is
 * not a separate table. A second copy of the same event stream would drift
 * from the source of truth.
 *
 * `rn` is the row number per shipment in chronological order. rn = 1 means
 * "this is the shipment's first status event," which the service maps to
 * 'new_order'.
 */
export async function listRecent(limit: number): Promise<ActivityRow[]> {
  const result = await query<ActivityRow>(
    `SELECT
       sh.id,
       sh.status,
       sh.created_at AS timestamp,
       sh.note,
       sh.location,
       s.id   AS shipment_id,
       s.order_id,
       s.customer_name,
       ROW_NUMBER() OVER (
         PARTITION BY sh.shipment_id
         ORDER BY sh.created_at ASC, sh.id ASC
       )::text AS rn
     FROM status_history sh
     JOIN shipments s ON s.id = sh.shipment_id
     ORDER BY sh.created_at DESC, sh.id DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}