import "dotenv/config";
import { createSolanaClient, generateKeyPairSigner, createTransaction, getExplorerLink } from "gill";
import { Keypair, PublicKey } from "@solana/web3.js";
import fs from "fs";
import os from "os";
import path from "path";
// If using gill v0.7.0+, these are re-exported from the main package:
import { Instruction } from "gill";
import { createMintInstruction } from "gill";
import { createTokenMetadataInstruction } from "gill/instructions/createTokenMetadataInstruction";

// Helper to load Solana CLI keypair (default location)
function loadKeypairFromFile(filePath?: string): Keypair {
  const resolved = filePath || path.join(os.homedir(), ".config", "solana", "id.json");
  const secret = JSON.parse(fs.readFileSync(resolved, "utf8"));
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

// Helper to get the PDA for token metadata (Metaplex standard)
function getTokenMetadataAddress(mint: { address: string }): string {
  // Metaplex Token Metadata program ID
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
  const feePayer = await generateKeyPairSigner();

  // Generate a new mint keypair
  const mint = await generateKeyPairSigner();
  const metadataAddress = getTokenMetadataAddress(mint);

  // Metadata
  const metadata = {
    name: process.env.TOKEN_NAME || "TB Coin",
    symbol: process.env.TOKEN_SYMBOL || "TB",
    uri:
      process.env.TOKEN_METADATA_URI ||
      "https://raw.githubusercontent.com/sjhallo07/tbcoin-assets/main/tbcoin_token_metadata.json",
    isMutable: true,
  };

  // Create the transaction
  const { rpc, sendAndConfirmTransaction } = createSolanaClient({ urlOrMoniker: network });
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  // Use gill's getCreateAccountInstruction if available, otherwise use @solana/web3.js SystemProgram
  // For this rewrite, only show the structure for the create account instruction
  // Use gill's IInstruction[] type for instructions
  const instructions: Instruction[] = [];

  // Add mint initialization instruction
  instructions.push(
    await createMintInstruction({
      payer: feePayer,
      mint,
      decimals: 9,
      mintAuthority: feePayer,
      freezeAuthority: feePayer,
    })
  );

  // Add metadata creation instruction
  instructions.push(
    await createTokenMetadataInstruction({
      payer: feePayer,
      mint,
      metadata,
    })
  );

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
    `\nExplorer: ${getExplorerLink({ cluster: network as "devnet" | "testnet" | "mainnet" | "mainnet-beta" | "localhost" | undefined, address: mint.address })}`
  );
  console.log(`Transaction: ${getExplorerLink({ cluster: network as "devnet" | "testnet" | "mainnet" | "mainnet-beta" | "localhost" | undefined, transaction: signature })}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
