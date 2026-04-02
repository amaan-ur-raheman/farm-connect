import { Router } from 'express';
import { authenticate } from '@/shared/middleware/auth';
import { asyncHandler } from '@/shared/middleware/handlers';
import { createReview, getListingReviews } from './review.service';
import { validate } from '@/shared/middleware/validate';
import { createReviewSchema } from './review.schema';

export const reviewRouter = Router();

reviewRouter.post('/', authenticate, validate(createReviewSchema), asyncHandler(async (req, res) => {
  const review = await createReview(req.user!.userId, req.body);
  res.status(201).json({ success: true, data: review });
}));

reviewRouter.get('/listing/:listingId', asyncHandler(async (req, res) => {
  const reviews = await getListingReviews(req.params.listingId as string);
  res.json({ success: true, data: reviews });
}));
