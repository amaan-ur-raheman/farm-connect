import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { JwtPayload } from '@/shared/middleware/auth';

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.accessExpiry as jwt.SignOptions['expiresIn'],
  });
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiry as jwt.SignOptions['expiresIn'],
  });
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.jwt.refreshSecret) as JwtPayload;
};
