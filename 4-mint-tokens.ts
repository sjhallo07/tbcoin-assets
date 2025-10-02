import { mintTo } from "@solana/spl-token";
import "dotenv/config";
import {
  getExplorerLink,
  getKeypairFromEnvironment,
} from "@solana-developers/helpers";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";


// Permitir elegir red y direcciones por argumento CLI
// Permitir elegir red por argumento CLI o endpoint personalizado
import type { Cluster } from "@solana/web3.js";
const networkOrEndpoint = process.argv[2] || "devnet";
let connection: Connection;
if (["devnet", "testnet", "mainnet-beta"].includes(networkOrEndpoint)) {
  connection = new Connection(clusterApiUrl(networkOrEndpoint as Cluster));
} else {
  // Si el argumento no es una red conocida, se asume que es un endpoint RPC personalizado
  connection = new Connection(networkOrEndpoint);
}
const network = ["devnet", "testnet", "mainnet-beta"].includes(networkOrEndpoint)
  ? networkOrEndpoint
  : undefined;
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

const explorerNetwork = ["devnet", "testnet", "mainnet-beta"].includes(networkOrEndpoint) ? networkOrEndpoint : undefined;
console.log(`✅ Tokens minted: ${getExplorerLink("transaction", signature, ["devnet", "testnet", "mainnet-beta"].includes(networkOrEndpoint) ? networkOrEndpoint as Cluster : undefined)}`);