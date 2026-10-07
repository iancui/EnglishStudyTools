import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import { AuthService, CaptchaService } from '../services/authService.ts';

export class AuthController {
  static async register(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { username, email, password, captchaId, captchaCode } = req.body;
      const result = await AuthService.register(username, email, password, captchaId, captchaCode);
      res.json({
        code: 200,
        message: 'success',
        data: result
      });
    } catch (e) {
      next(e);
    }
  }

  static async login(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const username = String(req.body?.username ?? req.body?.identifier ?? '').trim();
      const { password, captchaId, captchaCode } = req.body || {};
      const result = await AuthService.login(username, password, captchaId, captchaCode);
      res.json({
        code: 200,
        message: 'success',
        data: result
      });
    } catch (e) {
      next(e);
    }
  }

  static async captcha(_req: AuthenticatedRequest, res: Response) { res.json({ code: 200, message: 'success', data: CaptchaService.create() }); }

  static async getCurrentUser(req: AuthenticatedRequest, res: Response) {
    res.json({
      code: 200,
      message: 'success',
      data: req.user
    });
  }
}
