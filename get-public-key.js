// Usage: node get-public-key.js '[secretKeyArray]'
// Example: node get-public-key.js '[71,156,29,83,...]'

const { Keypair } = require('@solana/web3.js');

const input = process.argv[2];
if (!input) {
  console.error('Usage: node get-public-key.js "[secretKeyArray]"');
  process.exit(1);
}
const secretKey = Uint8Array.from(JSON.parse(input));
const keypair = Keypair.fromSecretKey(secretKey);
console.log('Public Key:', keypair.publicKey.toBase58());
