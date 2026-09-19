import { query } from '../../db/pool';
import type { TrackRow } from './track.types';

/**
 * Lookup by order_id OR tracking_number, case-insensitively.
 *
 * `note` is deliberately excluded from the history projection - notes can
 * carry internal-only text ("customer disputed customs fee"). Only status,
 * timestamp, and location are ever exposed publicly.
 *
 * The matching column is compared with `lower(...) = lower($1)` rather than
 * ILIKE so the code must match exactly (a LIKE pattern from user input would
 * let a caller pass '%' and see every shipment - a real vulnerability class).
 */
export async function findByCode(code: string): Promise<TrackRow | null> {
  const result = await query<TrackRow>(
    `SELECT
       s.id,
       s.order_id,
       s.status,
       to_char(s.estimated_delivery, 'YYYY-MM-DD') AS estimated_delivery,
       to_char(s.actual_delivery, 'YYYY-MM-DD') AS actual_delivery,
       COALESCE(
         (
           SELECT json_agg(
             json_build_object(
               'status', sh.status,
               'timestamp', sh.created_at,
               'location', sh.location
             )
             ORDER BY sh.created_at ASC, sh.id ASC
           )
           FROM status_history sh
           WHERE sh.shipment_id = s.id
         ),
         '[]'::json
       ) AS history
     FROM shipments s
     WHERE lower(s.order_id) = lower($1)
        OR lower(coalesce(s.tracking_number, '')) = lower($1)
     LIMIT 1`,
    [code]
  );
  return result.rows[0] ?? null;
}