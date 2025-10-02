const request = require('supertest');
const app = require('./server');

describe('GET /api/balance/:address', () => {
  it('should return balance for a valid address', async () => {
    // Reemplaza por una dirección válida de Solana para pruebas
    const testAddress = '7uQpQwQh1Jv1QwQh1Jv1QwQh1Jv1QwQh1Jv1QwQh1Jv1';
    const response = await request(app).get(`/api/balance/${testAddress}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('balance');
  });

  it('should return error for invalid address', async () => {
    const response = await request(app).get('/api/balance/invalidaddress');
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should return balance for a valid address with network query', async () => {
    const address = '2upvUrj31kyhmya7HJBTJVpFz2RtE2nXTwPr8vwHCHgY';
    const response = await request(app).get(`/api/balance/${address}?network=devnet`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('balance');
  });
});
