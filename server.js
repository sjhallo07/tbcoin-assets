const express = require('express');
const { Connection, PublicKey } = require('@solana/web3.js');
const swaggerUi = require('swagger-ui-express');

const app = express();
app.use(express.json()); // Asegura que el body se parsea como JSON

// Constants
const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const MOCK_TRANSACTION_LIMIT = 10;

// Documentación Swagger básica
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'TB Coin API',
    version: '1.0.0',
    description: 'API para consultar balances de Solana y otras operaciones.'
  },
  paths: {
    '/api/balance/{address}': {
      get: {
        summary: 'Consulta el balance de una dirección de Solana',
        parameters: [
          {
            name: 'address',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Dirección pública de Solana'
          },
          {
            name: 'network',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['mainnet-beta', 'devnet', 'testnet'] },
            description: 'Red Solana (mainnet-beta, devnet, testnet)'
          }
        ],
        responses: {
          200: {
            description: 'Balance consultado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    address: { type: 'string' },
                    balance: { type: 'number' }
                  }
                }
              }
            }
          },
          400: {
            description: 'Error de validación o consulta',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/transfer': {
      post: {
        summary: 'Simula una transferencia de TB Coin',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  from: { type: 'string', description: 'Dirección pública del remitente' },
                  to: { type: 'string', description: 'Dirección pública del destinatario' },
                  amount: { type: 'number', description: 'Cantidad a transferir' },
                  network: { type: 'string', description: 'Red Solana (mainnet-beta, devnet, testnet)' }
                },
                required: ['from', 'to', 'amount']
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Transferencia simulada correctamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    from: { type: 'string' },
                    to: { type: 'string' },
                    amount: { type: 'number' },
                    network: { type: 'string' },
                    status: { type: 'string' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          },
          400: {
            description: 'Error de validación',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/v1/blockchain/transactions': {
      get: {
        summary: 'Get transaction data for analysis',
        parameters: [
          {
            name: 'wallet_address',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Wallet address to filter transactions'
          },
          {
            name: 'start_time',
            in: 'query',
            required: false,
            schema: { type: 'integer' },
            description: 'Start time (Unix timestamp)'
          },
          {
            name: 'end_time',
            in: 'query',
            required: false,
            schema: { type: 'integer' },
            description: 'End time (Unix timestamp)'
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', default: 1000, maximum: 10000 },
            description: 'Number of transactions to return'
          },
          {
            name: 'offset',
            in: 'query',
            required: false,
            schema: { type: 'integer', default: 0 },
            description: 'Offset for pagination'
          }
        ],
        responses: {
          200: {
            description: 'Transaction data retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    data: { type: 'array' },
                    count: { type: 'integer' }
                  }
                }
              }
            }
          },
          500: {
            description: 'Internal server error'
          }
        }
      }
    },
    '/api/v1/blockchain/wallet/{wallet_address}/behavior': {
      get: {
        summary: 'Get wallet behavior analysis',
        parameters: [
          {
            name: 'wallet_address',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Wallet address to analyze'
          }
        ],
        responses: {
          200: {
            description: 'Wallet behavior analysis retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    wallet_address: { type: 'string' },
                    behavior_metrics: { type: 'object' }
                  }
                }
              }
            }
          },
          500: {
            description: 'Internal server error'
          }
        }
      }
    },
    '/api/v1/blockchain/predict': {
      post: {
        summary: 'Make prediction using trained ML models',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  features: { type: 'object', description: 'Feature data for prediction' },
                  model_type: { type: 'string', default: 'price_movement', description: 'Type of model to use' }
                },
                required: ['features']
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Prediction made successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    prediction: { type: 'object' },
                    model_used: { type: 'string' }
                  }
                }
              }
            }
          },
          500: {
            description: 'Prediction failed'
          }
        }
      }
    },
    '/api/v1/blockchain/model/metrics': {
      get: {
        summary: 'Get current model performance metrics',
        responses: {
          200: {
            description: 'Model metrics retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    metrics: { type: 'object' }
                  }
                }
              }
            }
          },
          500: {
            description: 'Internal server error'
          }
        }
      }
    }
  }
};

