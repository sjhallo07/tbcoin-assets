// URI de metadata para el logo
const metadataUri = "https://raw.githubusercontent.com/sjhallo07/tbcoin-assets/main/metadata.json";

import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import 'dotenv/config';
import {
  getExplorerLink,
  getKeypairFromEnvironment,
} from "@solana-developers/helpers";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";


// Permitir elegir red por argumento CLI
import type { Cluster } from "@solana/web3.js";
const network = (process.argv[2] as Cluster) || "devnet";
if (!["devnet", "testnet", "mainnet-beta"].includes(network)) {
  throw new Error("Invalid network. Use devnet, testnet, or mainnet-beta.");
}
const connection = new Connection(clusterApiUrl(network));
const user = getKeypairFromEnvironment("SECRET_KEY");

// REPLACE WITH YOUR TOKEN MINT
const tokenMintAccount = new PublicKey(process.argv[3] || "4Ci4xVxKDdB4bLB2CASFtV2qxCpMg9BRBfFus5wv2ThD");

const tokenAccount = await getOrCreateAssociatedTokenAccount(
  connection,
  user,
  tokenMintAccount,
  user.publicKey // token account owner
);

console.log(`✅ Token account created: ${tokenAccount.address.toBase58()}`);
console.log(`🔗 Explorer: ${getExplorerLink("address", tokenAccount.address.toBase58(), network)}`);