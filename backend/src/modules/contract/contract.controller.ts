import { Request, Response } from 'express';
import { asyncHandler } from '@/shared/middleware/handlers';
import { createContract, getContractById, getFarmerContracts, getConsumerContracts, acceptContract, rejectContract, cancelContract, completeContract } from './contract.service';
import { authenticate } from '@/shared/middleware/auth';
import { validate } from '@/shared/middleware/validate';
import { createContractSchema, contractActionSchema } from './contract.schema';

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
  const { action } = contractActionSchema.parse(req.body);
  const { id } = req.params as { id: string };
  const userId = req.user!.userId;

  let result;
  switch (action) {
    case 'accept': result = await acceptContract(id, userId); break;
    case 'reject': result = await rejectContract(id, userId); break;
    case 'cancel': result = await cancelContract(id, userId); break;
    case 'complete': result = await completeContract(id, userId); break;
  }

  res.json({ success: true, data: result });
});
