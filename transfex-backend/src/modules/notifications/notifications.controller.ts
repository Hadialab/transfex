import type { Request, Response } from 'express';
import * as notificationsService from './notifications.service';

export async function list(req: Request, res: Response) {
  const notifications = await notificationsService.list(req.user!.sub);
  res.status(200).json({ notifications });
}

export async function markRead(req: Request, res: Response) {
  await notificationsService.markRead(req.params.id, req.user!.sub);
  res.status(204).send();
}

export async function markAllRead(req: Request, res: Response) {
  await notificationsService.markAllRead(req.user!.sub);
  res.status(204).send();
}