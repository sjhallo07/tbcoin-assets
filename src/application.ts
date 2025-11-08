import { appConfig } from './config';
import { ContractManager } from './contractManager';
import { EventLogger } from './eventLogger';
import { OrderManager } from './orderManager';
import { TokenState } from './tokenState';
import { TBCoinTestSuite } from './testSuite';

export class ApplicationContext {
  readonly eventLogger: EventLogger;
  readonly tokenState: TokenState;
  readonly orderManager: OrderManager;
  readonly contractManager: ContractManager;
  readonly testSuite: TBCoinTestSuite;

  constructor() {
    this.eventLogger = new EventLogger();
    this.tokenState = new TokenState({
      mint: appConfig.mintAddress,
      symbol: 'TBC',
      name: 'TB Coin',
      decimals: 9,
      initialSupply: 0n,
      taxRate: 0,
      burnRate: 0,
      rewardsRate: 0,
    });
    this.orderManager = new OrderManager();
    this.contractManager = new ContractManager(this.tokenState, this.eventLogger);
    this.testSuite = new TBCoinTestSuite(
      this.tokenState,
      this.contractManager,
      this.orderManager,
      this.eventLogger,
    );
  }
}

export const createApplicationContext = (): ApplicationContext => new ApplicationContext();
