import { ContractManager } from './contractManager';
import { EventLogger } from './eventLogger';
import { OrderManager } from './orderManager';
import { TokenState } from './tokenState';
import { OrderRecord, ResumeOptions, ResumeSummary, TestCaseResult, TestResults } from './types';

function isOrderRecord(candidate: Partial<OrderRecord> | undefined): candidate is OrderRecord {
  return (
    !!candidate &&
    typeof candidate.id === 'string' &&
    typeof candidate.orderType === 'string' &&
    typeof candidate.amount === 'number' &&
    typeof candidate.price === 'number' &&
    typeof candidate.wallet === 'string' &&
    typeof candidate.editable === 'boolean' &&
    typeof candidate.status === 'string' &&
    typeof candidate.createdAt === 'number' &&
    typeof candidate.updatedAt === 'number'
  );
}

export class TBCoinTestSuite {
  constructor(
    private readonly tokenState: TokenState,
    private readonly contractManager: ContractManager,
    private readonly orderManager: OrderManager,
    private readonly eventLogger: EventLogger,
  ) {}

  async runCompleteTestSuite(): Promise<TestResults> {
    return {
      mint: [await this.testMintFunction()],
      transfer: [await this.testTransferFunction()],
      burn: [await this.testBurnFunction()],
      modify: [...this.contractManager.buildContractTests()],
      orders: [await this.testOrderSystem()],
    };
  }

  async resumeFromLogs(options: ResumeOptions): Promise<ResumeSummary> {
    const logs = await this.eventLogger.getLogs({ fromBlock: options.fromBlock });
    const filtered = options.fromError ? logs.filter((entry) => entry.status === 'FAILED') : logs;
    const operations: ResumeSummary['operations'] = [];

    for (const log of filtered) {
      try {
        await this.retryOperation(log.type, log.data);
        await this.eventLogger.updateEventStatus(log.id, 'CONFIRMED');
        operations.push({ id: log.id, success: true });
      } catch (error) {
        await this.eventLogger.incrementRetry(log.id);
        operations.push({ id: log.id, success: false, error: (error as Error).message });
      }
    }

    const successCount = operations.filter((entry) => entry.success).length;
    const successRate = operations.length === 0 ? 1 : successCount / operations.length;

    return {
      resumedOperations: operations.length,
      lastProcessedBlock: logs.length > 0 ? logs[logs.length - 1].blockNumber : null,
      successRate,
      operations,
    };
  }

  private async retryOperation(type: string, data: Record<string, unknown>): Promise<void> {
    switch (type) {
      case 'TOKEN_MINT': {
        const wallet = String(data.wallet);
        const amount = BigInt(data.amount as string);
        this.tokenState.mintTokens(wallet, amount);
        break;
      }
      case 'TOKEN_TRANSFER': {
        const from = String(data.from);
        const to = String(data.to);
        const amount = BigInt(data.amount as string);
        this.tokenState.transferTokens(from, to, amount);
        break;
      }
      case 'TOKEN_BURN': {
        const wallet = String(data.wallet);
        const amount = BigInt(data.amount as string);
        this.tokenState.burnTokens(wallet, amount);
        break;
      }
      case 'ORDER_CREATED':
      case 'ORDER_SENT': {
        const order = data.order as Partial<OrderRecord> | undefined;
        if (!isOrderRecord(order)) {
          throw new Error('Missing order payload');
        }
        this.orderManager.restoreOrder(order);
        break;
      }
      case 'ORDER_EDITED': {
        const order = data.order as Partial<OrderRecord> | undefined;
        if (!isOrderRecord(order)) {
          throw new Error('Missing order payload');
        }
        this.orderManager.restoreOrder(order);
        break;
      }
      case 'ORDER_CANCELLED': {
        const order = data.order as Partial<OrderRecord> | undefined;
        if (!isOrderRecord(order)) {
          throw new Error('Missing order payload');
        }
        this.orderManager.restoreOrder(order);
        break;
      }
      default:
        break;
    }
  }

  private async testMintFunction(): Promise<TestCaseResult> {
    try {
      const wallet = 'test-wallet-mint';
      const before = this.tokenState.getBalance(wallet).balance;
      this.tokenState.mintTokens(wallet, 10n);
      const after = this.tokenState.getBalance(wallet).balance;
      return {
        name: 'Mint increases balance',
        success: after > before,
      };
    } catch (error) {
      return {
        name: 'Mint increases balance',
        success: false,
        error: (error as Error).message,
      };
    }
  }

  private async testTransferFunction(): Promise<TestCaseResult> {
    try {
      const sender = 'test-wallet-transfer-sender';
      const receiver = 'test-wallet-transfer-receiver';
      this.tokenState.mintTokens(sender, 20n);
      this.tokenState.transferTokens(sender, receiver, 5n);
      const senderBalance = this.tokenState.getBalance(sender).balance;
      const receiverBalance = this.tokenState.getBalance(receiver).balance;
      return {
        name: 'Transfer moves balance between accounts',
        success: senderBalance === 15n && receiverBalance === 5n,
      };
    } catch (error) {
      return {
        name: 'Transfer moves balance between accounts',
        success: false,
        error: (error as Error).message,
      };
    }
  }

  private async testBurnFunction(): Promise<TestCaseResult> {
    try {
      const wallet = 'test-wallet-burn';
      this.tokenState.mintTokens(wallet, 30n);
      this.tokenState.burnTokens(wallet, 10n);
      const balance = this.tokenState.getBalance(wallet).balance;
      return {
        name: 'Burn decreases supply and balance',
        success: balance === 20n,
      };
    } catch (error) {
      return {
        name: 'Burn decreases supply and balance',
        success: false,
        error: (error as Error).message,
      };
    }
  }

  private async testOrderSystem(): Promise<TestCaseResult> {
    try {
      const order = this.orderManager.createOrder({
        orderType: 'LIMIT_BUY',
        amount: 100,
        price: 0.05,
        wallet: 'test-wallet-order',
        editable: true,
      });
      this.orderManager.editOrder(order.id, { amount: 150 });
      this.orderManager.cancelOrder(order.id);
      const history = this.orderManager.getHistory({ wallet: 'test-wallet-order' });
      const edited = history.some((entry) => entry.id === order.id && entry.amount === 150);
      const cancelled = history.some((entry) => entry.id === order.id && entry.status === 'CANCELLED');
      return {
        name: 'Order lifecycle supports edit and cancel',
        success: edited && cancelled,
      };
    } catch (error) {
      return {
        name: 'Order lifecycle supports edit and cancel',
        success: false,
        error: (error as Error).message,
      };
    }
  }
}
