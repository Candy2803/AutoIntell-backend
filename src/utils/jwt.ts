import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import logger from '#config/logger.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-please-change';
const JWT_EXPIRES_IN = '1d';

export type SignPayload = string | object | Buffer;

export const jwttoken = {
  sign: (payload: SignPayload): string => {
    try {
      return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    } catch (e) {
      logger.error('Failed to sign token', e as Error);
      throw new Error('Failed to authenticate token');
    }
  },
  verify: (token: string): string | JwtPayload => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (e) {
      logger.error('Failed to verify token', e as Error);
      throw new Error('Failed to authenticate token');
    }
  },
};
