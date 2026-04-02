import { Request, Response } from 'express';
import { asyncHandler } from '@/shared/middleware/handlers';
import { createListing, getListingById, getListings, updateListing, deleteListing, getFarmerListings, uploadListingImage } from './listing.service';
import { listingFiltersSchema } from './listing.schema';
import { BadRequestError } from '@/shared/errors';

export const createListingHandler = asyncHandler(async (req: Request, res: Response) => {
  const listing = await createListing(req.user!.userId, req.body);
  res.status(201).json({ success: true, data: listing });
});

export const getListingHandler = asyncHandler(async (req: Request, res: Response) => {
  const listing = await getListingById(req.params.id as string);
  res.json({ success: true, data: listing });
});

export const getListingsHandler = asyncHandler(async (req: Request, res: Response) => {
  const filters = listingFiltersSchema.parse(req.query);
  const result = await getListings(filters);
  res.json({ success: true, ...result });
});

export const updateListingHandler = asyncHandler(async (req: Request, res: Response) => {
  const listing = await updateListing(req.params.id as string, req.user!.userId, req.body);
  res.json({ success: true, data: listing });
});

export const deleteListingHandler = asyncHandler(async (req: Request, res: Response) => {
  await deleteListing(req.params.id as string, req.user!.userId);
  res.json({ success: true, data: { message: 'Listing deleted' } });
});

export const getFarmerListingsHandler = asyncHandler(async (req: Request, res: Response) => {
  const listings = await getFarmerListings(req.user!.userId);
  res.json({ success: true, data: listings });
});

export const uploadListingImageHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new BadRequestError('No image file provided');
  const imageUrl = await uploadListingImage(req.params.id as string, req.user!.userId, req.file);
  res.json({ success: true, data: { image_url: imageUrl } });
});
