import { prisma } from '@/config/database';
import { NotFoundError, ForbiddenError } from '@/shared/errors';
import { scheduleEscrowRelease } from '../escrow/escrow.service';

export const createFarmUpdate = async (farmerId: string, contractId: string, caption?: string, mediaUrl?: string, mediaType?: string, latitude?: number, longitude?: number) => {
  const contract = await prisma.contract.findUnique({ where: { id: contractId } });
  if (!contract) throw new NotFoundError('Contract');
  if (contract.farmer_id !== farmerId) throw new ForbiddenError('Not your contract');

  // Count existing updates to determine current cycle number
  const updateCount = await prisma.farmUpdate.count({
    where: { contract_id: contractId },
  });

  // Calculate release amount (simplified logic until total_cycles is explicitly added to schema)
  const releaseAmount = contract.total_amount;

  // Schedule release in 48 hours (in ms)
  const DELAY_48_HOURS = 48 * 60 * 60 * 1000;
  const update = await prisma.farmUpdate.create({
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

  await scheduleEscrowRelease(contractId, farmerId, update.id, releaseAmount, DELAY_48_HOURS);

  return update;
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
