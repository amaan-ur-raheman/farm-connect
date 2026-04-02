import { Router } from 'express';
import { authenticate } from '@/shared/middleware/auth';
import { createOrderHandler, depositEscrowHandler, webhookHandler } from './payment.controller';
import { validate } from '@/shared/middleware/validate';
import { depositToEscrowSchema } from './payment.schema';

export const paymentRouter = Router();

paymentRouter.post('/order', authenticate, createOrderHandler);
paymentRouter.post('/escrow/deposit', authenticate, validate(depositToEscrowSchema), depositEscrowHandler);
paymentRouter.post('/webhook', webhookHandler); // no auth — razorpay calls this
