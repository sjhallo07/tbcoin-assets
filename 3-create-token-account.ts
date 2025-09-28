// URI de metadata para el logo
const metadataUri = "https://raw.githubusercontent.com/sjhallo07/tbcoin-assets/main/metadata.json";

import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import 'dotenv/config';
import {
  getExplorerLink,
  getKeypairFromEnvironment,
} from "@solana-developers/helpers";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"));
const user = getKeypairFromEnvironment("SECRET_KEY"); // keypair: 2upvUrj31kyhmya7HJBTJVpFz2RtE2nXTwPr8vwHCHgY

// REPLACE WITH YOUR TOKEN MINT
const tokenMintAccount = new PublicKey("4Ci4xVxKDdB4bLB2CASFtV2qxCpMg9BRBfFus5wv2ThD");

const tokenAccount = await getOrCreateAssociatedTokenAccount(
  connection,
  user,
  tokenMintAccount,
  user.publicKey // token account owner
);

console.log(`✅ Token account created: ${tokenAccount.address.toBase58()}`);
console.log(`🔗 Explorer: ${getExplorerLink("address", tokenAccount.address.toBase58(), "devnet")}`);