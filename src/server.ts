import express, { NextFunction, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { ApplicationContext } from './application';
import { appConfig } from './config';
import { TokenSnapshot, EventType, EventStatus } from './types';

// Derive valid event statuses from EventStatus type
const VALID_EVENT_STATUSES: EventStatus[] = ['CONFIRMED', 'FAILED', 'PENDING'];

// Derive valid event types from EventType union
const VALID_EVENT_TYPES: EventType[] = [
  'TOKEN_MINT',
  'TOKEN_TRANSFER',
  'TOKEN_BURN',
  'ORDER_CREATED',
  'ORDER_EDITED',
  'ORDER_CANCELLED',
];

const serialiseSnapshot = (snapshot: TokenSnapshot) => ({
  ...snapshot,
  supply: snapshot.supply.toString(),
});

export const buildServer = (context: ApplicationContext): express.Application => {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  const validate = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    return next();
  };

  // Validation schemas
  const contractModifyValidation = [
    body('instruction').isIn(['UPDATE_METADATA', 'CHANGE_SUPPLY', 'MODIFY_TAX', 'PAUSE_TRANSFERS']),
    body('parameters').isObject(),
    body('parameters.field').optional().isString(),
    body('authority').isString(),
    body('timestamp').isInt(),
    body('signature').isString(),
  ];

  const contractUpgradeValidation = [
    body('version').isString(),
    body('changes').isObject(),
    body('authority').isString(),
    body('signature').isString(),
    body('timestamp').isInt(),
  ];

  app.post(
    '/api/contract/modify',
    contractModifyValidation,
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { snapshot, event } = await context.contractManager.handleModification(req.body);
        res.json({ success: true, snapshot: serialiseSnapshot(snapshot), event });
      } catch (error) {
        next(error);
      }
    },
  );

  app.post(
    '/api/contract/upgrade',
    contractUpgradeValidation,
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const event = await context.contractManager.handleUpgrade(req.body);
        res.json({ success: true, event });
      } catch (error) {
        next(error);
      }
    },
  );

  app.get('/api/contract/status', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const status = context.contractManager.getStatus();
      res.json({
        success: true,
        status: {
          token: serialiseSnapshot(status.token),
          modifications: status.modifications,
          upgrades: status.upgrades,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/contract/test-all', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const results = await context.testSuite.runCompleteTestSuite();
      res.json({ success: true, results });
    } catch (error) {
      next(error);
    }
  });

  app.post(
    '/api/token/mint',
    [
      body('wallet').isString(),
      body('amount').isString(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { wallet } = req.body;
        const amount = BigInt(req.body.amount);
        const account = context.tokenState.mintTokens(wallet, amount);
        const snapshot = context.tokenState.getSnapshot();
        await context.eventLogger.logEvent('TOKEN_MINT', {
          wallet,
          amount: amount.toString(),
          supply: snapshot.supply.toString(),
        }, 'CONFIRMED');
        res.json({
          success: true,
          balance: account.balance.toString(),
          supply: snapshot.supply.toString(),
        });
      } catch (error) {
        next(error);
      }
    },
  );

  app.post(
    '/api/token/transfer',
    [
      body('from').isString(),
      body('to').isString(),
      body('amount').isString(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { from, to } = req.body;
        const amount = BigInt(req.body.amount);
        const result = context.tokenState.transferTokens(from, to, amount);
        await context.eventLogger.logEvent('TOKEN_TRANSFER', {
          from,
          to,
          amount: amount.toString(),
        }, 'CONFIRMED');
        res.json({
          success: true,
          balances: {
            from: result.from.balance.toString(),
            to: result.to.balance.toString(),
          },
        });
      } catch (error) {
        next(error);
      }
    },
  );

  app.post(
    '/api/token/burn',
    [
      body('wallet').isString(),
      body('amount').isString(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { wallet } = req.body;
        const amount = BigInt(req.body.amount);
        const account = context.tokenState.burnTokens(wallet, amount);
        const snapshot = context.tokenState.getSnapshot();
        await context.eventLogger.logEvent('TOKEN_BURN', {
          wallet,
          amount: amount.toString(),
          supply: snapshot.supply.toString(),
        }, 'CONFIRMED');
        res.json({
          success: true,
          balance: account.balance.toString(),
          supply: snapshot.supply.toString(),
        });
      } catch (error) {
        next(error);
      }
    },
  );

  app.get(
    '/api/token/balance/:wallet',
  [param('wallet').isString()],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { wallet } = req.params;
      const account = context.tokenState.getBalance(wallet);
      res.json({ success: true, balance: account.balance.toString() });
    } catch (error) {
      next(error);
    }
  },
  );

  app.post(
    '/api/orders/create',
    [
      body('orderType').isString(),
      body('amount').isNumeric(),
      body('price').isNumeric(),
      body('wallet').isString(),
      body('editable').optional().isBoolean(),
      body('expiration').optional().isInt(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const order = context.orderManager.createOrder(req.body);
        await context.eventLogger.logEvent('ORDER_CREATED', { order }, 'CONFIRMED');
        res.json({ success: true, order });
      } catch (error) {
        next(error);
      }
    },
  );
  app.put(
    '/api/orders/edit/:orderId',
    [
      param('orderId').isString(),
      body('amount').optional().isNumeric(),
      body('price').optional().isNumeric(),
      body('orderType').optional().isString(),
      body('editable').optional().isBoolean(),
      body('expiration').optional().isInt(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orderId } = req.params;
        const order = context.orderManager.editOrder(orderId, req.body);
        await context.eventLogger.logEvent('ORDER_EDITED', { order }, 'CONFIRMED');
        res.json({ success: true, order });
      } catch (error) {
        next(error);
      }
    },
  );

  app.delete(
    '/api/orders/cancel/:orderId',
    [param('orderId').isString()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orderId } = req.params;
        const order = context.orderManager.cancelOrder(orderId);
        await context.eventLogger.logEvent('ORDER_CANCELLED', { order }, 'CONFIRMED');
        res.json({ success: true, order });
      } catch (error) {
        next(error);
      }
    },
  );

  app.get(
    '/api/orders/history',
    [
      query('wallet').optional().isString(),
      query('status').optional().isIn(['OPEN', 'FILLED', 'CANCELLED']),
    ],
    validate,
    (req: Request, res: Response, next: NextFunction) => {
      try {
        const { wallet, status } = req.query;
        const history = context.orderManager.getHistory({
          wallet: wallet as string | undefined,
          status: status as 'OPEN' | 'FILLED' | 'CANCELLED' | undefined,
        });
        res.json({ success: true, history });
      } catch (error) {
        next(error);
      }
    }
  );

  app.get(
    '/api/events/logs',
    [
      query('type').optional().isIn(VALID_EVENT_TYPES),
      query('status').optional().isIn(VALID_EVENT_STATUSES),
      query('fromBlock').optional().isInt(),
      query('limit').optional().isInt(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const type = req.query.type;
        const status = req.query.status;
        const eventType = (type && VALID_EVENT_TYPES.includes(type as EventType))
          ? (type as EventType)
          : undefined;
        const eventStatus = (status && VALID_EVENT_STATUSES.includes(status as EventStatus))
          ? (status as EventStatus)
          : undefined;
        const logs = await context.eventLogger.getLogs({
          type: eventType,
          status: eventStatus,
          fromBlock: req.query.fromBlock ? Number(req.query.fromBlock) : undefined,
          limit: req.query.limit ? Number(req.query.limit) : undefined,
        });
        res.json({ success: true, logs });
      } catch (error) {
        next(error);
      }
    }
  );
  app.post(
    '/api/events/resume',
    [
      body('fromBlock').optional().isInt(),
      body('fromError').optional().isBoolean(),
      body('checkpoint').optional().isString(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const summary = await context.testSuite.resumeFromLogs(req.body);
        res.json({ success: true, summary });
      } catch (error) {
        next(error);
      }
    },
  );

  app.get('/api/events/realtime', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const heartbeat = setInterval(() => {
      res.write(':\n\n');
    }, 15000);

    const unsubscribe = context.eventLogger.subscribe((event) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    });

    req.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
      res.end();
    });
  });

  app.get('/api/health', async (_req: Request, res: Response) => {
    res.json({
      success: true,
      network: appConfig.solanaNetwork,
      lastEventBlock: await context.eventLogger.getLastBlockNumber(),
    });
  });

  app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ success: false, error: error.message });
  });

  return app;
};
