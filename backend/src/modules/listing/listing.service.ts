import { prisma } from '@/config/database';
import { NotFoundError, ForbiddenError } from '@/shared/errors';
import type { CreateListingInput, UpdateListingInput, ListingFiltersInput } from './listing.schema';
import { cloudinary } from '@/config/cloudinary';
import streamifier from 'streamifier';

const EARTH_RADIUS_KM = 6371;

const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
};

export const createListing = async (farmerId: string, input: CreateListingInput) => {
  return prisma.farmListing.create({
    data: {
      ...input,
      farmer_id: farmerId,
      images: input.images ?? [],
    },
  });
};

export const getListingById = async (listingId: string) => {
  const listing = await prisma.farmListing.findUnique({
    where: { id: listingId },
    include: {
      farmer: {
        select: {
          id: true,
          name: true,
          phone: true,
          avatar_url: true,
          kyc_status: true,
          city: true,
          state: true,
        },
      },
      _count: {
        select: { contracts: true },
      },
    },
  });

  if (!listing) throw new NotFoundError('Listing');

  await prisma.farmListing.update({
    where: { id: listingId },
    data: { views: { increment: 1 } },
  });

  return listing;
};

export const getListings = async (filters: ListingFiltersInput) => {
  const { page, limit, lat, lng, radius, crops, is_organic, min_acres, max_acres, min_price, max_price, status, search } = filters;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  else where.status = 'ACTIVE';
  if (is_organic !== undefined) where.is_organic = is_organic;
  if (min_acres !== undefined || max_acres !== undefined) {
    where.area_acres = {};
    if (min_acres !== undefined) (where.area_acres as Record<string, number>).gte = min_acres;
    if (max_acres !== undefined) (where.area_acres as Record<string, number>).lte = max_acres;
  }
  if (min_price !== undefined || max_price !== undefined) {
    where.price_per_acre = {};
    if (min_price !== undefined) (where.price_per_acre as Record<string, number>).gte = min_price;
    if (max_price !== undefined) (where.price_per_acre as Record<string, number>).lte = max_price;
  }
  if (crops) {
    where.crops = { hasSome: crops.split(',').map((c) => c.trim()) };
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { location_name: { contains: search, mode: 'insensitive' } },
    ];
  }

  const listings = await prisma.farmListing.findMany({
    where,
    include: {
      farmer: {
        select: { id: true, name: true, avatar_url: true, kyc_status: true },
      },
      _count: { select: { contracts: true } },
    },
    orderBy: { created_at: 'desc' },
    skip,
    take: limit,
  });

  const total = await prisma.farmListing.count({ where });

  let enrichedListings: (typeof listings[number] & { distance: number | null })[] = listings.map((l) => ({ ...l, distance: null }));

  if (lat !== undefined && lng !== undefined && radius !== undefined) {
    enrichedListings = listings
      .map((l) => ({
        ...l,
        distance: Math.round(haversineDistance(lat, lng, l.latitude, l.longitude)),
      }))
      .filter((l) => l.distance !== null && l.distance <= radius);
    enrichedListings.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  }

  return {
    data: enrichedListings,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

export const updateListing = async (listingId: string, farmerId: string, input: UpdateListingInput) => {
  const listing = await prisma.farmListing.findUnique({ where: { id: listingId } });
  if (!listing) throw new NotFoundError('Listing');
  if (listing.farmer_id !== farmerId) throw new ForbiddenError('Not your listing');

  return prisma.farmListing.update({ where: { id: listingId }, data: input });
};

export const deleteListing = async (listingId: string, farmerId: string) => {
  const listing = await prisma.farmListing.findUnique({ where: { id: listingId } });
  if (!listing) throw new NotFoundError('Listing');
  if (listing.farmer_id !== farmerId) throw new ForbiddenError('Not your listing');

  await prisma.farmListing.delete({ where: { id: listingId } });
};

export const getFarmerListings = async (farmerId: string) => {
  return prisma.farmListing.findMany({
    where: { farmer_id: farmerId },
    orderBy: { created_at: 'desc' },
  });
};

export const getListingRating = async (listingId: string) => {
  const contracts = await prisma.contract.findMany({
    where: { listing_id: listingId, status: 'COMPLETED' },
    select: { id: true },
  });

  if (contracts.length === 0) {
    return { averageRating: 0, totalReviews: 0 };
  }

  const contractIds = contracts.map((c) => c.id);
  const reviews = await prisma.review.findMany({
    where: { contract_id: { in: contractIds } },
    select: { rating: true },
  });

  if (reviews.length === 0) {
    return { averageRating: 0, totalReviews: 0 };
  }

  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = Math.round((totalRating / reviews.length) * 10) / 10;

  return { averageRating, totalReviews: reviews.length };
};

export const uploadListingImage = async (listingId: string, farmerId: string, file: Express.Multer.File): Promise<string> => {
  const listing = await prisma.farmListing.findUnique({ where: { id: listingId } });
  if (!listing) throw new NotFoundError('Listing');
  if (listing.farmer_id !== farmerId) throw new ForbiddenError('Not your listing');

  const imageUrl = await new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `farmconnect/listings/${listingId}` },
      (err, result) => {
        if (err) reject(err);
        else resolve(result!.secure_url);
      }
    );
    streamifier.createReadStream(file.buffer).pipe(stream);
  });

  await prisma.farmListing.update({
    where: { id: listingId },
    data: { images: { push: imageUrl } },
  });

  return imageUrl;
};
