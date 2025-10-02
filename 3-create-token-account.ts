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
  : "custom";
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
const explorerNetwork = ["devnet", "testnet", "mainnet-beta"].includes(network) ? network : undefined;
console.log(`🔗 Explorer: ${getExplorerLink("address", tokenAccount.address.toBase58(), explorerNetwork as Cluster | "localnet" | undefined)}`);