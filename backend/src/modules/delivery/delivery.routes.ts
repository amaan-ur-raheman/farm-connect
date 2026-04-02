import { Router } from 'express';
import { authenticate, requireRole } from '@/shared/middleware/auth';
import { asyncHandler } from '@/shared/middleware/handlers';
import { 
  createDelivery, 
  getContractDeliveries, 
  verifyDelivery, 
  getUserDeliveries,
  updateDeliveryStatus 
} from './delivery.service';
import { validate } from '@/shared/middleware/validate';
import { createDeliverySchema, updateDeliveryStatusSchema, verifyDeliverySchema } from './delivery.schema';

export const deliveryRouter = Router();

deliveryRouter.post('/', authenticate, requireRole('FARMER'), validate(createDeliverySchema), asyncHandler(async (req, res) => {
  const delivery = await createDelivery(req.user!.userId, req.body);
  res.status(201).json({ success: true, data: delivery });
}));

deliveryRouter.get('/', authenticate, asyncHandler(async (req, res) => {
  const deliveries = await getUserDeliveries(req.user!.userId, req.user!.role);
  res.json({ success: true, data: deliveries });
}));

deliveryRouter.get('/contract/:contractId', authenticate, asyncHandler(async (req, res) => {
  const deliveries = await getContractDeliveries(req.params.contractId as string);
  res.json({ success: true, data: deliveries });
}));

deliveryRouter.patch('/:id/status', authenticate, requireRole('FARMER'), validate(updateDeliveryStatusSchema), asyncHandler(async (req, res) => {
  const delivery = await updateDeliveryStatus(req.params.id as string, req.user!.userId, req.body.status);
  res.json({ success: true, data: delivery });
}));

deliveryRouter.patch('/:id/verify', authenticate, requireRole('CONSUMER'), validate(verifyDeliverySchema), asyncHandler(async (req, res) => {
  const delivery = await verifyDelivery(req.params.id as string, req.user!.userId, req.body.status);
  res.json({ success: true, data: delivery });
}));
