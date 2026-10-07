import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.ts';
import { db } from '../db/storage.ts';
import { UserRole } from '../types/index.ts';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    roles: string[];
    permissions: string[];
  };
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    const user = await AuthService.getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ code: 401, message: '请先登录', data: null });
    }

    const access = await db.getUserAccess(user.id);
    // Legacy ADMIN accounts are treated as SUPER_ADMIN until the RBAC migration is applied.
    const roles = access.roles.length ? access.roles.map(r => r.id) : (user.role === 'ADMIN' ? ['SUPER_ADMIN'] : ['USER']);
    const permissions = access.permissions;

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role || 'USER',
      roles,
      permissions
    };
    next();
  } catch (e) {
    next(e);
  }
}

export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user?.roles.includes('SUPER_ADMIN') || req.user?.permissions.includes(permission)) {
      return next();
    }
    return res.status(403).json({ code: 403, message: '没有执行该操作的权限', data: { permission } });
  };
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Compatibility wrapper. New routes should use requirePermission().
  if (req.user?.roles.includes('SUPER_ADMIN') || req.user?.role === 'ADMIN') return next();
  return res.status(403).json({ code: 403, message: '需要管理员权限', data: null });
}
