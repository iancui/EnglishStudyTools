import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import { db } from '../db/storage.ts';

export class RbacController {
  static async listUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { res.json({ code: 200, message: 'success', data: await db.getAdminUsers() }); } catch (e) { next(e); }
  }

  static async listRoles(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { res.json({ code: 200, message: 'success', data: await db.getRoles() }); } catch (e) { next(e); }
  }

  static async createRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id, displayName, description } = req.body || {};
      res.json({ code: 200, message: 'success', data: await db.createRole({ id, displayName, description }) });
    } catch (e) { next(e); }
  }

  static async updateRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { displayName, description } = req.body || {};
      res.json({ code: 200, message: 'success', data: await db.updateRole(req.params.id, { displayName, description }) });
    } catch (e) { next(e); }
  }

  static async deleteRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json({ code: 200, message: 'success', data: await db.deleteRole(req.params.id) });
    } catch (e) { next(e); }
  }

  static async listPermissions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { res.json({ code: 200, message: 'success', data: await db.getPermissions() }); } catch (e) { next(e); }
  }

  static async getUserRoles(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { res.json({ code: 200, message: 'success', data: await db.getUserRoles(req.params.userId) }); } catch (e) { next(e); }
  }

  static async setUserRoles(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const roleIds = Array.isArray(req.body?.roleIds) ? req.body.roleIds.map(String) : [];
      if (!roleIds.length) throw new Error('至少需要保留一个角色');
      if (req.params.userId === req.user?.id && !roleIds.includes('SUPER_ADMIN')) {
        throw new Error('不能移除自己的超级管理员角色');
      }
      res.json({ code: 200, message: 'success', data: await db.setUserRoles(req.params.userId, roleIds) });
    } catch (e) { next(e); }
  }

  static async getRolePermissions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { res.json({ code: 200, message: 'success', data: await db.getRolePermissions(req.params.id) }); } catch (e) { next(e); }
  }

  static async setRolePermissions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const permissionIds = Array.isArray(req.body?.permissionIds) ? req.body.permissionIds.map(String) : [];
      res.json({ code: 200, message: 'success', data: await db.setRolePermissions(req.params.id, permissionIds) });
    } catch (e) { next(e); }
  }
}
