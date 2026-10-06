import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import { AuthService } from '../services/authService.ts';

export class AuthController {
  static register(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { username, email, password } = req.body;
      const result = AuthService.register(username, email, password);
      res.json({
        code: 200,
        message: 'success',
        data: result
      });
    } catch (e) {
      next(e);
    }
  }

  static login(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { identifier, username, email, password } = req.body;
      const idOrEmail = identifier || username || email;
      const result = AuthService.login(idOrEmail, password);
      res.json({
        code: 200,
        message: 'success',
        data: result
      });
    } catch (e) {
      next(e);
    }
  }

  static getCurrentUser(req: AuthenticatedRequest, res: Response) {
    res.json({
      code: 200,
      message: 'success',
      data: req.user
    });
  }
}
