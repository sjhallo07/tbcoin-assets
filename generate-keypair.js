const { Keypair } = require('@solana/web3.js');
const kp = Keypair.generate();
console.log(JSON.stringify(Array.from(kp.secretKey)));
