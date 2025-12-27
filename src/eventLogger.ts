import { promises as fs } from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import crypto from 'crypto';
import { appConfig } from './config';
import { EventFilter, EventLog, EventStatus, EventType } from './types';

export class EventLogger {
  private logs: EventLog[] = [];
  private readonly emitter = new EventEmitter();
  private readonly storageDir = appConfig.storageDirectory;
  private readonly storageFile = appConfig.eventLogFile;
  private blockCounter = 0;
  private readonly ready: Promise<void>;

  constructor() {
    this.ready = this.initialise();
  }

  private async initialise(): Promise<void> {
    await fs.mkdir(this.storageDir, { recursive: true });
    try {
      const content = await fs.readFile(this.storageFile, 'utf-8');
      const parsed = JSON.parse(content) as EventLog[];
      // Validate that all blockNumber values are non-negative
      const invalid = parsed.filter(entry => typeof entry.blockNumber !== 'number' || entry.blockNumber < 0);
      if (invalid.length > 0) {
        throw new Error('Invalid log entries: blockNumber must be non-negative');
      }
      this.logs = parsed;
      const lastBlock = parsed.reduce((acc, entry) => Math.max(acc, entry.blockNumber), 0);
      this.blockCounter = lastBlock;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
      await fs.writeFile(this.storageFile, '[]', 'utf-8');
    }
  }

  async logEvent(type: EventType, data: Record<string, unknown>, status: EventStatus = 'PENDING'): Promise<EventLog> {
    await this.ready;
    this.blockCounter += 1;
    const event: EventLog = {
      id: crypto.randomUUID(),
      type,
      data,
      blockNumber: this.blockCounter,
      timestamp: Date.now(),
      signature: null,
      status,
      retryCount: 0,
    };
    this.logs.push(event);
    await this.persist();
    this.emitter.emit('contractEvent', event);
    return event;
  }

  async updateEventStatus(id: string, status: EventStatus, signature?: string | null): Promise<EventLog | undefined> {
    await this.ready;
    const target = this.logs.find((log) => log.id === id);
    if (!target) {
      return undefined;
    }
    target.status = status;
    if (signature) {
      target.signature = signature;
    }
    await this.persist();
    return target;
  }

  async incrementRetry(id: string): Promise<void> {
    await this.ready;
    const target = this.logs.find((log) => log.id === id);
    if (!target) {
      return;
    }
    target.retryCount += 1;
    await this.persist();
  }

  async getLogs(filter: EventFilter = {}): Promise<EventLog[]> {
    await this.ready;
    const { type, status, fromBlock, limit } = filter;
    let results = [...this.logs];
    if (type) {
      results = results.filter((entry) => entry.type === type);
    }
    if (status) {
      results = results.filter((entry) => entry.status === status);
    }
    if (typeof fromBlock === 'number') {
      results = results.filter((entry) => entry.blockNumber >= fromBlock);
    }
    if (typeof limit === 'number') {
      results = results.slice(-limit);
    }
    return results;
  }

  subscribe(listener: (event: EventLog) => void): () => void {
    this.emitter.on('contractEvent', listener);
    return () => this.emitter.off('contractEvent', listener);
  }

  /**
   * Returns the last block number. Awaits initialization to ensure logs are loaded.
   */
  async getLastBlockNumber(): Promise<number> {
    await this.ready;
    return this.logs.length === 0 ? 0 : this.logs[this.logs.length - 1].blockNumber;
  }

  private async persist(): Promise<void> {
    const serialised = JSON.stringify(this.logs, null, 2);
    await fs.writeFile(this.storageFile, serialised, 'utf-8');
  }
}
