import { Router } from 'express';
import { authenticate } from '@/shared/middleware/auth';
import { getWeatherHandler } from './weather.controller';

export const weatherRouter = Router();

weatherRouter.get(
  '/:listingId',
  authenticate,
  getWeatherHandler,
);
