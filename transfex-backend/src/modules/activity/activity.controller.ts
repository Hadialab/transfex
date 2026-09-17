import type { Request, Response } from 'express';
import * as activityService from './activity.service';
import type { ListActivityQuery } from './activity.schemas';

export async function list(req: Request, res: Response) {
  const { limit } = req.query as unknown as ListActivityQuery;
  const activities = await activityService.listRecent(limit);
  res.status(200).json({ activities });
}