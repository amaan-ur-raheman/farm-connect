import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/shared/errors';

export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(404, 'Route not found'));
};
