const { Connection, Keypair, clusterApiUrl } = require('@solana/web3.js');
const secret = [201,171,29,144,139,112,100,68,16,138,217,226,29,146,243,123,218,190,200,216,89,15,92,216,212,176,67,46,73,205,164,250,28,100,19,28,238,90,176,169,160,196,239,251,237,182,204,111,10,51,225,114,3,85,31,222,231,179,241,178,215,101,5,109];
const connection = new Connection(clusterApiUrl('devnet'));
const user = Keypair.fromSecretKey(Uint8Array.from(secret));
connection.getBalance(user.publicKey).then(bal => console.log('Balance:', bal/1e9));
