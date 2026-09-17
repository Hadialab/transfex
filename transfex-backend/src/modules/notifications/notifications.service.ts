import { ApiError } from '../../utils/ApiError';
import * as repo from './notifications.repository';
import { toPublicNotification, type PublicNotification } from './notifications.types';

export async function list(userId: string): Promise<PublicNotification[]> {
  const rows = await repo.listForUser(userId);
  return rows.map(toPublicNotification);
}

export async function markRead(id: string, userId: string): Promise<void> {
  const ok = await repo.markRead(id, userId);
  if (!ok) throw ApiError.notFound('Notification not found');
}

export async function markAllRead(userId: string): Promise<void> {
  await repo.markAllRead(userId);
}