// Endpoint balance
app.get('/api/balance/:address', async (req, res) => {
  const { address } = req.params;
  const { network = 'mainnet-beta' } = req.query;
  if (!address || address.length < 32 || address.length > 44) {
    return res.status(400).json({ error: 'Dirección inválida' });
  }
  try {
    const connection = new Connection(network === 'mainnet-beta' ? 'https://api.mainnet-beta.solana.com'
      : network === 'devnet' ? 'https://api.devnet.solana.com'
      : 'https://api.testnet.solana.com');
    const publicKey = new PublicKey(address);
    const balance = await connection.getBalance(publicKey);
    res.json({ address, balance: balance / 1e9 });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Endpoint transferencia simulada
app.post('/api/transfer', async (req, res) => {
  const { from, to, amount, network } = req.body;
  if (!from || !to || !amount) {
    return res.status(400).json({ error: 'from, to y amount son requeridos' });
  }
  if (!SOLANA_ADDRESS_REGEX.test(from)) {
    return res.status(400).json({ error: 'Dirección "from" inválida' });
  }
  if (!SOLANA_ADDRESS_REGEX.test(to)) {
    return res.status(400).json({ error: 'Dirección "to" inválida' });
  }
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'amount debe ser un número positivo' });
  }
  if (!['mainnet-beta', 'devnet', 'testnet'].includes(network || 'mainnet-beta')) {
    return res.status(400).json({ error: 'Invalid network. Use mainnet-beta, devnet, or testnet.' });
  }
  // Simulación de transferencia
  res.json({
    from,
    to,
    amount,
    network: network || 'mainnet-beta',
    status: 'simulated',
    message: 'Transferencia simulada correctamente'
  });
});

// Blockchain data endpoints
app.get('/api/v1/blockchain/transactions', async (req, res) => {
  try {
    const { wallet_address, start_time, end_time, limit = 1000, offset = 0 } = req.query;
    
    // Validate limit
    const parsedLimit = Math.min(parseInt(limit) || 1000, 10000);
    const parsedOffset = parseInt(offset) || 0;
    
    // Mock transaction data for demonstration
    const transactions = [];
    for (let i = 0; i < Math.min(MOCK_TRANSACTION_LIMIT, parsedLimit); i++) {
      transactions.push({
        signature: `mock_signature_${i + parsedOffset}`,
        block_time: Date.now() / 1000 - i * 3600,
        slot: 100000 + i,
        fee: 5000,
        status: 'confirmed',
        wallet_address: wallet_address || 'mock_wallet_address'
      });
    }
    
    res.json({
      status: 'success',
      data: transactions,
      count: transactions.length
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/v1/blockchain/wallet/:wallet_address/behavior', async (req, res) => {
  try {
    const { wallet_address } = req.params;
    
    // Validate wallet address
    if (!SOLANA_ADDRESS_REGEX.test(wallet_address)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }
    
    // Mock behavior analysis data
    const behavior_data = {
      transaction_count: 150,
      avg_transaction_size: 0.5,
      total_volume: 75.0,
      active_days: 45,
      first_seen: Date.now() / 1000 - 90 * 24 * 3600,
      last_seen: Date.now() / 1000 - 3600,
      risk_score: 0.15,
      behavior_pattern: 'regular_trader'
    };
    
    res.json({
      status: 'success',
      wallet_address: wallet_address,
      behavior_metrics: behavior_data
    });
  } catch (error) {
    console.error('Error analyzing wallet behavior:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/v1/blockchain/predict', async (req, res) => {
  try {
    const { features, model_type = 'price_movement' } = req.body;
    
    if (!features || typeof features !== 'object' || Array.isArray(features) || features === null) {
      return res.status(400).json({ error: 'Features object is required' });
    }
    
    // Mock prediction data
    const prediction = {
      predicted_value: 0.85,
      confidence: 0.92,
      timestamp: Date.now() / 1000,
      model_version: '1.0.0'
    };
    
    res.json({
      status: 'success',
      prediction: prediction,
      model_used: model_type
    });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ error: 'Prediction failed' });
  }
});

app.get('/api/v1/blockchain/model/metrics', async (req, res) => {
  try {
    // Mock model metrics
    const metrics = {
      accuracy: 0.87,
      precision: 0.85,
      recall: 0.89,
      f1_score: 0.87,
      last_updated: Date.now() / 1000,
      model_version: '1.0.0',
      training_samples: 10000
    };
    
    res.json({
      status: 'success',
      metrics: metrics
    });
  } catch (error) {
    console.error('Error fetching model metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

if (require.main === module) {
  app.listen(3000, () => console.log('Servidor escuchando en puerto 3000'));
}

module.exports = app;
