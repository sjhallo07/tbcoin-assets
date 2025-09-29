import { mintTo } from "@solana/spl-token";
import "dotenv/config";
import {
  getExplorerLink,
  getKeypairFromEnvironment,
} from "@solana-developers/helpers";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";


// Permitir elegir red y direcciones por argumento CLI
import type { Cluster } from "@solana/web3.js";
const network = (process.argv[2] as Cluster) || "devnet";
if (!["devnet", "testnet", "mainnet-beta"].includes(network)) {
  throw new Error("Invalid network. Use devnet, testnet, or mainnet-beta.");
}
const connection = new Connection(clusterApiUrl(network));
const user = getKeypairFromEnvironment("SECRET_KEY");

const tokenMintAccount = new PublicKey(process.argv[3] || "4Ci4xVxKDdB4bLB2CASFtV2qxCpMg9BRBfFus5wv2ThD");
const tokenAccount = new PublicKey(process.argv[4] || "ByvVyZRtaUkMEJYGHARaKRKUdmWsYWZyvcGKN7v1yH9L");

// Mint 1,000,000 TB Coins (with 8 decimals)
const amount = 1000000 * 10 ** 8; // 1,000,000 × 10^8

const signature = await mintTo(
  connection,
  user,
  tokenMintAccount,
  tokenAccount,
  user, // mint authority
  amount
);

console.log(`✅ Tokens minted: ${getExplorerLink("transaction", signature, network)}`);