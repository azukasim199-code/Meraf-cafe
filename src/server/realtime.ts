import { Response } from 'express';

interface ConnectedClient {
  id: string;
  res: Response;
  role: 'staff' | 'customer';
  trackingToken?: string;
}

class RealtimeManager {
  private clients: Map<string, ConnectedClient> = new Map();

  public addClient(id: string, res: Response, role: 'staff' | 'customer', trackingToken?: string) {
    this.clients.set(id, { id, res, role, trackingToken });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Send initial ping connection event
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientId: id })}\n\n`);

    res.on('close', () => {
      this.clients.delete(id);
    });
  }

  public broadcastToStaff(eventType: string, data: any) {
    const payload = `data: ${JSON.stringify({ type: eventType, data })}\n\n`;
    for (const client of this.clients.values()) {
      if (client.role === 'staff') {
        try {
          client.res.write(payload);
        } catch (e) {
          this.clients.delete(client.id);
        }
      }
    }
  }

  public broadcastToCustomer(trackingToken: string, eventType: string, data: any) {
    const payload = `data: ${JSON.stringify({ type: eventType, data })}\n\n`;
    for (const client of this.clients.values()) {
      if (client.role === 'customer' && client.trackingToken === trackingToken) {
        try {
          client.res.write(payload);
        } catch (e) {
          this.clients.delete(client.id);
        }
      }
    }
  }

  public getConnectedCount(): { staff: number; customer: number } {
    let staff = 0;
    let customer = 0;
    for (const c of this.clients.values()) {
      if (c.role === 'staff') staff++;
      if (c.role === 'customer') customer++;
    }
    return { staff, customer };
  }
}

export const realtime = new RealtimeManager();
