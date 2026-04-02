import { prisma } from '@/config/database';
import { NotFoundError, ForbiddenError } from '@/shared/errors';
import { createNotification } from '@/modules/notification/notification.service';
import type { CreateDeliveryInput } from './delivery.schema';
import { DeliveryStatus } from '@/generated';

export const createDelivery = async (farmerId: string, input: CreateDeliveryInput) => {
  const contract = await prisma.contract.findUnique({ 
    where: { id: input.contract_id },
    include: { consumer: true }
  });
  if (!contract) throw new NotFoundError('Contract');
  if (contract.farmer_id !== farmerId) throw new ForbiddenError('Not your contract');
  if (contract.status !== 'ACTIVE') throw new ForbiddenError('Contract not active');

  const delivery = await prisma.delivery.create({ 
    data: { 
      ...input, 
      delivery_date: input.delivery_date ? new Date(input.delivery_date) : undefined 
    } 
  });

  await createNotification(
    contract.consumer_id,
    'DELIVERY_CREATED',
    'New Delivery Created',
    `A new delivery (Batch #${delivery.batch_number}) has been reported for your contract.`,
    { contract_id: contract.id, delivery_id: delivery.id }
  );

  return delivery;
};

export const updateDeliveryStatus = async (deliveryId: string, farmerId: string, status: DeliveryStatus) => {
  const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
  if (!delivery) throw new NotFoundError('Delivery');

  const contract = await prisma.contract.findUnique({ where: { id: delivery.contract_id } });
  if (!contract) throw new NotFoundError('Contract');
  if (contract.farmer_id !== farmerId) throw new ForbiddenError('Not your delivery');

  const updated = await prisma.delivery.update({
    where: { id: deliveryId },
    data: { status }
  });

  await createNotification(
    contract.consumer_id,
    'GENERAL',
    'Delivery Updated',
    `Delivery Batch #${delivery.batch_number} status updated to ${status}.`,
    { contract_id: contract.id, delivery_id: deliveryId }
  );

  return updated;
};

export const getContractDeliveries = async (contractId: string) => {
  return prisma.delivery.findMany({ 
    where: { contract_id: contractId }, 
    orderBy: { created_at: 'desc' } 
  });
};

export const getUserDeliveries = async (userId: string, role: string) => {
  return prisma.delivery.findMany({
    where: {
      contract: role === 'FARMER' ? { farmer_id: userId } : { consumer_id: userId }
    },
    orderBy: { created_at: 'desc' },
    include: {
      contract: {
        include: {
          listing: { select: { name: true } },
          farmer: { select: { name: true } },
          consumer: { select: { name: true } }
        }
      }
    }
  });
};

export const verifyDelivery = async (deliveryId: string, consumerId: string, status: 'VERIFIED' | 'REJECTED') => {
  const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
  if (!delivery) throw new NotFoundError('Delivery');
  
  const contract = await prisma.contract.findUnique({ where: { id: delivery.contract_id } });
  if (!contract) throw new NotFoundError('Contract');
  if (contract.consumer_id !== consumerId) throw new ForbiddenError('Not your contract');

  const updated = await prisma.delivery.update({ where: { id: deliveryId }, data: { status } });

  await createNotification(
    contract.farmer_id,
    'DELIVERY_VERIFIED',
    `Delivery ${status === 'VERIFIED' ? 'Verified' : 'Rejected'}`,
    `Consumer has ${status === 'VERIFIED' ? 'verified' : 'rejected'} delivery Batch #${delivery.batch_number}.`,
    { contract_id: contract.id, delivery_id: deliveryId }
  );

  return updated;
};
