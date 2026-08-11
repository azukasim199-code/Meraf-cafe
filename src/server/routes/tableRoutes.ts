import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import { db } from '../db';
import { realtime } from '../realtime';

export const tableRouter = Router();
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
    res.status(401).json({ error: 'Invalid token' });
  }
}

// PUBLIC TABLE VALIDATION FOR CUSTOMER QR SCAN
tableRouter.get('/validate/:token', (req: Request, res: Response): void => {
  const { token } = req.params;
  const table = db.getTableByToken(token);

  if (!table) {
    res.status(404).json({ isValid: false, error: 'Table code not found' });
    return;
  }

  if (!table.isActive) {
    res.status(403).json({
      isValid: false,
      error: 'This table is currently disabled and cannot accept new orders.',
      tableNumber: table.tableNumber,
    });
    return;
  }

  res.json({
    isValid: true,
    table: {
      id: table.id,
      tableNumber: table.tableNumber,
      token: table.token,
    },
  });
});

// PUBLIC CUSTOMER CALL WAITER ENDPOINT
tableRouter.post('/call-waiter', (req: Request, res: Response): void => {
  const { tableNumber, tableToken, reason } = req.body;
  if (!tableNumber && !tableToken) {
    res.status(400).json({ error: 'Table number or token is required' });
    return;
  }

  let finalTableNumber = tableNumber;
  if (tableToken) {
    const table = db.getTableByToken(tableToken);
    if (table) {
      finalTableNumber = table.tableNumber;
    }
  }

  const payload = {
    id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    tableNumber: String(finalTableNumber || 'N/A'),
    reason: reason || 'General Assistance',
    timestamp: new Date().toISOString(),
  };

  realtime.broadcastToStaff('CALL_WAITER', payload);
  db.addAuditLog('CUSTOMER', 'Guest', 'CALL_WAITER', `Customer requested assistance for Table ${finalTableNumber}`);

  res.json({ success: true, message: `Waiter notified for Table ${finalTableNumber}` });
});

// ADMIN TABLE MANAGEMENT
tableRouter.get('/admin/list', requireAdminAuth, (req: Request, res: Response): void => {
  res.json(db.getTables());
});

tableRouter.post('/admin/create', requireAdminAuth, (req: Request, res: Response): void => {
  const { tableNumber } = req.body;
  if (!tableNumber) {
    res.status(400).json({ error: 'Table number is required' });
    return;
  }
  const table = db.createTable(String(tableNumber).trim());
  db.addAuditLog((req as any).user.userId, (req as any).user.email, 'CREATE_TABLE', `Created Table ${table.tableNumber}`);
  res.status(201).json(table);
});

tableRouter.put('/admin/:id', requireAdminAuth, (req: Request, res: Response): void => {
  const { id } = req.params;
  const updated = db.updateTable(id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Table not found' });
    return;
  }
  db.addAuditLog((req as any).user.userId, (req as any).user.email, 'UPDATE_TABLE', `Updated Table ${updated.tableNumber} status`);
  res.json(updated);
});

tableRouter.post('/admin/:id/regenerate', requireAdminAuth, (req: Request, res: Response): void => {
  const { id } = req.params;
  const updated = db.regenerateTableToken(id);
  if (!updated) {
    res.status(404).json({ error: 'Table not found' });
    return;
  }
  db.addAuditLog((req as any).user.userId, (req as any).user.email, 'REGENERATE_TABLE_TOKEN', `Regenerated token for Table ${updated.tableNumber}`);
  res.json(updated);
});

tableRouter.delete('/admin/:id', requireAdminAuth, (req: Request, res: Response): void => {
  const { id } = req.params;
  const success = db.deleteTable(id);
  if (!success) {
    res.status(404).json({ error: 'Table not found' });
    return;
  }
  db.addAuditLog((req as any).user.userId, (req as any).user.email, 'DELETE_TABLE', `Deleted Table ${id}`);
  res.json({ success: true });
});

// GENERATE QR CODE DATA URL
tableRouter.get('/qr/:token', async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params;
  const appUrl = process.env.APP_URL || process.env.PUBLIC_APP_URL || 'http://localhost:3000';
  const qrTargetUrl = `${appUrl.replace(/\/$/, '')}/order/${token}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(qrTargetUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 400,
      color: {
        dark: '#1C1917',
        light: '#FFFFFF',
      },
    });
    res.json({ qrDataUrl, qrTargetUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});
