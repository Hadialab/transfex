import type { Request, Response } from 'express';
import * as shipmentsService from './shipments.service';
import type { ListShipmentsQuery } from './shipments.schemas';

export async function list(req: Request, res: Response) {
  const result = await shipmentsService.list(
    req.query as unknown as ListShipmentsQuery
  );
  res.status(200).json(result);
}

export async function getOne(req: Request, res: Response) {
  const shipment = await shipmentsService.getById(req.params.id);
  res.status(200).json({ shipment });
}

export async function create(req: Request, res: Response) {
  const shipment = await shipmentsService.create(req.body);
  res.status(201).json({ shipment });
}

export async function update(req: Request, res: Response) {
  const shipment = await shipmentsService.update(req.params.id, req.body);
  res.status(200).json({ shipment });
}

export async function updateStatus(req: Request, res: Response) {
  const shipment = await shipmentsService.updateStatus(req.params.id, req.body);
  res.status(200).json({ shipment });
}

export async function addNote(req: Request, res: Response) {
  // req.user is guaranteed by requireAuth; the non-null assertion is safe.
  const shipment = await shipmentsService.addNote(
    req.params.id,
    req.body.text,
    req.user!.sub
  );
  res.status(201).json({ shipment });
}

export async function remove(req: Request, res: Response) {
  await shipmentsService.remove(req.params.id);
  res.status(204).send();
}