const bip39 = require('bip39');
const ed25519 = require('ed25519-hd-key');
const { Keypair } = require('@solana/web3.js');

async function main() {
  const mnemonic = bip39.generateMnemonic();
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const derivedSeed = ed25519.derivePath("m/44'/501'/0'/0'", seed.toString('hex')).key;
  const keypair = Keypair.fromSeed(derivedSeed);

  console.log('Frase de recuperación (mnemonic):', mnemonic);
  console.log('Clave privada (secretKey array):', Array.from(keypair.secretKey));
  console.log('Dirección pública:', keypair.publicKey.toBase58());
}

main();
