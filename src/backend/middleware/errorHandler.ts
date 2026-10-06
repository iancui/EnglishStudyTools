import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('API Error:', err);
  const status = err.status || 400;
  res.status(status).json({
    code: status,
    message: err.message || '服务器内部错误',
    data: null
  });
}
