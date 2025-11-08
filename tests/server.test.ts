import path from 'path';
import { promises as fs } from 'fs';
import request from 'supertest';

let app: import('express').Application;
let context: import('../src/application').ApplicationContext;
let appConfig: typeof import('../src/config').appConfig;
let computeSignature: (payload: unknown, secret: string) => string;

beforeAll(async () => {
  process.env.API_KEY = 'test-secret';
  process.env.STORAGE_DIR = 'storage-test';
  process.env.EVENT_LOG_FILE = path.join('storage-test', 'event-logs-test.json');

  const [{ createApplicationContext }, { buildServer }, configModule, validationModule] = await Promise.all([
    import('../src/application'),
    import('../src/server'),
    import('../src/config'),
    import('../src/utils/validation'),
  ]);

  context = createApplicationContext();
  app = buildServer(context);
  appConfig = configModule.appConfig;
  computeSignature = validationModule.computeSignature;
});

afterAll(async () => {
  delete process.env.API_KEY;
  delete process.env.STORAGE_DIR;
  delete process.env.EVENT_LOG_FILE;
  await fs.rm(path.resolve(process.cwd(), 'storage-test'), { recursive: true, force: true });
});

describe('TB Coin API', () => {
  it('mints tokens and updates balances', async () => {
    const response = await request(app).post('/api/token/mint').send({ wallet: 'wallet-one', amount: '100' });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.balance).toBe('100');
    expect(response.body.supply).toBe('100');
  });

  it('modifies contract metadata when signature matches', async () => {
    const modification = {
      instruction: 'UPDATE_METADATA',
      parameters: {
        field: 'symbol',
        value: 'TBV2',
        validationRules: ['max_length:10', 'alpha_numeric'],
      },
      authority: appConfig.updateAuthority,
      timestamp: Date.now(),
    };
    const signature = computeSignature(modification, appConfig.apiKey);

    const response = await request(app)
      .post('/api/contract/modify')
      .send({ ...modification, signature });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.snapshot.symbol).toBe('TBV2');
  });

  it('supports order lifecycle operations', async () => {
    const createResponse = await request(app)
      .post('/api/orders/create')
      .send({ orderType: 'LIMIT_BUY', amount: 50, price: 0.1, wallet: 'wallet-order', editable: true });
    expect(createResponse.status).toBe(200);
    const orderId = createResponse.body.order.id as string;

    const editResponse = await request(app)
      .put(`/api/orders/edit/${orderId}`)
      .send({ amount: 75 });
    expect(editResponse.status).toBe(200);
    expect(editResponse.body.order.amount).toBe(75);

    const cancelResponse = await request(app).delete(`/api/orders/cancel/${orderId}`);
    expect(cancelResponse.status).toBe(200);
    expect(cancelResponse.body.order.status).toBe('CANCELLED');

    const historyResponse = await request(app).get('/api/orders/history').query({ wallet: 'wallet-order' });
    expect(historyResponse.status).toBe(200);
    expect(Array.isArray(historyResponse.body.history)).toBe(true);
    expect(historyResponse.body.history.length).toBeGreaterThanOrEqual(3);
  });

  it('resumes failed operations from logs', async () => {
    const failedLog = await context.eventLogger.logEvent(
      'TOKEN_MINT',
      { wallet: 'resume-wallet', amount: '25' },
      'FAILED',
    );

    const resumeResponse = await request(app)
      .post('/api/events/resume')
      .send({ fromBlock: failedLog.blockNumber, fromError: true });

    expect(resumeResponse.status).toBe(200);
    expect(resumeResponse.body.summary.resumedOperations).toBeGreaterThanOrEqual(1);

    const balanceResponse = await request(app).get('/api/token/balance/resume-wallet');
    expect(balanceResponse.status).toBe(200);
    expect(balanceResponse.body.balance).toBe('25');
  });
});
