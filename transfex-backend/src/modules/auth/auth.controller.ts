import type { Request, Response } from 'express';
import * as authService from './auth.service';
import { setRefreshCookie, clearRefreshCookie, getRefreshCookie } from './auth.cookies';
import { ApiError } from '../../utils/ApiError';

export async function register(req: Request, res: Response) {
  const { user, accessToken, refreshToken } = await authService.register(req.body);
  setRefreshCookie(res, refreshToken);
  res.status(201).json({ user, accessToken });
}

export async function login(req: Request, res: Response) {
  const { user, accessToken, refreshToken } = await authService.login(req.body);
  setRefreshCookie(res, refreshToken);
  res.status(200).json({ user, accessToken });
}

export async function refresh(req: Request, res: Response) {
  const raw = getRefreshCookie(req);
  if (!raw) throw ApiError.unauthorized('Not signed in.');

  const { accessToken, refreshToken } = await authService.refresh(raw);
  setRefreshCookie(res, refreshToken);
  res.status(200).json({ accessToken });
}

export async function logout(req: Request, res: Response) {
  const raw = getRefreshCookie(req);
  await authService.logout(raw);
  clearRefreshCookie(res);
  res.status(204).send();
}

export async function me(req: Request, res: Response) {
  // req.user is attached by requireAuth
  const user = await authService.getById(req.user!.sub);
  res.status(200).json({ user });
}
