import { ApiError } from '../../utils/ApiError';
import * as repo from './track.repository';
import type { PublicTracking } from './track.types';

export async function lookup(code: string): Promise<PublicTracking> {
  const row = await repo.findByCode(code);

  // 404 for "no match" - never 400. A 400 would tell an enumerator "that
  // format was wrong, keep trying"; a 404 is what a real customer gets when
  // they typo their order ID, and it's the correct response for a probe too.
  if (!row) throw ApiError.notFound('Order not found');

  return {
    orderId: row.order_id,
    status: row.status,
    estimatedDelivery: row.estimated_delivery,
    actualDelivery: row.actual_delivery ?? undefined,
    statusHistory: row.history,
  };
}