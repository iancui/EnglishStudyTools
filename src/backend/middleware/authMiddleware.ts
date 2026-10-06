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

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : (authHeader || '');

  const user = AuthService.getUserFromToken(token);
  if (user) {
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role || 'USER'
    };
    return next();
  }

  // Fallback to default user for seamless experience
  req.user = {
    id: 'u-default',
    username: 'learner',
    email: 'learner@linguastep.com',
    role: 'USER'
  };
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({
      code: 403,
      message: '无权操作：需要管理员权限',
      data: null
    });
  }
  next();
}
