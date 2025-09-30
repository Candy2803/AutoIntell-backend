import type { Request, Response, NextFunction } from 'express';
import { jwttoken } from '#utils/jwt.ts';
import { cookies } from '#utils/cookies.ts';
import { getCurrentUser } from '#services/auth.service.ts';
import logger from '#config/logger.ts';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
        [key: string]: any;
      };
    }
  }
}

// JWT Authentication Middleware
export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from cookie or Authorization header
    let token = cookies.get(req, 'token');
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Verify JWT token
    const decoded = jwttoken.verify(token) as any;
    req.user = decoded;
    
    next();
  } catch (error) {
    logger.error('JWT Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

// Firebase Session Authentication Middleware
export const authenticateFirebaseSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Firebase Session Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired session',
    });
  }
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = cookies.get(req, 'token');
    if (token) {
      const decoded = jwttoken.verify(token) as any;
      req.user = decoded;
    }
  } catch (error) {
    // Ignore errors for optional auth
    logger.debug('Optional auth failed:', error);
  }
  next();
};