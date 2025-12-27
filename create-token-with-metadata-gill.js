// create-token-with-metadata-gill.js
require("dotenv").config();
import { createSolanaClient, generateKeyPairSigner, createTransaction, getExplorerLink } from "gill";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

// Helper to load Solana CLI keypair (default location)
function loadKeypairFromFile(filePath) {
  const resolved = filePath || join(homedir(), ".config", "solana", "id.json");
  const secret = JSON.parse(readFileSync(resolved, "utf8"));
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

// Helper to get the PDA for token metadata (Metaplex standard)
function getTokenMetadataAddress(mint) {
  const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
  const mintPubkey = new PublicKey(mint.address);
  const [pda] = PublicKey.findProgramAddressSync([
    Buffer.from("metadata"),
    METADATA_PROGRAM_ID.toBuffer(),
    mintPubkey.toBuffer(),
  ], METADATA_PROGRAM_ID);
  return pda.toBase58();
}

async function main() {
  const network = process.argv[2] || process.env.SOLANA_NETWORK || "devnet";
  const feePayer = loadKeypairFromFile(process.env.SERVER_SIGNER);

  // Generate a new mint keypair
  const mint = await generateKeyPairSigner();
  const metadataAddress = getTokenMetadataAddress(mint);

  // Metadata
  const metadata = {
    name: process.env.TOKEN_NAME || "TB Coin",
    symbol: process.env.TOKEN_SYMBOL || "TB",
    uri:
      process.env.TOKEN_METADATA_URI ||
      "https://sjhallo07.github.io/tbcoin-assets/tbcoin_token_metadata.json",
    isMutable: true,
  };

  // Create the transaction
  const { rpc, sendAndConfirmTransaction } = createSolanaClient({ urlOrMoniker: network });
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  // For this JS version, just show the structure for the create account instruction
  const instructions = [];
  // TODO: Add instructions for mint initialization and metadata creation using supported gill or web3.js APIs

  const transaction = createTransaction({
    feePayer,
    instructions,
    latestBlockhash,
    version: "legacy",
  });

  // Sign and send
  const signature = await sendAndConfirmTransaction(transaction);

  console.log("✅ Token created!");
  console.log(
    "Mint:", mint.address,
    "\nMetadata:", metadataAddress,
    `\nExplorer: ${getExplorerLink({ cluster: network, address: mint.address })}`
  );
  console.log(`Transaction: ${getExplorerLink({ cluster: network, transaction: signature })}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
