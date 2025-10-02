// import { Request, Response, NextFunction } from 'express';
// import { auth } from '#src/firebase/firebase-admin.ts';
//
// declare global {
//   namespace Express {
//     interface Request {
//       user?: {
//         uid: string;
//         email?: string;
//         role?: string;
//       };
//     }
//   }
// }
//
// export const authenticateToken = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const authHeader = req.headers.authorization;
//
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       res.status(401).json({
//         error: 'Access denied. No token provided or invalid format.',
//       });
//       return;
//     }
//
//     const token = authHeader.substring(7);
//
//     const decodedToken = await auth.verifyIdToken(token);
//
//     req.user = {
//       uid: decodedToken.uid,
//       email: decodedToken.email,
//       role: decodedToken.role || 'user',
//     };
//
//     next();
//   } catch (error) {
//     console.error('Auth middleware error:', error);
//     res.status(401).json({
//       error: 'Invalid or expired token',
//     });
//   }
// };
//
// //check if user has admin role
// export const requireAdmin = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): void => {
//   if (req.user?.role !== 'admin') {
//     res.status(403).json({
//       error: 'Access denied. Admin privileges required.',
//     });
//     return;
//   }
//   next();
// };
