import { prisma } from '@/config/database';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/shared/errors';
import { io } from '@/server';
import type { CreateContractInput } from './contract.schema';

export const createContract = async (consumerId: string, input: CreateContractInput) => {
  const listing = await prisma.farmListing.findUnique({ where: { id: input.listing_id } });
  if (!listing) throw new NotFoundError('Listing');
  if (listing.status !== 'ACTIVE') throw new BadRequestError('Listing is not available');
  if (listing.farmer_id === consumerId) throw new BadRequestError('Cannot contract your own listing');

  const total = input.acreage * input.price_per_acre;
  const startDate = new Date(input.start_date);
  const endDate = new Date(input.end_date);

  if (endDate <= startDate) throw new BadRequestError('End date must be after start date');

  const contract = await prisma.contract.create({
    data: {
      listing_id: listing.id,
      farmer_id: listing.farmer_id,
      consumer_id: consumerId,
      crop: input.crop,
      acreage: input.acreage,
      price_per_acre: input.price_per_acre,
      total_amount: total,
      start_date: startDate,
      end_date: endDate,
      status: 'PENDING',
    },
  });

  io.to(listing.farmer_id).emit('contract_update', { type: 'new_contract', id: contract.id });
  return contract;
};

export const getContractById = async (contractId: string) => {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      listing: { include: { farmer: { select: { id: true, name: true, avatar_url: true, phone: true } } } },
      farmer: { select: { id: true, name: true, phone: true, avatar_url: true } },
      consumer: { select: { id: true, name: true, phone: true, avatar_url: true } },
    },
  });
  if (!contract) throw new NotFoundError('Contract');
  return contract;
};

export const getFarmerContracts = async (farmerId: string, status?: string) => {
  return prisma.contract.findMany({
    where: { farmer_id: farmerId, ...(status ? { status: status as 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED' } : {}) },
    include: {
      listing: { select: { id: true, name: true, images: true } },
      consumer: { select: { id: true, name: true, avatar_url: true } },
    },
    orderBy: { created_at: 'desc' },
  });
};

export const getConsumerContracts = async (consumerId: string, status?: string) => {
  return prisma.contract.findMany({
    where: { consumer_id: consumerId, ...(status ? { status: status as 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED' } : {}) },
    include: {
      listing: { select: { id: true, name: true, images: true } },
      farmer: { select: { id: true, name: true, avatar_url: true } },
    },
    orderBy: { created_at: 'desc' },
  });
};

export const acceptContract = async (contractId: string, farmerId: string) => {
  const contract = await prisma.contract.findUnique({ where: { id: contractId } });
  if (!contract) throw new NotFoundError('Contract');
  if (contract.farmer_id !== farmerId) throw new ForbiddenError('Not your contract');
  if (contract.status !== 'PENDING') throw new BadRequestError('Contract is not pending');

  const updated = await prisma.contract.update({
    where: { id: contractId },
    data: { status: 'ACTIVE' },
  });

  io.to(contract.consumer_id).emit('contract_update', { type: 'accepted', id: contractId });
  return updated;
};

export const rejectContract = async (contractId: string, farmerId: string) => {
  const contract = await prisma.contract.findUnique({ where: { id: contractId } });
  if (!contract) throw new NotFoundError('Contract');
  if (contract.farmer_id !== farmerId) throw new ForbiddenError('Not your contract');
  if (contract.status !== 'PENDING') throw new BadRequestError('Contract is not pending');

  const updated = await prisma.contract.update({
    where: { id: contractId },
    data: { status: 'CANCELLED' },
  });

  io.to(contract.consumer_id).emit('contract_update', { type: 'rejected', id: contractId });
  return updated;
};

export const cancelContract = async (contractId: string, userId: string) => {
  const contract = await prisma.contract.findUnique({ where: { id: contractId } });
  if (!contract) throw new NotFoundError('Contract');
  if (contract.farmer_id !== userId && contract.consumer_id !== userId) {
    throw new ForbiddenError('Not your contract');
  }
  if (!['PENDING', 'ACTIVE'].includes(contract.status)) {
    throw new BadRequestError('Contract cannot be cancelled');
  }

  if (contract.status === 'ACTIVE' && contract.escrow_held > 0) {
    throw new BadRequestError('Cancel active contracts through dispute resolution');
  }

  const updated = await prisma.contract.update({
    where: { id: contractId },
    data: { status: 'CANCELLED' },
  });

  const otherUser = contract.farmer_id === userId ? contract.consumer_id : contract.farmer_id;
  io.to(otherUser).emit('contract_update', { type: 'cancelled', id: contractId });
  return updated;
};

export const completeContract = async (contractId: string, farmerId: string) => {
  const contract = await prisma.contract.findUnique({ where: { id: contractId } });
  if (!contract) throw new NotFoundError('Contract');
  if (contract.farmer_id !== farmerId) throw new ForbiddenError('Not your contract');
  if (contract.status !== 'ACTIVE') throw new BadRequestError('Contract is not active');

  const updated = await prisma.contract.update({
    where: { id: contractId },
    data: { status: 'COMPLETED' },
  });

  io.to(contract.consumer_id).emit('contract_update', { type: 'completed', id: contractId });
  return updated;
};
