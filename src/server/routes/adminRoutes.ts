import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';

export const adminRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'meraf-cafe-jwt-secret-key-addis-ababa-2026';

function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Staff login required' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string; email: string };
    if (decoded.role !== 'OWNER' && decoded.role !== 'MANAGER') {
      res.status(403).json({ error: 'Forbidden: Owner or Manager role required' });
      return;
    }
    (req as any).user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
}

// REAL DATABASE SALES ANALYTICS
adminRouter.get('/analytics', requireAdminAuth, (req: Request, res: Response): void => {
  const { period } = req.query; // 'today', 'yesterday', '7days', '30days', 'all'
  const allOrders = db.getOrders();

  const now = new Date();
  let startDate = new Date(0);

  if (period === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === 'yesterday') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    now.setHours(0, 0, 0, 0); // end of yesterday
  } else if (period === '7days') {
    startDate = new Date(now.valueOf() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === '30days') {
    startDate = new Date(now.valueOf() - 30 * 24 * 60 * 60 * 1000);
  }

  const filteredOrders = allOrders.filter((o) => {
    const orderTime = new Date(o.createdAt);
    return orderTime >= startDate;
  });

  const validSalesOrders = filteredOrders.filter((o) => o.orderStatus !== 'CANCELLED');
  const totalRevenue = validSalesOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrdersCount = filteredOrders.length;
  const completedCount = filteredOrders.filter((o) => o.orderStatus === 'COMPLETED').length;
  const pendingCount = filteredOrders.filter((o) => ['NEW', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.orderStatus)).length;
  const cancelledCount = filteredOrders.filter((o) => o.orderStatus === 'CANCELLED').length;
  const avgOrderValue = validSalesOrders.length > 0 ? Math.round(totalRevenue / validSalesOrders.length) : 0;

  let cashSales = 0;
  let onlineSales = 0;

  validSalesOrders.forEach((o) => {
    if (o.paymentMethod === 'CASH') cashSales += o.total;
    else onlineSales += o.total;
  });

  // Top products count map
  const productCountMap: Record<string, { nameEn: string; nameAm: string; count: number; totalEtb: number }> = {};

  validSalesOrders.forEach((o) => {
    o.items.forEach((item) => {
      const key = item.productId;
      if (!productCountMap[key]) {
        productCountMap[key] = {
          nameEn: item.productNameEn,
          nameAm: item.productNameAm,
          count: 0,
          totalEtb: 0,
        };
      }
      productCountMap[key].count += item.quantity;
      productCountMap[key].totalEtb += item.totalPrice;
    });
  });

  const topProducts = Object.values(productCountMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Daily / Hourly Sales Trend Data
  const trendMap: Record<string, { label: string; revenue: number; orders: number }> = {};

  if (period === 'today' || period === 'yesterday') {
    // 2-hour slots from 08:00 to 22:00
    const slots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
    slots.forEach((s) => {
      trendMap[s] = { label: s, revenue: 0, orders: 0 };
    });

    validSalesOrders.forEach((o) => {
      const d = new Date(o.createdAt);
      const hour = d.getHours();
      // find closest slot
      let slotKey = '08:00';
      if (hour >= 21) slotKey = '22:00';
      else if (hour >= 19) slotKey = '20:00';
      else if (hour >= 17) slotKey = '18:00';
      else if (hour >= 15) slotKey = '16:00';
      else if (hour >= 13) slotKey = '14:00';
      else if (hour >= 11) slotKey = '12:00';
      else if (hour >= 9) slotKey = '10:00';

      if (trendMap[slotKey]) {
        trendMap[slotKey].revenue += o.total;
        trendMap[slotKey].orders += 1;
      }
    });
  } else {
    // Days group
    validSalesOrders.forEach((o) => {
      const d = new Date(o.createdAt);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!trendMap[label]) {
        trendMap[label] = { label, revenue: 0, orders: 0 };
      }
      trendMap[label].revenue += o.total;
      trendMap[label].orders += 1;
    });
  }

  const dailyTrends = Object.values(trendMap);

  res.json({
    totalRevenue,
    totalOrdersCount,
    completedCount,
    pendingCount,
    cancelledCount,
    avgOrderValue,
    cashSales,
    onlineSales,
    topProducts,
    dailyTrends,
    recentOrders: filteredOrders.slice(0, 10),
  });
});

// SETTINGS MANAGEMENT
adminRouter.get('/settings', requireAdminAuth, (req: Request, res: Response): void => {
  res.json(db.getSettings());
});

adminRouter.put('/settings', requireAdminAuth, (req: Request, res: Response): void => {
  const updated = db.updateSettings(req.body);
  db.addAuditLog((req as any).user.userId, (req as any).user.email, 'UPDATE_SETTINGS', 'Updated cafe business settings');
  res.json(updated);
});

// AUDIT LOGS
adminRouter.get('/audit-logs', requireAdminAuth, (req: Request, res: Response): void => {
  res.json(db.getAuditLogs());
});

// EXPORT FULL POSTGRES / SUPABASE DATABASE SQL SCHEMA
adminRouter.get('/export-sql', requireAdminAuth, (req: Request, res: Response): void => {
  const sql = db.exportPostgresSchemaSql();
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', 'attachment; filename="meraf_cafe_schema.sql"');
  res.send(sql);
});
