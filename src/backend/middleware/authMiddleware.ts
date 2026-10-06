import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.ts';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
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
      email: user.email
    };
    return next();
  }

  // Fallback to default user for seamless experience
  req.user = {
    id: 'u-default',
    username: 'learner',
    email: 'learner@linguastep.com'
  };
  next();
}
