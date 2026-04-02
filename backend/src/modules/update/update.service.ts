import { prisma } from '@/config/database';
import { NotFoundError, ForbiddenError } from '@/shared/errors';

export const createFarmUpdate = async (farmerId: string, contractId: string, caption?: string, mediaUrl?: string, mediaType?: string, latitude?: number, longitude?: number) => {
  const contract = await prisma.contract.findUnique({ where: { id: contractId } });
  if (!contract) throw new NotFoundError('Contract');
  if (contract.farmer_id !== farmerId) throw new ForbiddenError('Not your contract');

  return prisma.farmUpdate.create({
    data: {
      contract_id: contractId,
      farmer_id: farmerId,
      media_url: mediaUrl ?? '',
      media_type: mediaType ?? 'image',
      caption,
      latitude,
      longitude,
    },
  });
};

export const getContractUpdates = async (contractId: string) => {
  return prisma.farmUpdate.findMany({
    where: { contract_id: contractId },
    include: {
      farmer: { select: { id: true, name: true, avatar_url: true } },
    },
    orderBy: { created_at: 'desc' },
  });
};
