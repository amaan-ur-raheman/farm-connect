import { Request, Response } from 'express';
import { asyncHandler } from '@/shared/middleware/handlers';
import { getWeatherForListing } from './weather.service';

export const getWeatherHandler = asyncHandler(async (req: Request, res: Response) => {
  const listingId = req.params.listingId as string;
  const weather = await getWeatherForListing(listingId);
  res.json({ success: true, data: weather });
});
