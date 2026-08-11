import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { realtime } from '../realtime';
import { Order, OrderItem, OrderItemAddOn, OrderStatus, PaymentStatus } from '../../types';

export const orderRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'meraf-cafe-jwt-secret-key-addis-ababa-2026';

function requireStaffAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Staff login required' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string; email: string };
    (req as any).user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
}

// CUSTOMER ORDER CREATION WITH SERVER-SIDE PRICE VALIDATION
orderRouter.post('/', (req: Request, res: Response): void => {
  const { tableToken, items, paymentMethod, customerNote } = req.body;

  const settings = db.getSettings();
  if (settings.isClosed) {
    res.status(400).json({
      error: 'Cafe is closed',
      messageEn: settings.closedReasonEn || 'Meraf Cafe is currently closed.',
      messageAm: settings.closedReasonAm || 'መራፍ ካፌ በአሁኑ ሰዓት ዝግ ነው።',
    });
    return;
  }

  if (!tableToken) {
    res.status(400).json({ error: 'Table token is required' });
    return;
  }

  const table = db.getTableByToken(tableToken);
  if (!table || !table.isActive) {
    res.status(400).json({ error: 'Invalid or inactive table token' });
    return;
  }

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Order must contain at least one item' });
    return;
  }

  const allProducts = db.getProducts();
  const allAddOns = db.getAddOns();

  const validatedOrderItems: OrderItem[] = [];
  let calculatedSubtotal = 0;

  for (const item of items) {
    const dbProduct = allProducts.find((p) => p.id === item.productId);
    if (!dbProduct) {
      res.status(400).json({ error: `Product not found: ${item.productId}` });
      return;
    }

    if (!dbProduct.isAvailable) {
      res.status(400).json({
        error: 'Product unavailable',
        messageEn: `Sorry, "${dbProduct.nameEn}" is currently out of stock.`,
        messageAm: `ይቅርታ፣ "${dbProduct.nameAm}" በአሁኑ ሰዓት አልቋል።`,
      });
      return;
    }

    let unitPrice = dbProduct.priceEtb;
    let variationNameEn: string | undefined = undefined;
    let variationNameAm: string | undefined = undefined;

    if (item.variationId && dbProduct.variations) {
      const variation = dbProduct.variations.find((v) => v.id === item.variationId);
      if (variation) {
        unitPrice = variation.priceEtb;
        variationNameEn = variation.nameEn;
        variationNameAm = variation.nameAm;
      }
    }

    const validatedAddOns: OrderItemAddOn[] = [];
    let addOnTotal = 0;

    if (Array.isArray(item.selectedAddOnIds)) {
      for (const addOnId of item.selectedAddOnIds) {
        const dbAddOn = allAddOns.find((a) => a.id === addOnId && a.isActive);
        if (dbAddOn) {
          validatedAddOns.push({
            id: uuidv4(),
            addOnId: dbAddOn.id,
            nameEn: dbAddOn.nameEn,
            nameAm: dbAddOn.nameAm,
            priceEtb: dbAddOn.priceEtb,
          });
          addOnTotal += dbAddOn.priceEtb;
        }
      }
    }

    const itemUnitPrice = unitPrice + addOnTotal;
    const quantity = Math.max(1, parseInt(item.quantity) || 1);
    const itemTotalPrice = itemUnitPrice * quantity;

    calculatedSubtotal += itemTotalPrice;

    validatedOrderItems.push({
      id: uuidv4(),
      productId: dbProduct.id,
      productNameEn: dbProduct.nameEn,
      productNameAm: dbProduct.nameAm,
      variationNameEn,
      variationNameAm,
      quantity,
      unitPrice: itemUnitPrice,
      totalPrice: itemTotalPrice,
      addOns: validatedAddOns,
      specialInstructions: item.specialInstructions ? String(item.specialInstructions).substring(0, 200) : undefined,
    });
  }

  const taxAmount = (calculatedSubtotal * (settings.taxRatePercent || 0)) / 100;
  const serviceCharge = (calculatedSubtotal * (settings.serviceChargePercent || 0)) / 100;
  const trustedTotal = calculatedSubtotal + taxAmount + serviceCharge;

  const validPaymentMethod = ['CASH', 'ONLINE_CHAPA', 'ONLINE_TELEBIRR'].includes(paymentMethod)
    ? paymentMethod
    : 'CASH';

  const newOrder = db.createOrder({
    tableId: table.id,
    tableNumber: table.tableNumber,
    items: validatedOrderItems,
    subtotal: calculatedSubtotal,
    taxAmount,
    serviceCharge,
    total: trustedTotal,
    paymentMethod: validPaymentMethod,
    paymentStatus: 'UNPAID',
    orderStatus: 'NEW',
    customerNote,
  });

  // Broadcast to Staff Kitchen Dashboard
  realtime.broadcastToStaff('NEW_ORDER', newOrder);

  res.status(201).json({
    success: true,
    trackingToken: newOrder.trackingToken,
    orderNumber: newOrder.orderNumber,
    tableNumber: newOrder.tableNumber,
    total: newOrder.total,
    order: newOrder,
  });
});

// GET ORDER DETAILS FOR CUSTOMER LIVE TRACKING
orderRouter.get('/track/:trackingToken', (req: Request, res: Response): void => {
  const { trackingToken } = req.params;
  const order = db.getOrderByTrackingToken(trackingToken);

  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  const settings = db.getSettings();

  res.json({
    order,
    cafeInfo: {
      cafeName: settings.cafeName,
      phone: settings.phone,
      address: settings.address,
      logoUrl: settings.logoUrl,
    },
  });
});

// GET ORDERS FOR STAFF / KITCHEN DISPLAY
orderRouter.get('/staff/list', requireStaffAuth, (req: Request, res: Response): void => {
  res.json(db.getOrders());
});

// UPDATE ORDER STATUS OR PAYMENT STATUS
orderRouter.patch('/staff/:id/status', requireStaffAuth, (req: Request, res: Response): void => {
  const { id } = req.params;
  const { orderStatus, paymentStatus } = req.body;

  const order = db.getOrderById(id);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  const updatedOrder = db.updateOrderStatus(id, orderStatus || order.orderStatus, paymentStatus || order.paymentStatus);

  if (updatedOrder) {
    db.addAuditLog(
      (req as any).user.userId,
      (req as any).user.email,
      'UPDATE_ORDER_STATUS',
      `Changed Order #${updatedOrder.orderNumber} status to ${updatedOrder.orderStatus} (Payment: ${updatedOrder.paymentStatus})`
    );

    // Broadcast to Staff and Customer
    realtime.broadcastToStaff('ORDER_UPDATED', updatedOrder);
    realtime.broadcastToCustomer(updatedOrder.trackingToken, 'STATUS_UPDATE', updatedOrder);
  }

  res.json(updatedOrder);
});
