import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.ts';
import { UserRole } from '../types/index.ts';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    role: UserRole;
  };
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  const user = await AuthService.getUserFromToken(token);
  if (!user) {
    return res.status(401).json({ code: 401, message: '请先登录', data: null });
  }
  req.user = { id: user.id, username: user.username, email: user.email, role: user.role || 'USER' };
  next();
}

