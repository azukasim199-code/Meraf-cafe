import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { authRouter } from './src/server/routes/authRoutes';
import { menuRouter } from './src/server/routes/menuRoutes';
import { tableRouter } from './src/server/routes/tableRoutes';
import { orderRouter } from './src/server/routes/orderRoutes';
import { paymentRouter } from './src/server/routes/paymentRoutes';
import { adminRouter } from './src/server/routes/adminRoutes';
import { realtime } from './src/server/realtime';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // HEALTH CHECK
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'MERAF CAFE QR Ordering Backend',
      time: new Date().toISOString(),
    });
  });

  // REALTIME SSE STREAM ENDPOINT
  app.get('/api/realtime/sse', (req: Request, res: Response) => {
    const role = (req.query.role as 'staff' | 'customer') || 'customer';
    const trackingToken = req.query.trackingToken as string | undefined;
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    realtime.addClient(clientId, res, role, trackingToken);
  });

  // API ROUTERS
  app.use('/api/auth', authRouter);
  app.use('/api/menu', menuRouter);
  app.use('/api/tables', tableRouter);
  app.use('/api/orders', orderRouter);
  app.use('/api/payments', paymentRouter);
  app.use('/api/admin', adminRouter);

  // VITE DEV MIDDLEWARE vs PRODUCTION STATIC SERVING
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    (fs.existsSync(path.join(process.cwd(), 'dist', 'index.html')) &&
      !process.env.VITE_DEV);

  if (!isProduction) {
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('[Server] Vite middleware active for development mode');
    } catch (e) {
      console.error('[Server] Vite middleware error, falling back to static:', e);
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[Server] Production mode: Serving compiled client bundle from dist');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`☕ MERAF CAFE - QR Ordering & Cafe Management Server`);
    console.log(`🌐 Running on http://0.0.0.0:${PORT}`);
    console.log(`📍 Timezone: Africa/Addis_Ababa`);
    console.log(`=======================================================`);
  });
}

startServer().catch((err) => {
  console.error('[Server Initialization Error]:', err);
});
