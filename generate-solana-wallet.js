const bip39 = require('bip39');
const { derivePath } = require('ed25519-hd-key');
const { Keypair } = require('@solana/web3.js');

// 1. Generar frase mnemónica
const mnemonic = bip39.generateMnemonic();
console.log('Frase de recuperación (mnemonic):', mnemonic);

// 2. Derivar clave privada desde la frase
const seed = bip39.mnemonicToSeedSync(mnemonic);
const path = "m/44'/501'/0'/0'"; // Solana derivation path
const derivedSeed = derivePath(path, seed.toString('hex')).key;
const keypair = Keypair.fromSeed(derivedSeed);

console.log('Clave privada (secretKey array):', Array.from(keypair.secretKey));
console.log('Dirección pública:', keypair.publicKey.toBase58());
