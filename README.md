## Solscan: Viewing Transactions and Balances

### English
You can view your real blockchain transactions and balances on Solscan for different Solana networks:

- **Devnet:** https://solscan.io/?cluster=devnet
- **Mainnet:** https://solscan.io/
- **Testnet:** https://solscan.io/?cluster=testnet

Just enter your wallet, mint, or token account address in the search bar. Only real blockchain operations (mint, transfer, create account) will appear. Automated API tests do not show up here.

### Español
Puedes ver tus transacciones y balances reales en Solscan para diferentes redes de Solana:

- **Devnet:** https://solscan.io/?cluster=devnet
- **Mainnet:** https://solscan.io/
- **Testnet:** https://solscan.io/?cluster=testnet

Solo ingresa la dirección pública de tu wallet, mint o cuenta de token en la barra de búsqueda. Solo las operaciones reales en la blockchain (minteo, transferencia, creación de cuenta) aparecerán. Las pruebas automatizadas de la API no se muestran aquí.

# TB Coin Assets API

## English

### Overview
This project provides a REST API for interacting with Solana blockchain assets, including:
- Querying balances for Solana addresses
- Token minting, metadata, and transfers (via scripts)
- Automated validation and security
- API documentation with Swagger

### Features
- **GET /api/balance/:address**: Returns the SOL balance for any Solana address
- **POST/GET /api/test**: Simple test endpoints for integration
- **Swagger docs**: Available at `/api-docs` for interactive API documentation
- **Validation**: All inputs are validated using express-validator
- **Security**: Private keys are never exposed; only used in local scripts
- **Blockchain integration**: Uses @solana/web3.js for real-time blockchain queries
- **Scalability**: Database recommendations included (MongoDB, PostgreSQL, SQLite)
- **Authentication**: JWT example ready for user/session protection

### Setup
1. Install dependencies:
   ```sh
   npm install
   ```
2. Start the server:
   ```sh
   node server.js
   ```
