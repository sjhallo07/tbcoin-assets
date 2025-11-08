import "dotenv/config";
import {
  getKeypairFromEnvironment,
  getExplorerLink,
} from "@solana-developers/helpers";
import {
  Connection,
  clusterApiUrl,
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  createInitializeMintInstruction,
} from "@solana/spl-token";
import { MintLayout } from "@solana/spl-token";

// Permitir elegir red por argumento CLI o endpoint personalizado
const networkOrEndpoint = process.argv[2] || "devnet";
let connection: Connection;
if (["devnet", "testnet", "mainnet-beta"].includes(networkOrEndpoint)) {
  connection = new Connection(clusterApiUrl(networkOrEndpoint as import("@solana/web3.js").Cluster));
} else {
  // Si el argumento no es una red conocida, se asume que es un endpoint RPC personalizado
  connection = new Connection(networkOrEndpoint);
}
const network = ["devnet", "testnet", "mainnet-beta"].includes(networkOrEndpoint)
  ? networkOrEndpoint
  : "custom";
const user = getKeypairFromEnvironment("SECRET_KEY"); // keypair: 2upvUrj31kyhmya7HJBTJVpFz2RtE2nXTwPr8vwHCHgY

console.log(`🔑 Loaded keypair: ${user.publicKey.toBase58()}`);

// Create Token Mint for TB Coin (manual without createMint helper)
async function main() {
  const mintKeypair = Keypair.generate();

  const mintLen = MINT_SIZE;
  const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

  const space = MintLayout.span;

  const tx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: user.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      8,               // decimals
      user.publicKey,  // mint authority
      null             // freeze authority
    )
  );

  await sendAndConfirmTransaction(connection, tx, [user, mintKeypair]);
  console.log(`🔗 Explorer: ${getExplorerLink("address", mintKeypair.publicKey.toString(), ["devnet","testnet","mainnet-beta"].includes(networkOrEndpoint) ? networkOrEndpoint as import("@solana/web3.js").Cluster : undefined)}`);
}

main();