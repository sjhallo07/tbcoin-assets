import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { Keypair } from '@solana/web3.js';

// 1. Generar frase mnemónica
const mnemonic = generateMnemonic();
console.log('Frase de recuperación (mnemonic):', mnemonic);

// 2. Derivar clave privada desde la frase
const seed = mnemonicToSeedSync(mnemonic);
const path = "m/44'/501'/0'/0'"; // Solana derivation path
const derivedSeed = derivePath(path, seed.toString('hex')).key;
const keypair = Keypair.fromSeed(derivedSeed);

console.log('Clave privada (secretKey array):', Array.from(keypair.secretKey));
console.log('Dirección pública:', keypair.publicKey.toBase58());
