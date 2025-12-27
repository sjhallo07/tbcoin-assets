import crypto from 'crypto';
import { TokenAccountState, TokenSnapshot } from './types';

interface TokenStateOptions {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  initialSupply: bigint;
  taxRate: number;
  burnRate: number;
  rewardsRate: number;
}

export class TokenState {
  private readonly mint: string;
  private symbol: string;
  private name: string;
  private readonly decimals: number;
  private supply: bigint;
  private taxRate: number;
  private burnRate: number;
  private rewardsRate: number;
  private paused = false;
  private readonly accounts = new Map<string, TokenAccountState>();
  private readonly history: Array<{ id: string; action: string; amount: bigint; wallet?: string }> = [];

  constructor(options: TokenStateOptions) {
    this.mint = options.mint;
    this.symbol = options.symbol;
    this.name = options.name;
    this.decimals = options.decimals;
    this.supply = options.initialSupply;
    this.taxRate = options.taxRate;
    this.burnRate = options.burnRate;
    this.rewardsRate = options.rewardsRate;
  }

  getSnapshot(): TokenSnapshot {
    return {
      mint: this.mint,
      symbol: this.symbol,
      name: this.name,
      decimals: this.decimals,
      supply: this.supply,
      taxRate: this.taxRate,
      burnRate: this.burnRate,
      rewardsRate: this.rewardsRate,
      paused: this.paused,
    };
  }

  setMetadata(field: string, value: unknown): void {
    if (!['name', 'symbol'].includes(field)) {
      throw new Error(`Unsupported metadata field ${field}`);
    }
    if (typeof value !== 'string') {
      throw new Error('Metadata value must be string');
    }
    if (field === 'name') {
      this.name = value;
    }
    if (field === 'symbol') {
      this.symbol = value;
    }
  }

  setRates(field: string, value: unknown): void {
    if (typeof value !== 'number') {
      throw new Error('Rate value must be numeric');
    }
    if (value < 0 || value > 1) {
      throw new Error('Rate must be between 0 and 1');
    }
    switch (field) {
      case 'taxRate':
        this.taxRate = value;
        break;
      case 'burnRate':
        this.burnRate = value;
        break;
      case 'rewardsRate':
        this.rewardsRate = value;
        break;
      default:
        throw new Error(`Unsupported rate field ${field}`);
    }
  }

  pauseTransfers(paused: boolean): void {
    this.paused = paused;
  }

  changeSupply(targetSupply: bigint): void {
    this.supply = targetSupply;
  }

  mintTokens(wallet: string, amount: bigint): TokenAccountState {
    this.ensureActive();
    if (amount <= 0n) {
      throw new Error('Mint amount must be positive');
    }
    this.supply += amount;
    const account = this.getOrCreateAccount(wallet);
    account.balance += amount;
    this.appendHistory('mint', amount, wallet);
    return account;
  }

  burnTokens(wallet: string, amount: bigint): TokenAccountState {
    this.ensureActive();
    if (amount <= 0n) {
      throw new Error('Burn amount must be positive');
    }
    const account = this.getOrCreateAccount(wallet);
    if (account.balance < amount) {
      throw new Error('Insufficient balance to burn');
    }
    account.balance -= amount;
    this.supply -= amount;
    this.appendHistory('burn', amount, wallet);
    return account;
  }

  transferTokens(from: string, to: string, amount: bigint): { from: TokenAccountState; to: TokenAccountState } {
    this.ensureActive();
    if (amount <= 0n) {
      throw new Error('Transfer amount must be positive');
    }
    const sender = this.getOrCreateAccount(from);
    const receiver = this.getOrCreateAccount(to);
    if (sender.balance < amount) {
      throw new Error('Insufficient balance');
    }
    sender.balance -= amount;
    receiver.balance += amount;
    this.appendHistory('transfer', amount, from);
    return { from: sender, to: receiver };
  }

  getBalance(wallet: string): TokenAccountState {
    return this.getOrCreateAccount(wallet);
  }

  getHistory(): Array<{ id: string; action: string; amount: bigint; wallet?: string }> {
    return [...this.history];
  }

  private getOrCreateAccount(wallet: string): TokenAccountState {
    const existing = this.accounts.get(wallet);
    if (existing) {
      return existing;
    }
    const account: TokenAccountState = { wallet, balance: 0n };
    this.accounts.set(wallet, account);
    return account;
  }

  private ensureActive(): void {
    if (this.paused) {
      throw new Error('Transfers are paused');
    }
  }

  private appendHistory(action: string, amount: bigint, wallet?: string): void {
    this.history.push({ id: crypto.randomUUID(), action, amount, wallet });
  }
}
