const express = require('express');
const { param, validationResult } = require('express-validator');
const { Connection, PublicKey } = require('@solana/web3.js');
const swaggerUi = require('swagger-ui-express');
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
    }
  }
};

const app = express();
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Endpoint balance con validación y consulta real en Solana
app.get('/api/balance/:address',
  param('address')
    .isLength({ min: 32, max: 44 })
    .withMessage('La dirección debe tener entre 32 y 44 caracteres')
    .matches(/^[1-9A-HJ-NP-Za-km-z]+$/)
    .withMessage('La dirección debe ser base58'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }
    const { address } = req.params;
    // Permitir elegir red por query param
    let network = req.query.network || 'mainnet-beta';
    if (!['mainnet-beta', 'devnet', 'testnet'].includes(network)) {
      return res.status(400).json({ error: 'Invalid network. Use mainnet-beta, devnet, or testnet.' });
    }
    try {
      const { clusterApiUrl } = require('@solana/web3.js');
      const connection = new Connection(clusterApiUrl(network));
      const publicKey = new PublicKey(address);
      const lamports = await connection.getBalance(publicKey);
      const sol = lamports / 1e9;
      res.json({ address, balance: sol, network });
    } catch (err) {
      res.status(400).json({ error: 'No se pudo consultar el balance: ' + err.message });
    }
  }
);

app.get('/api/test', (req, res) => {
  res.json({ message: 'GET recibido' });
});

app.post('/api/test', (req, res) => {
  res.json({ message: 'POST recibido', data: req.body });
});

if (require.main === module) {
  app.listen(3000, () => console.log('Servidor escuchando en puerto 3000'));
}

module.exports = app;
