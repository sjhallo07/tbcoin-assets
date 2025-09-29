import { createMint } from "@solana/spl-token";
import "dotenv/config";
import {
  getKeypairFromEnvironment,
  getExplorerLink,
} from "@solana-developers/helpers";
import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"));
const user = getKeypairFromEnvironment("SECRET_KEY"); // keypair: 2upvUrj31kyhmya7HJBTJVpFz2RtE2nXTwPr8vwHCHgY

console.log(`🔑 Loaded keypair: ${user.publicKey.toBase58()}`);

// Create Token Mint for TB Coin
async function main() {
  const tokenMint = await createMint(
    connection,
    user,           // payer
    user.publicKey, // mint authority
    null,           // freeze authority (null to disable freeze)
    8               // decimals (8 like otros)
  );
  console.log(`✅ Token Mint created: ${tokenMint.toString()}`);
  console.log(`🔗 Explorer: ${getExplorerLink("address", tokenMint.toString(), "devnet")}`);
}

main();