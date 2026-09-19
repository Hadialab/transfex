import { z } from 'zod';

/**
 * Loose on purpose. The value is matched against order_id OR tracking_number;
 * we don't want to reject a valid code because a customer typed it with
 * different casing, and we don't want to reveal format expectations to an
 * enumerator. The route 404s on anything that doesn't match a real row.
 */
export const trackParamsSchema = z.object({
  code: z.string().trim().min(1).max(64),
});

export type TrackParams = z.infer<typeof trackParamsSchema>;