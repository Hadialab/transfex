import type { Request, Response } from 'express';
import * as trackService from './track.service';

export async function lookup(req: Request, res: Response) {
  const result = await trackService.lookup(req.params.code);
  res.status(200).json(result);
}