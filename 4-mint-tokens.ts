import { mintTo } from "@solana/spl-token";
import "dotenv/config";
import {
  getExplorerLink,
  getKeypairFromEnvironment,
} from "@solana-developers/helpers";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"));
const user = getKeypairFromEnvironment("SECRET_KEY");

// REPLACE WITH YOUR ADDRESSES
const tokenMintAccount = new PublicKey("4Ci4xVxKDdB4bLB2CASFtV2qxCpMg9BRBfFus5wv2ThD");
// Dirección de la cuenta de token asociada
const metadataUri = "https://raw.githubusercontent.com/sjhallo07/tbcoin-assets/main/metadata.json";
const tokenAccount = new PublicKey("ByvVyZRtaUkMEJYGHARaKRKUdmWsYWZyvcGKN7v1yH9L");

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

console.log(`✅ Tokens minted: ${getExplorerLink("transaction", signature, "devnet")}`);