const express = require('express');
const { Connection, PublicKey } = require('@solana/web3.js');
const swaggerUi = require('swagger-ui-express');

const app = express();
app.use(express.json()); // Asegura que el body se parsea como JSON

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
  const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  if (!from || !to || !amount) {
    return res.status(400).json({ error: 'from, to y amount son requeridos' });
  }
  if (!solanaRegex.test(from)) {
    return res.status(400).json({ error: 'Dirección "from" inválida' });
  }
  if (!solanaRegex.test(to)) {
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

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

if (require.main === module) {
  app.listen(3000, () => console.log('Servidor escuchando en puerto 3000'));
}

module.exports = app;
