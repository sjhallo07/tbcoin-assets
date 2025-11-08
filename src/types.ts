import { Request } from 'express';

export type ContractInstruction =
  | 'UPDATE_METADATA'
  | 'CHANGE_SUPPLY'
  | 'MODIFY_TAX'
  | 'PAUSE_TRANSFERS';

export interface ContractModification {
  instruction: ContractInstruction;
  parameters: {
    field: string;
    value: unknown;
    validationRules?: string[];
  };
  authority: string;
  timestamp: number;
  signature: string;
}

export type EventType =
  | 'CONTRACT_MODIFIED'
  | 'ORDER_SENT'
  | 'TRANSACTION'
  | 'ERROR'
  | 'ORDER_CREATED'
  | 'ORDER_EDITED'
  | 'ORDER_CANCELLED'
  | 'TOKEN_MINT'
  | 'TOKEN_TRANSFER'
  | 'TOKEN_BURN'
  | 'UPGRADE'
  | 'CHECKPOINT';

export type EventStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

export interface EventLog {
  id: string;
  type: EventType;
  data: Record<string, unknown>;
  blockNumber: number;
  timestamp: number;
  signature: string | null;
  status: EventStatus;
  retryCount: number;
}

export interface EventFilter {
  type?: EventType;
  status?: EventStatus;
  fromBlock?: number;
  limit?: number;
}

export interface TokenAccountState {
  wallet: string;
  balance: bigint;
}

export interface TokenSnapshot {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  supply: bigint;
  taxRate: number;
  burnRate: number;
  rewardsRate: number;
  paused: boolean;
}

export interface OrderRequest {
  orderType: string;
  amount: number;
  price: number;
  wallet: string;
  editable?: boolean;
  expiration?: number;
}

export type OrderStatus = 'OPEN' | 'FILLED' | 'CANCELLED';

export interface OrderRecord {
  id: string;
  orderType: string;
  amount: number;
  price: number;
  wallet: string;
  editable: boolean;
  expiration?: number;
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
}

export interface ResumeOptions {
  fromBlock?: number;
  fromError?: boolean;
  checkpoint?: string;
}

export interface TestCaseResult {
  name: string;
  success: boolean;
  error?: string;
}

export interface TestResults {
  mint: TestCaseResult[];
  transfer: TestCaseResult[];
  burn: TestCaseResult[];
  modify: TestCaseResult[];
  orders: TestCaseResult[];
}

export interface ResumeSummary {
  resumedOperations: number;
  lastProcessedBlock: number | null;
  successRate: number;
  operations: Array<{ id: string; success: boolean; error?: string }>;
}

export interface AuthedRequest<T> extends Request {
  body: T;
}