3. Access Swagger docs at [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

### Example Usage
**Query balance:**
```sh
curl http://localhost:3000/api/balance/YourSolanaAddress
```

### Security
- All sensitive keys are stored in `.env` and never exposed in endpoints
- Input validation prevents malformed requests
- For HTTPS, deploy on Heroku, Vercel, or use Nginx locally

### Blockchain Integration
- Uses @solana/web3.js for all blockchain operations
- Scripts for minting, metadata, and transfers included

### Documentation
- Interactive API docs: `/api-docs`
- Example requests in this README

### Scalability
- Recommended databases: MongoDB, PostgreSQL, SQLite (see `DATABASE.md`)
- JWT authentication ready for user/session protection

---

## Español

### Descripción
Este proyecto provee una API REST para interactuar con activos en la blockchain Solana, incluyendo:
- Consulta de balances para direcciones de Solana
- Scripts para minteo, metadatos y transferencias de tokens
- Validación y seguridad automatizada
- Documentación interactiva con Swagger

### Funcionalidades
- **GET /api/balance/:address**: Devuelve el balance SOL de cualquier dirección de Solana
- **POST/GET /api/test**: Endpoints de prueba para integración
- **Swagger docs**: Disponible en `/api-docs` para documentación interactiva
- **Validación**: Todos los datos recibidos se validan con express-validator
- **Seguridad**: Las claves privadas nunca se exponen; solo se usan en scripts locales
- **Integración blockchain**: Usa @solana/web3.js para consultas en tiempo real
- **Escalabilidad**: Recomendaciones de base de datos incluidas (MongoDB, PostgreSQL, SQLite)
- **Autenticación**: Ejemplo de JWT listo para protección de usuarios/sesiones

### Instalación
1. Instala las dependencias:
   ```sh
   npm install
   ```
2. Inicia el servidor:
   ```sh
   node server.js
   ```
3. Accede a la documentación Swagger en [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

### Ejemplo de uso
**Consultar balance:**
```sh
curl http://localhost:3000/api/balance/TuDireccionSolana
```

### Seguridad
- Todas las claves sensibles se guardan en `.env` y nunca se exponen en endpoints
- La validación de datos previene solicitudes malformadas
- Para HTTPS, despliega en Heroku, Vercel o usa Nginx localmente

### Integración Blockchain
- Usa @solana/web3.js para todas las operaciones blockchain
- Incluye scripts para minteo, metadatos y transferencias

### Documentación
- Documentación interactiva: `/api-docs`
- Ejemplos de uso en este README

### Escalabilidad
- Bases de datos recomendadas: MongoDB, PostgreSQL, SQLite (ver `DATABASE.md`)
- Autenticación JWT lista para protección de usuarios/sesiones

---

### Authors / Autores
- sjhallo07
- Marcos Mora

---

For more details, see the code comments and Swagger docs. / Para más detalles, revisa los comentarios en el código y la documentación Swagger.

```ts
const source = `
    query myQuery($address: String!) {
        account(address: $address) {
            data(encoding: BASE_64)
        }
    }
`;

const variableValues = {
    address: 'CcYNb7WqpjaMrNr7B1mapaNfWctZRH7LyAjWRLBGt1Fk',
};

const result = await rpcGraphQL.query(source, variableValues);
```

```
data: {
    account: {
        data: 'dGVzdCBkYXRh',
    },
}
```

### Querying Specific Account Types

A set of specific parsed account types are supported in GraphQL.

- `GenericAccount`: A generic base account type
- `NonceAccount`: A nonce account
- `LookupTableAccount`: An address lookup table account
- `MintAccount`: An SPL mint
- `TokenAccount`: An SPL token account
- `StakeAccount`: A stake account
- `VoteAccount`: A vote account

You can choose how to handle querying of specific account types. For example,
you might _only_ want specifically any account that matches `MintAccount`.

```ts
const maybeMintAddresses = [
    'J7iup799j5BVjKXACZycYef7WQ4x1wfzhUsc5v357yWQ',
    'JAbWqZ7S2c6jomQr8ofAYBo257bE1QJtHwbX1yWc2osZ',
    '2AQ4CSNu6zNUZsUq4aLNUSjyrLv4qFFXQuKs5RTHbg2Y',
    'EVW3CoyogapBfQxBFFEKGMM1bn3JyoFiqkAJdw3FHX1b',
];

const mintAccounts = [];

const source = `
    query myQuery($address: String!) {
        account(address: $address) {
            ... on MintAccount {
                data {
                    decimals
                    isInitialized
                    mintAuthority
                    supply
                }
            }
        }
    }
`;

for (const address of maybeMintAddresses) {
    const result = await rpcGraphQL.query(source, { address });
    if (result != null) {
        const {
            data: {
                account: { data: mintInfo },
            },
        } = result;
        mintAccounts.push(mintInfo);
    }
}
```

Maybe you want to handle both mints _and_ token accounts.

```ts
const mintOrTokenAccountAddresses = [
    'J7iup799j5BVjKXACZycYef7WQ4x1wfzhUsc5v357yWQ',
    'JAbWqZ7S2c6jomQr8ofAYBo257bE1QJtHwbX1yWc2osZ',
    '2AQ4CSNu6zNUZsUq4aLNUSjyrLv4qFFXQuKs5RTHbg2Y',
    'EVW3CoyogapBfQxBFFEKGMM1bn3JyoFiqkAJdw3FHX1b',
];

const mintAccounts = [];
const tokenAccounts = [];

const source = `
    query myQuery($address: String!) {
        account(address: $address) {
            ... on MintAccount {
                __typename
                decimals
                isInitialized
                supply
            }
            ... on TokenAccount {
                __typename
                isNative
                mint
                state
            }
        }
    }
`;

for (const address of mintOrTokenAccountAddresses) {
    const result = await rpcGraphQL.query(source, { address });
    if (result != null) {
        const {
            data: { account: accountParsedData },
        } = result;
        if (accountParsedData.__typename === 'MintAccount') {
            mintAccounts.push(accountParsedInfo);
        } else {
            tokenAccounts.push(accountParsedInfo);
        }
    }
}
```

### Querying Program Accounts

Another account-based query that can be performed with RPC-GraphQL is the
`programAccounts` query. The response will be a list of `Account` types as
defined above.

```ts
const source = `
    query myQuery($programAddress: String!) {
        programAccounts(programAddress: $address) {
            executable
            lamports
        }
    }
`;

const variableValues = {
    programAddress: 'AmtpVzo6H6qQCP9dH9wfu5hfa8kKaAFpTJ4aamPYR6V6',
};

const result = await rpcGraphQL.query(source, variableValues);
```

```
data: {
    programAccounts: [
        {
            executable: false,
            lamports: 10290815n,
        },
        {
            executable: false,
            lamports: 10290815n,
        },
        /* .. */
    ]
}
```

Account data encoding in `base58`, `base64`, and `base64+zstd` is also
supported with this query, as well as `dataSlice` and `filter`.

```ts
const source = `
    query myQuery($programAddress: String!) {
        programAccounts(programAddress: $programAddress) {
            data(encoding: BASE_64, dataSlice: { length: 5, offset: 0 })
        }
    }
`;

const variableValues = {
    programAddress: 'DXngmJfjurhnAwbMPgpUGPH6qNvetCKRJ6PiD4ag4PTj',
};

const result = await rpcGraphQL.query(source, variableValues);
```

```
data: {
    programAccounts: [
        {
            data: 'dGVzdCA=',
        },
        /* .. */
    ],
}
```

Although specific parsed account types are directly tied to the program which
owns them, it's still possible to handle various specific account types within
the same program accounts response.

```ts
const source = `
    query myQuery($programAddress: String!) {
        programAccounts(programAddress: $address) {
            ... on MintAccount {
                __typename
                decimals
                isInitialized
                mintAuthority
                supply
            }
            ... on TokenAccount {
                __typename
                isNative
                mint
                owner
                state
            }
        }
    }
`;

const variableValues = {
    programAddress: 'AmtpVzo6H6qQCP9dH9wfu5hfa8kKaAFpTJ4aamPYR6V6',
};

const result = await rpcGraphQL.query(source, variableValues);

const { mints, tokenAccounts } = result.data.programAccounts.reduce(
    (acc: { mints: any[]; tokenAccounts: any[] }, account) => {
        if (account.__typename === 'MintAccount') {
            acc.mints.push(accountParsedInfo);
        } else {
            acc.tokenAccounts.push(accountParsedInfo);
        }
        return acc;
    },
    { mints: [], tokenAccounts: [] },
);
```

### Nested Account Queries

Notice the `owner` field of the `Account` interface is also an `Account`
interface. This powers nested queries against the `owner` field of an account.

```ts
const source = `
    query myQuery($address: String!) {
        account(address: $address) {
            address
            owner {
                address
                executable
                lamports
            }
        }
    }
`;

const variableValues = {
    address: 'AyGCwnwxQMCqaU4ixReHt8h5W4dwmxU7eM3BEQBdWVca',
};

const result = await rpcGraphQL.query(source, variableValues);
```

```
data: {
    account: {
        address: 'AyGCwnwxQMCqaU4ixReHt8h5W4dwmxU7eM3BEQBdWVca',
        owner: {
            address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
            executable: true,
            lamports: 10290815n,
        },
    },
}
```

As you can see, simply defining a nested query with RPC-GraphQL will augment
the multiple RPC calls and parsing code required to gather the necessary
information!

You can nest queries as far as you want!

```ts
const source = `
    query myQuery($address: String!) {
        account(address: $address) {
            address
            owner {
                address
                owner {
                    address
                    owner {
                        address
                    }
                }
            }
        }
    }
`;

const variableValues = {
    address: 'AyGCwnwxQMCqaU4ixReHt8h5W4dwmxU7eM3BEQBdWVca',
};

const result = await rpcGraphQL.query(source, variableValues);
```

```
data: {
    account: {
        address: 'AyGCwnwxQMCqaU4ixReHt8h5W4dwmxU7eM3BEQBdWVca',
        owner: {
            address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
            owner: {
                address: 'BPFLoader2111111111111111111111111111111111',
                owner: {
                    address: 'NativeLoader1111111111111111111111111111111',
                },
            },
        },
    },
}
```

Nested queries can also be applied to specific account types.

```ts
const source = `
    query myQuery($address: String!) {
        account(address: $address) {
            ... on MintAccount {
                address
                data {
                    mintAuthority {
                        address
                        lamports
                    }
                }
            }
        }
    }
`;

const variableValues = {
    address: 'AyGCwnwxQMCqaU4ixReHt8h5W4dwmxU7eM3BEQBdWVca',
};

const result = await rpcGraphQL.query(source, variableValues);
```

```
data: {
    account: {
        address: 'AyGCwnwxQMCqaU4ixReHt8h5W4dwmxU7eM3BEQBdWVca',
        data: {
            mintAuthority: {
                address: 'DpfJkNonoVB3sor9H9ceajhex4XHVPrDAGAq2ahdG4JZ',
                lamports: 10290815n,
            }
        },
    },
}
```

Nested account queries are also supported on `programAccounts` queries.

## Transactions

The `Transaction` type contains common fields across all transactions.

```graphql
type Transaction {
    blockTime: BigInt
    data(encoding: TransactionEncoding!): String
    message: TransactionMessage
    meta: TransactionMeta
    signatures: [Signature]
    slot: Slot
    version: String
}
```

Note that unlike accounts, the `Transaction` type is not an interface, so the
base response type of a transaction query remains constant. However, the list
of instructions contained in a parsed transaction are returned as the
`TransactionInstruction` interface, which can be queried by specific type.
See [Querying Specific Transaction Instruction Types](#querying-specific-transaction-instruction-types).

```graphql
interface TransactionInstruction {
    programId: Address
}
```

A transaction can be queried by the `transaction` query.

```ts
const source = `
    query myQuery($signature: String!) {
        transaction(signature: $signature) {
            blockTime
            meta {
                computeUnitsConsumed
                logMessages
            }
            slot
        }
    }
`;

const variableValues = {
    signature: '63zkpxATgAwXRGFQZPDESTw2m4uZQ99sX338ibgKtTcgG6v34E3MSS3zckCwJHrimS71cvei6h1Bn1K1De53BNWC',
};

const result = await rpcGraphQL.query(source, variableValues);
```

```
data: {
    transaction: {
        blockTime: 230860412n,
        meta: {
            computeUnitsConsumed: 120000n,
            logMessages: [
                "Program 8tfDNiaEyrV6Q1U4DEXrEigs9DoDtkugzFbybENEbCDz invoke [1]",
                "Program 8tfDNiaEyrV6Q1U4DEXrEigs9DoDtkugzFbybENEbCDz consumed 2164 of 452155 compute units",
                "Program 8tfDNiaEyrV6Q1U4DEXrEigs9DoDtkugzFbybENEbCDz success",
                "Program ComputeBudget111111111111111111111111111111 invoke [1]",
                "Program ComputeBudget111111111111111111111111111111 success"
            ]
        },
        slot: 230860693n,
    },
}
```

### Querying Transaction Data

Querying encoded transaction data (`base58`, `base64`) is fully supported.

```ts
const source = `
    query myQuery($signature: String!, $commitment: Commitment) {
        transaction(signature: $signature, commitment: $commitment) {
            data(encoding: BASE_64)
        }
    }
`;

const variableValues = {
    signature: '63zkpxATgAwXRGFQZPDESTw2m4uZQ99sX338ibgKtTcgG6v34E3MSS3zckCwJHrimS71cvei6h1Bn1K1De53BNWC',
    commitment: 'confirmed',
};

const result = await rpcGraphQL.query(source, variableValues);
```

```
{
  "data": {
    "transaction": {
      "data": "AbgFjqLTBtoAaHXexSN1OYXf+UNox6qe3JcyCmEwE57iUHxCkHp8zKTJVznd6nLtUFNMYJWHCtMb+yPjk7QIxAQBAAEDeXJtpS2Z1gsH6tc7L28L9gg8yFx3qU401pHXj4vK/skUvD7y/LnapfCdSx3FfTguy49UDQVvGgOK0ix/P42YuAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA5uE0ATTHEABQrIB1+aoEdYJxvQthXPLHFxSH2y+ACK4BAgIAAQwCAAAAAMqaOwAAAAA="
    }
  }
}
```

### Querying Specific Transaction Instruction Types

As mentioned above, parsed transactions return a list of instructions that
implement the `TransactionInstruction` interface. These instructions can be
queried by specific instruction types.

Instructions for the following programs are supported.

- Address Lookup Table
- BPF Loader
- BPF Upgradeable Loader
- Stake
- SPL Associated Token
- SPL Memo
- SPL Token
- System
- Vote

Additionally, the `GenericInstruction` type is the base parsed instruction type.

```graphql
type GenericInstruction implements TransactionInstruction {
    accounts: [Address]
    data: Base64EncodedBytes
    programId: Address
}
```

Specific transaction instruction types can be queried within a `Transaction`
response like so.

```ts
const source = `
    query myQuery($signature: String!, $commitment: Commitment) {
        transaction(signature: $signature, commitment: $commitment) {
            message {
                instructions {
                    ... on CreateAccountInstruction {
                        lamports
                        programId
                        space
                    }
                }
            }
        }
    }
`;

const variableValues = {
    signature: '63zkpxATgAwXRGFQZPDESTw2m4uZQ99sX338ibgKtTcgG6v34E3MSS3zckCwJHrimS71cvei6h1Bn1K1De53BNWC',
    commitment: 'confirmed',
};

const result = await rpcGraphQL.query(source, variableValues);
```

```
data: {
    transaction: {
        message: {
            instructions: [
                {
                    lamports: 890880n,
                    programId: '11111111111111111111111111111111',
                    space: 0n,
                },
                /* .. */
            ]
        },
    },
}
```

### Nested Transaction Queries

Since transactions have a relatively large number of data points, they are
particularly useful for nested queries!

Similar to nested querying accounts, it's possible to nest queries inside your
transaction queries to look up other objects, such as accounts, as they appear
in the transaction response.

```ts
const source = `
    query myQuery($signature: String!, $commitment: Commitment) {
        transaction(signature: $signature, commitment: $commitment) {
            message {
                instructions {
                    ... on SplTokenTransferInstruction {
                        amount
                        authority {
                            # Account
                            address
                            lamports
                        }
                        destination {
                            # Account
                            ... on TokenAccount {
                                address
                                mint {
                                    ... on MintAccount {
                                        # Account
                                        address
                                        decimals
                                    }
                                }
                                owner {
                                    # Account
                                    address
                                    lamports
                                }
                            }
                        }
                        source {
                            # Account
                            ... on TokenAccount {
                                address
                                mint {
                                    ... on MintAccount {
                                        # Account
                                        address
                                        decimals
                                    }
                                }
                                owner {
                                    # Account
                                    address
                                    lamports
                                }
                            }
                        }
                    }
                }
            }
        }
    }
`;

const variableValues = {
    signature: '63zkpxATgAwXRGFQZPDESTw2m4uZQ99sX338ibgKtTcgG6v34E3MSS3zckCwJHrimS71cvei6h1Bn1K1De53BNWC',
    commitment: 'confirmed',
};

const result = await rpcGraphQL.query(source, variableValues);
```

```
data: {
    transaction: {
        message: {
            instructions: [
                {
                    amount: '50',
                    authority: {
                        address: 'AHPPMhzDQix9sKULBqeaQ5BUZgrKdz8tg6DzPxsofB12',
                        lamports: 890880n,
                    },
                    destination: {
                        address: '2W8mUY75zxqwAcpirn75r3Cc7TStMirFyHwKqo13fmB1',
                        mint: {
                            address: '8poKMotB2cEYVv5sbjrdyssASZj1vwYCe7GJFeXo2QP7',
                            decimals: 6,
                        },
                        owner: {
                            address: '7tRxJ2znbTFpwW9XaMMiDsXDudoPEUXRcpDpm8qjWgAZ',
                            lamports: 890880n,
                        }
                    },
                    source: {
                        address: 'BqFCPqXUm4cq6jaZZx1TDTvUR1wdEuNNwAHBEVR6mJhM',
                        mint: {
                            address: '8poKMotB2cEYVv5sbjrdyssASZj1vwYCe7GJFeXo2QP7',
                            decimals: 6,
                        },
                        owner: {
                            address: '3dPmVLMD7PC5faZNyJUH9WFrUxAsbjydJfoozwmR1wDG',
                            lamports: e890880n,
                        }
                    }
                },
                /* .. */
            ]
        }
    }
}
```

## Blocks

The `Block` type contains common fields across all blocks.

```graphql
type Block {
    blockhash: String
    blockHeight: BigInt
    blockTime: BigInt
    parentSlot: Slot
    previousBlockhash: String
    rewards: [Reward]
    signatures: [Signature]
    transactions: [Transaction]
}
```

Just like the `programAccounts` query will return a list of `Account` types, on
which you can perform many operations, the `block` query will return a list of
`Transaction` types, however blocks also contain their own high-level data
fields, such as `blockhash` and `blockTime`.

```ts
const source = `
    query myQuery($slot: BigInt!, $commitment: Commitment) {
        block(slot: $slot, commitment: $commitment) {
            blockHeight
            blockhash
            parentSlot
            rewards {
                commission
                lamports
                rewardType
            }
            transactions {
                message {
                    instructions {
                        ... on CreateAccountInstruction {
                            lamports
                            programId
                            space
                        }
                    }
                }
            }
        }
    }
`;

const variableValues = {
    slot: 43596n,
    commitment: 'confirmed',
};

const result = await rpcGraphQL.query(source, variableValues);
```

```
data: {
    block: {
        blockHeight: 196758578n,
        blockhash: 'BqFCPqXUm4cq6jaZZx1TDTvUR1wdEuNNwAHBEVR6mJhM',
        parentSlot: 230862408n,
        rewards: [
            {
                commission: 0.05,
                lamports: 58578n,
                rewardType: 'Staking',
            },
            {
                commission: 0.05,
                lamports: 58578n,
                rewardType: 'Staking',
            }
        ],
        transactions: [
            {
                message: {
                    instructions: [
                        {
                            lamports: 890880n,
                            programId: '11111111111111111111111111111111',
                            space: 0n,
                        },
                        /* .. */
                    ]
                },
            }
        ],
    },
}
```

# RPC Optimizations

RPC-GraphQL ships highly-optimized use of the Solana JSON RPC out of the box,
so developers can focus on building dynamic web applications without worrying
about abusing their RPC endpoint.

The resolver leverages query inspection before making any requests to the RPC,
in order to determine the most resource-conservative way to vend to your
application the requested response.

This results in four main benefits:

- Caching
- Request coalescing
- Minimized network payloads
- Batch loading

## Caching

Caching is a fairly standard part of any good GraphQL library, and
`@solana/rpc-graphql` makes no exception.

If a query contains fetches for the same resource, the resolver can simply
fetch this information from the cache, ensuring no duplicate RPC requests
are ever made.

For example, if we were to query for a `MintAccount` and the `mintAuthority`
also happened to be the mint itself, the following query would ensure we only
fetch this account once.

```graphql
query {
    account(address: "J7iup799j5BVjKXACZycYef7WQ4x1wfzhUsc5v357yWQ") {
        lamports
        data(encoding: BASE_64)
        ... on MintAccount {
            mintAuthority {
                lamports
                data(encoding: BASE_64)
            }
        }
    }
}
```

## Request Coalescing

Sometimes more than one request can be coalesced into the same request, again
saving on network round-trips.

In the example below, we're making two queries for the same account, but
different fields.

```graphql
query {
    account(address: "J7iup799j5BVjKXACZycYef7WQ4x1wfzhUsc5v357yWQ") {
        lamports
        space
    }
    account(address: "J7iup799j5BVjKXACZycYef7WQ4x1wfzhUsc5v357yWQ") {
        ... on NonceAccount {
            authority {
                address
            }
            blockhash
            feeCalculator {
                lamportsPerSignature
            }
        }
    }
}
```

Rather than requesting this account twice, the resolver will combine these
two queries into the same RPC request, and then split the response out to the
corresponding query results.

## Minimized Network Payloads

When it comes to retrieving data from an RPC endpoint, fetching more
information than you need can be a significant waste of network resources, and
even impact application performance.

The RPC-GraphQL resolver takes steps to minimize this network overhead based on
the contents of the query provided.

For example, in the following `account` query, we're going to request multiple
responses for `base64` encoded data on the same account.

```graphql
query {
    account(address: "J7iup799j5BVjKXACZycYef7WQ4x1wfzhUsc5v357yWQ") {
        firstEightBytes: data(encoding: BASE_64, dataSlice: { length: 8, offset: 0 })
        nextEightBytes: data(encoding: BASE_64, dataSlice: { length: 8, offset: 8 })
        anotherEightBytes: data(encoding: BASE_64, dataSlice: { length: 8, offset: 16 })
    }
}
```

To gather this information, a developer may elect for one of two solutions:

1. Call the RPC three times with each data slice. This will result in `3n`
   requests where `n` is the number of times your application may invoke this
   query.
2. Call the RPC once for the data, convert from `base64` to raw bytes, slice
   the raw bytes, then encode each subset back to `base64`. This requires a lot
   of overhead on application development.

RPC-GraphQL will perform solution two for you automatically, choosing to save
on network calls and bytes over the wire in favor of slicing the returned data
locally.

In fact, the resolver will minimize bytes over the wire by only requesting the
specific slice of the data that encompasses all requested data slices. In the
above example, we've requested three ranges of data:

- `0` - `8`
- `8` - `16`
- `16` - `24`

If this account has a massive amount of data, fetching more than the query asks
for would be wasteful. The resolver will only fetch `0` - `24` and slice the
response to serve the requested query.

## Batch Loading

In some cases, the Solana JSON RPC offers batch loading for certain data types.
One such example is the RPC methods `getAccountInfo` and `getMultipleAccounts`.

As one might predict, whenever multiple accounts are requested with parameters
that can be coalesced, one single call to `getMultipleAccounts` can be made.

In the example above from [Request Coalescing](#request-coalescing), let's
simply change the query to request two different accounts.

```graphql
query {
    account(address: "J7iup799j5BVjKXACZycYef7WQ4x1wfzhUsc5v357yWQ") {
        lamports
        space
    }
    account(address: "EVW3CoyogapBfQxBFFEKGMM1bn3JyoFiqkAJdw3FHX1b") {
        ... on NonceAccount {
            authority {
                address
            }
            blockhash
            feeCalculator {
                lamportsPerSignature
            }
        }
    }
}
```

Now the resolver would recognize the distinction between the two accounts, but
it would still see the ability to coalesce request parameters. As a result,
RPC-GraphQL would make one call to `getMultipleAccounts` as follows.

```ts
rpc.getMultipleAccounts([
    'J7iup799j5BVjKXACZycYef7WQ4x1wfzhUsc5v357yWQ',
    'EVW3CoyogapBfQxBFFEKGMM1bn3JyoFiqkAJdw3FHX1b',
]);
```

This batch loading can work in conjunction with the other forms of
optimization as well, such as minimized network payloads.

```graphql
query {
    account(address: "J7iup799j5BVjKXACZycYef7WQ4x1wfzhUsc5v357yWQ") {
        data(encoding: BASE_64, dataSlice: { length: 32, offset: 0 })
    }
    account(address: "EVW3CoyogapBfQxBFFEKGMM1bn3JyoFiqkAJdw3FHX1b") {
        authorityData: data(encoding: BASE_64, dataSlice: { length: 32, offset: 0 })
        u64Data: data(encoding: BASE_64, dataSlice: { length: 8, offset: 32 })
    }
}
```

```ts
rpc.getMultipleAccounts(
    ['J7iup799j5BVjKXACZycYef7WQ4x1wfzhUsc5v357yWQ', 'EVW3CoyogapBfQxBFFEKGMM1bn3JyoFiqkAJdw3FHX1b'],
    {
        encoding: 'base64',
        dataSlice: { length: 40, offset: 0 },
    },
);
```

In this case the resolver would ensure the proper data slices are dealt out
from the single `getMultipleAccounts` response.
