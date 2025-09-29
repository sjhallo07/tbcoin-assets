// URI de metadata para el logo
const metadataUri = "https://raw.githubusercontent.com/sjhallo07/tbcoin-assets/main/metadata.json";
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";
import 'dotenv/config';
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
const sender = getKeypairFromEnvironment("SECRET_KEY");

const tokenMintAccount = new PublicKey(process.argv[3] || "4Ci4xVxKDdB4bLB2CASFtV2qxCpMg9BRBfFus5wv2ThD");
const recipient = new PublicKey(process.argv[4] || "6dCMwH4Wx4Sr1Q5TCGeV1ZMN8ihLcPpsP1wQ6Rka9Pgi");

const sourceAccount = await getOrCreateAssociatedTokenAccount(
  connection,
  sender,
  tokenMintAccount,
  sender.publicKey
);

// Crear la cuenta asociada del destinatario si no existe
const destAccount = await getOrCreateAssociatedTokenAccount(
  connection,
  sender, // El payer paga el fee de creación
  tokenMintAccount,
  recipient
);

// Transfer 100 TB Coins
const signature = await transfer(
  connection,
  sender,
  sourceAccount.address,
  destAccount.address,
  sender,
  100 * 100 // 100 × 10^2
);

console.log(`✅ Transfer completed: ${getExplorerLink("transaction", signature, network)}`);