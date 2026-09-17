import type { Request, Response } from 'express';
import * as customersService from './customers.service';
import type { ListCustomersQuery } from './customers.schemas';

export async function list(req: Request, res: Response) {
  const result = await customersService.list(req.query as unknown as ListCustomersQuery);
  res.status(200).json(result);
}

export async function getOne(req: Request, res: Response) {
  const customer = await customersService.getById(req.params.id);
  res.status(200).json({ customer });
}

export async function create(req: Request, res: Response) {
  const customer = await customersService.create(req.body);
  res.status(201).json({ customer });
}

export async function update(req: Request, res: Response) {
  const customer = await customersService.update(req.params.id, req.body);
  res.status(200).json({ customer });
}

export async function remove(req: Request, res: Response) {
  await customersService.remove(req.params.id);
  res.status(204).send();
}
