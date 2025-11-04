const request = require('supertest');
const app = require('./server');

describe('Blockchain Data API Endpoints', () => {
  describe('GET /api/v1/blockchain/transactions', () => {
    it('should return transaction data with default parameters', async () => {
      const response = await request(app).get('/api/v1/blockchain/transactions');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('count');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return transaction data with wallet_address filter', async () => {
      const testAddress = '7uQpQwQh1Jv1QwQh1Jv1QwQh1Jv1QwQh1Jv1QwQh1Jv1';
      const response = await request(app).get(`/api/v1/blockchain/transactions?wallet_address=${testAddress}`);
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should respect limit and offset parameters', async () => {
      const response = await request(app).get('/api/v1/blockchain/transactions?limit=5&offset=10');
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should enforce maximum limit of 10000', async () => {
      const response = await request(app).get('/api/v1/blockchain/transactions?limit=20000');
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(10);
    });
  });

  describe('GET /api/v1/blockchain/wallet/:wallet_address/behavior', () => {
    it('should return wallet behavior analysis for valid address', async () => {
      const testAddress = '7uQpQwQh1Jv1QwQh1Jv1QwQh1Jv1QwQh1Jv1QwQh1Jv1';
      const response = await request(app).get(`/api/v1/blockchain/wallet/${testAddress}/behavior`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('wallet_address', testAddress);
      expect(response.body).toHaveProperty('behavior_metrics');
      expect(response.body.behavior_metrics).toHaveProperty('transaction_count');
      expect(response.body.behavior_metrics).toHaveProperty('risk_score');
    });

    it('should return error for invalid wallet address', async () => {
      const response = await request(app).get('/api/v1/blockchain/wallet/invalid/behavior');
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/blockchain/predict', () => {
    it('should return prediction for valid features', async () => {
      const response = await request(app)
        .post('/api/v1/blockchain/predict')
        .send({
          features: {
            price: 100,
            volume: 1000,
            volatility: 0.5
          },
          model_type: 'price_movement'
        });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('prediction');
      expect(response.body).toHaveProperty('model_used', 'price_movement');
      expect(response.body.prediction).toHaveProperty('predicted_value');
      expect(response.body.prediction).toHaveProperty('confidence');
    });

    it('should use default model_type if not provided', async () => {
      const response = await request(app)
        .post('/api/v1/blockchain/predict')
        .send({
          features: { price: 100 }
        });
      expect(response.status).toBe(200);
      expect(response.body.model_used).toBe('price_movement');
    });

    it('should return error if features are missing', async () => {
      const response = await request(app)
        .post('/api/v1/blockchain/predict')
        .send({});
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return error if features is not an object', async () => {
      const response = await request(app)
        .post('/api/v1/blockchain/predict')
        .send({ features: 'invalid' });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return error if features is an array', async () => {
      const response = await request(app)
        .post('/api/v1/blockchain/predict')
        .send({ features: [1, 2, 3] });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return error if features is null', async () => {
      const response = await request(app)
        .post('/api/v1/blockchain/predict')
        .send({ features: null });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/v1/blockchain/model/metrics', () => {
    it('should return model performance metrics', async () => {
      const response = await request(app).get('/api/v1/blockchain/model/metrics');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('metrics');
      expect(response.body.metrics).toHaveProperty('accuracy');
      expect(response.body.metrics).toHaveProperty('precision');
      expect(response.body.metrics).toHaveProperty('recall');
      expect(response.body.metrics).toHaveProperty('f1_score');
      expect(response.body.metrics).toHaveProperty('model_version');
    });

    it('should return numeric metrics', async () => {
      const response = await request(app).get('/api/v1/blockchain/model/metrics');
      expect(response.status).toBe(200);
      expect(typeof response.body.metrics.accuracy).toBe('number');
      expect(typeof response.body.metrics.precision).toBe('number');
      expect(typeof response.body.metrics.recall).toBe('number');
      expect(typeof response.body.metrics.f1_score).toBe('number');
    });
  });
});
