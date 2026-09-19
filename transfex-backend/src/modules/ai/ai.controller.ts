import type { Request, Response } from 'express';
import * as aiService from './ai.service';

export async function chat(req: Request, res: Response) {
  const { reply } = await aiService.chat(req.user!.sub, req.body);
  res.status(200).json({ reply });
}