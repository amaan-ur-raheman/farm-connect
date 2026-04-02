import { prisma } from '@/config/database';
import { NotFoundError, ConflictError } from '@/shared/errors';
import type { CreateReviewInput } from './review.schema';

export const createReview = async (reviewerId: string, input: CreateReviewInput) => {
  const contract = await prisma.contract.findUnique({ where: { id: input.contract_id } });
  if (!contract) throw new NotFoundError('Contract');
  if (!['COMPLETED'].includes(contract.status)) throw new NotFoundError('Can only review completed contracts');

  const existing = await prisma.review.findUnique({
    where: { contract_id_reviewer_id: { contract_id: input.contract_id, reviewer_id: reviewerId } },
  });
  if (existing) throw new ConflictError('Already reviewed');

  return prisma.review.create({ data: { ...input, reviewer_id: reviewerId } });
};

export const getListingReviews = async (listingId: string) => {
  const contracts = await prisma.contract.findMany({ where: { listing_id: listingId, status: 'COMPLETED' } });
  const contractIds = contracts.map((c) => c.id);

  return prisma.review.findMany({
    where: { contract_id: { in: contractIds } },
    include: { reviewer: { select: { id: true, name: true, avatar_url: true } } },
    orderBy: { created_at: 'desc' },
  });
};
