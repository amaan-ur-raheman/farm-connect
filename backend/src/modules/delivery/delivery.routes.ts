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
import { prisma } from '@/config/database';

export const deliveryRouter = Router();

deliveryRouter.post('/', authenticate, requireRole('FARMER'), validate(createDeliverySchema), asyncHandler(async (req, res) => {
  const delivery = await createDelivery(req.user!.userId, req.body);
  res.status(201).json({ success: true, data: delivery });
}));

deliveryRouter.get('/', authenticate, asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;
  const [deliveries, total] = await Promise.all([
    getUserDeliveries(req.user!.userId, req.user!.role, skip, limit),
    prisma.delivery.count({
      where: {
        contract: req.user!.role === 'FARMER' ? { farmer_id: req.user!.userId } : { consumer_id: req.user!.userId }
      }
    })
  ]);
  res.json({ success: true, data: deliveries, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
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
