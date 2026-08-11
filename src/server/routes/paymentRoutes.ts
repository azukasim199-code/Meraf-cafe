import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { realtime } from '../realtime';

export const paymentRouter = Router();

// PAYMENT INITIATION
paymentRouter.post('/initialize', async (req: Request, res: Response): Promise<void> => {
  const { orderId, provider } = req.body;

  const order = db.getOrderById(orderId);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  const txRef = `MERAF_TX_${order.orderNumber}_${Date.now()}`;

  if (provider === 'ONLINE_CHAPA') {
    const chapaSecretKey = process.env.CHAPA_SECRET_KEY || db.getSettings().chapaSecretKey;
    const appUrl = process.env.APP_URL || process.env.PUBLIC_APP_URL || 'http://localhost:3000';

    if (chapaSecretKey && !chapaSecretKey.includes('CHASECK_TEST-xxx')) {
      // Real Chapa API Call
      try {
        const response = await fetch('https://api.chapa.co/v1/transaction/initialize', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${chapaSecretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: order.total.toString(),
            currency: 'ETB',
            email: 'customer@merafcafe.com',
            first_name: 'Meraf',
            last_name: 'Customer',
            tx_ref: txRef,
            callback_url: `${appUrl}/api/payments/webhook`,
            return_url: `${appUrl}/track/${order.trackingToken}?payment=success`,
            customization: {
              title: 'Meraf Cafe Order Payment',
              description: `Payment for Order #${order.orderNumber} - Table ${order.tableNumber}`,
            },
          }),
        });

        const chapaRes = await response.json();
        if (chapaRes.status === 'success') {
          res.json({
            status: 'success',
            checkoutUrl: chapaRes.data.checkout_url,
            txRef,
          });
          return;
        }
      } catch (err) {
        console.error('[Chapa API Error]:', err);
      }
    }

    // Interactive Demo Payment Gateway Simulation mode when production credentials are not provided
    res.json({
      status: 'success',
      isDemoMode: true,
      checkoutUrl: `/track/${order.trackingToken}?demo_pay=chapa&tx_ref=${txRef}`,
      txRef,
      message: 'Chapa integration architecture ready. Simulated test payment active.',
    });
    return;
  }

  if (provider === 'ONLINE_TELEBIRR') {
    res.json({
      status: 'success',
      isDemoMode: true,
      checkoutUrl: `/track/${order.trackingToken}?demo_pay=telebirr&tx_ref=${txRef}`,
      txRef,
      message: 'Telebirr integration architecture ready. Simulated test payment active.',
    });
    return;
  }

  res.json({ status: 'success', paymentMethod: 'CASH' });
});

// TEST MODE CONFIRMATION ENDPOINT (simulates webhook trigger)
paymentRouter.post('/confirm-demo', (req: Request, res: Response): void => {
  const { trackingToken, provider, txRef } = req.body;
  const order = db.getOrderByTrackingToken(trackingToken);

  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  const updatedOrder = db.updateOrderStatus(order.id, 'ACCEPTED', 'PAID');
  if (updatedOrder) {
    db.addAuditLog('SYSTEM', 'PAYMENT_GATEWAY', 'PAYMENT_SUCCESS', `Paid ${order.total} ETB via ${provider} (Ref: ${txRef})`);
    realtime.broadcastToStaff('ORDER_UPDATED', updatedOrder);
    realtime.broadcastToCustomer(updatedOrder.trackingToken, 'STATUS_UPDATE', updatedOrder);
  }

  res.json({ success: true, order: updatedOrder });
});

// REAL PRODUCTION WEBHOOK HANDLER FOR CHAPA / TELEBIRR
paymentRouter.post('/webhook', (req: Request, res: Response): void => {
  const chapaSignature = req.headers['x-chapa-signature'] as string;
  const webhookSecret = process.env.CHAPA_WEBHOOK_SECRET || db.getSettings().chapaWebhookSecret;

  if (webhookSecret && chapaSignature) {
    const hash = crypto.createHmac('sha256', webhookSecret).update(JSON.stringify(req.body)).digest('hex');
    if (hash !== chapaSignature) {
      res.status(401).json({ error: 'Invalid webhook signature' });
      return;
    }
  }

  const { tx_ref, status } = req.body;
  if (!tx_ref) {
    res.status(400).json({ error: 'Missing transaction reference' });
    return;
  }

  // Extract order number from tx_ref e.g. MERAF_TX_MER-1001_1723456789
  const match = tx_ref.match(/MERAF_TX_(MER-\d+)_/);
  if (match) {
    const orderNumber = match[1];
    const order = db.getOrders().find((o) => o.orderNumber === orderNumber);
    if (order) {
      if (status === 'success' || req.body.event === 'charge.success') {
        const updated = db.updateOrderStatus(order.id, 'ACCEPTED', 'PAID');
        if (updated) {
          realtime.broadcastToStaff('ORDER_UPDATED', updated);
          realtime.broadcastToCustomer(updated.trackingToken, 'STATUS_UPDATE', updated);
        }
      }
    }
  }

  res.json({ status: 'success' });
});
