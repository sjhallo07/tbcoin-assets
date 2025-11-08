import crypto from 'crypto';
import { OrderRecord, OrderRequest, OrderStatus } from './types';

export class OrderManager {
  private readonly orders = new Map<string, OrderRecord>();
  private readonly history: OrderRecord[] = [];
  private readonly restoreLocks = new Set<string>();

  createOrder(request: OrderRequest): OrderRecord {
    if (request.amount <= 0) {
      throw new Error('Order amount must be positive');
    }
    if (request.price <= 0) {
      throw new Error('Order price must be positive');
    }
    const now = Date.now();
    const record: OrderRecord = {
      id: crypto.randomUUID(),
      orderType: request.orderType,
      amount: request.amount,
      price: request.price,
      wallet: request.wallet,
      editable: request.editable ?? true,
      expiration: request.expiration,
      status: 'OPEN',
      createdAt: now,
      updatedAt: now,
    };
    this.orders.set(record.id, record);
    this.history.push({ ...record });
    return record;
  }

  editOrder(orderId: string, updates: Partial<OrderRequest>): OrderRecord {
    const existing = this.orders.get(orderId);
    if (!existing) {
      throw new Error('Order not found');
    }
    if (!existing.editable || existing.status !== 'OPEN') {
      throw new Error('Order cannot be edited');
    }
    if (updates.amount !== undefined && updates.amount <= 0) {
      throw new Error('Order amount must be positive');
    }
    if (updates.price !== undefined && updates.price <= 0) {
      throw new Error('Order price must be positive');
    }
    const updated: OrderRecord = {
      ...existing,
      amount: updates.amount ?? existing.amount,
      price: updates.price ?? existing.price,
      orderType: updates.orderType ?? existing.orderType,
      editable: updates.editable ?? existing.editable,
      expiration: updates.expiration ?? existing.expiration,
      updatedAt: Date.now(),
    };
    this.orders.set(orderId, updated);
    this.history.push({ ...updated });
    return updated;
  }

  cancelOrder(orderId: string): OrderRecord {
    const existing = this.orders.get(orderId);
    if (!existing) {
      throw new Error('Order not found');
    }
    if (existing.status === 'CANCELLED') {
      return existing;
    }
    const cancelled: OrderRecord = { ...existing, status: 'CANCELLED', updatedAt: Date.now() };
    this.orders.set(orderId, cancelled);
    this.history.push({ ...cancelled });
    return cancelled;
  }

  completeOrder(orderId: string): OrderRecord {
    const existing = this.orders.get(orderId);
    if (!existing) {
      throw new Error('Order not found');
    }
    const filled: OrderRecord = { ...existing, status: 'FILLED', updatedAt: Date.now() };
    this.orders.set(orderId, filled);
    this.history.push({ ...filled });
    return filled;
  }

  getHistory(filters: { wallet?: string; status?: OrderStatus } = {}): OrderRecord[] {
    const { wallet, status } = filters;
    return this.history.filter((entry) => {
      if (wallet && entry.wallet !== wallet) {
        return false;
      }
      if (status && entry.status !== status) {
        return false;
      }
      return true;
    });
  }

  getOrder(orderId: string): OrderRecord | undefined {
    return this.orders.get(orderId);
  }

  /**
   * Note: This method is not thread-safe. The lock check and acquisition are not atomic,
   * and in a multi-threaded environment, a race condition could occur.
   * JavaScript in Node.js is single-threaded, but if using worker threads or other concurrency,
   * consider using a proper synchronization mechanism.
   */
  restoreOrder(record: OrderRecord): OrderRecord {
    // Acquire lock for this order id (not atomic, see note above)
    if (this.restoreLocks.has(record.id)) {
      throw new Error('Restore operation already in progress for this order');
    }
    this.restoreLocks.add(record.id);
    try {
      const existing = this.orders.get(record.id);
      if (existing && existing.updatedAt >= record.updatedAt) {
        return existing;
      }
      this.orders.set(record.id, { ...record });
      this.history.push({ ...record });
      return record;
    } finally {
      // Release lock
      this.restoreLocks.delete(record.id);
    }
  }
}
