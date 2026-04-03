import { Request, Response } from 'express';
import { asyncHandler } from '@/shared/middleware/handlers';
import { createContract, getContractById, getFarmerContracts, getConsumerContracts, acceptContract, rejectContract, cancelContract, completeContract } from './contract.service';
import { releaseWageToFarmer, finalSettlement } from '@/modules/escrow/escrow.service';
import { authenticate } from '@/shared/middleware/auth';
import { validate } from '@/shared/middleware/validate';
import { createContractSchema, contractActionSchema } from './contract.schema';
import { BadRequestError, ForbiddenError } from '@/shared/errors';
import { prisma } from '@/config/database';

export const createContractHandler = asyncHandler(async (req: Request, res: Response) => {
  const contract = await createContract(req.user!.userId, req.body);
  res.status(201).json({ success: true, data: contract });
});

export const getContractHandler = asyncHandler(async (req: Request, res: Response) => {
  const contract = await getContractById(req.params.id as string);
  res.json({ success: true, data: contract });
});

export const getFarmerContractsHandler = asyncHandler(async (req: Request, res: Response) => {
  const contracts = await getFarmerContracts(req.user!.userId, req.query.status as string);
  res.json({ success: true, data: contracts });
});

export const getConsumerContractsHandler = asyncHandler(async (req: Request, res: Response) => {
  const contracts = await getConsumerContracts(req.user!.userId, req.query.status as string);
  res.json({ success: true, data: contracts });
});

export const contractActionHandler = asyncHandler(async (req: Request, res: Response) => {
  const { action, amount, description } = req.body;
  const { id } = req.params as { id: string };
  const userId = req.user!.userId;

  // Verify user is a party to the contract before any action
  const contract = await prisma.contract.findUnique({
    where: { id },
    select: { farmer_id: true, consumer_id: true },
  });
  if (!contract) {
    throw new BadRequestError('Contract not found');
  }
  if (contract.farmer_id !== userId && contract.consumer_id !== userId) {
    throw new ForbiddenError('You are not a party to this contract');
  }

  let result;
  switch (action) {
    case 'accept':
      // Only farmer can accept
      if (contract.farmer_id !== userId) {
        throw new ForbiddenError('Only the farmer can accept this contract');
      }
      result = await acceptContract(id, userId);
      break;
    case 'reject':
      // Only farmer can reject
      if (contract.farmer_id !== userId) {
        throw new ForbiddenError('Only the farmer can reject this contract');
      }
      result = await rejectContract(id, userId);
      break;
    case 'cancel':
      result = await cancelContract(id, userId);
      break;
    case 'complete':
      result = await completeContract(id, userId);
      break;
    case 'release_wage':
      // Only farmer can release wages to themselves
      if (contract.farmer_id !== userId) {
        throw new ForbiddenError('Only the farmer can release wages');
      }
      if (!amount || amount <= 0) {
        throw new BadRequestError('Amount is required and must be positive');
      }
      result = await releaseWageToFarmer(id, userId, amount, description);
      break;
    case 'settlement':
      // Only farmer or consumer can settle
      if (contract.farmer_id !== userId && contract.consumer_id !== userId) {
        throw new ForbiddenError('Only contract parties can initiate settlement');
      }
      result = await finalSettlement(id);
      break;
    default:
      throw new BadRequestError(`Invalid action: ${action}`);
  }

  res.json({ success: true, data: result });
});
