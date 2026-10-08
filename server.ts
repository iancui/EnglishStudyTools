import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { apiRouter } from './src/backend/routes/index.ts';
import { errorHandler } from './src/backend/middleware/errorHandler.ts';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Excel 导入会把解析后的行数据以 JSON 发送到后端，默认 100KB 太小。\n  // 提高请求体上限，同时仍保持一个合理上限，避免无限制的大请求。\n  app.use(express.json({
    limit: '20mb',
    verify: (req, _res, buf) => {
      if (req.path === '/auth/login' || req.path === '/auth/register') {
        console.log('[http:json]', {
          path: req.path,
          contentType: req.headers['content-type'],
          contentLength: req.headers['content-length'] || null,
          receivedBytes: buf.length
        });
      }
    }
  }));

  // Mount backend API routes
  app.use('/api', apiRouter);

  // Mount error handler for API
  app.use('/api', errorHandler);

  if (!isProd) {
    // In development mode, mount Vite middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve built dist files
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 LinguaStep Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
