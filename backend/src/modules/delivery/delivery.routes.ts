import { Router } from 'express';
import { authenticate, requireRole } from '@/shared/middleware/auth';
import { asyncHandler } from '@/shared/middleware/handlers';
import { createDelivery, getContractDeliveries, verifyDelivery } from './delivery.service';
import { validate } from '@/shared/middleware/validate';
import { createDeliverySchema } from './delivery.schema';

export const deliveryRouter = Router();

deliveryRouter.post('/', authenticate, requireRole('FARMER'), validate(createDeliverySchema), asyncHandler(async (req, res) => {
  const delivery = await createDelivery(req.user!.userId, req.body);
  res.status(201).json({ success: true, data: delivery });
}));

deliveryRouter.get('/contract/:contractId', authenticate, asyncHandler(async (req, res) => {
  const deliveries = await getContractDeliveries(req.params.contractId as string);
  res.json({ success: true, data: deliveries });
}));

deliveryRouter.patch('/:id/verify', authenticate, asyncHandler(async (req, res) => {
  const delivery = await verifyDelivery(req.params.id as string, req.user!.userId, 'VERIFIED');
  res.json({ success: true, data: delivery });
}));
