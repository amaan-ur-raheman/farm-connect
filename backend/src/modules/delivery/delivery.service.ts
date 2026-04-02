import { prisma } from '@/config/database';
import { NotFoundError, ForbiddenError } from '@/shared/errors';
import type { CreateDeliveryInput } from './delivery.schema';

export const createDelivery = async (farmerId: string, input: CreateDeliveryInput) => {
  const contract = await prisma.contract.findUnique({ where: { id: input.contract_id } });
  if (!contract) throw new NotFoundError('Contract');
  if (contract.farmer_id !== farmerId) throw new ForbiddenError('Not your contract');
  if (contract.status !== 'ACTIVE') throw new ForbiddenError('Contract not active');

  return prisma.delivery.create({ data: { ...input, delivery_date: input.delivery_date ? new Date(input.delivery_date) : undefined } });
};

export const getContractDeliveries = async (contractId: string) => {
  return prisma.delivery.findMany({ where: { contract_id: contractId }, orderBy: { created_at: 'desc' } });
};

export const verifyDelivery = async (deliveryId: string, consumerId: string, status: 'VERIFIED') => {
  const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
  if (!delivery) throw new NotFoundError('Delivery');
  
  const contract = await prisma.contract.findUnique({ where: { id: delivery.contract_id } });
  if (!contract) throw new NotFoundError('Contract');
  if (contract.consumer_id !== consumerId) throw new ForbiddenError('Not your contract');

  return prisma.delivery.update({ where: { id: deliveryId }, data: { status } });
};
