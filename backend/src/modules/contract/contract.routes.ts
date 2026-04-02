import { Router } from 'express';
import { authenticate, requireRole } from '@/shared/middleware/auth';
import { validate } from '@/shared/middleware/validate';
import { createContractSchema } from './contract.schema';
import {
  createContractHandler,
  getContractHandler,
  getFarmerContractsHandler,
  getConsumerContractsHandler,
  contractActionHandler,
} from './contract.controller';

export const contractRouter = Router();

contractRouter.get('/farmer', authenticate, getFarmerContractsHandler);
contractRouter.get('/consumer', authenticate, getConsumerContractsHandler);
contractRouter.get('/:id', authenticate, getContractHandler);
contractRouter.post('/', authenticate, requireRole('CONSUMER'), validate(createContractSchema), createContractHandler);
contractRouter.post('/:id/action', authenticate, contractActionHandler);
