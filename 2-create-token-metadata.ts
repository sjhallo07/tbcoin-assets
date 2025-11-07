import "dotenv/config";
import {
  getKeypairFromEnvironment,
  getExplorerLink,
} from "@solana-developers/helpers";
// Updated to use the generated serializer directly (avoids UMI import issues)
import fs from "fs";
import "dotenv/config";
import {
  Connection,
  clusterApiUrl,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Keypair,
} from "@solana/web3.js";

// This file now builds the CreateMetadataAccountV3 instruction by using the
// generated serializer from mpl-token-metadata and sending the transaction
// directly. This mirrors run-create-metadata.js but in TypeScript.

async function main() {
  const network = process.argv[2] || "devnet";
  const mintArg = process.argv[3];
  if (!mintArg) {
    console.error("Usage: ts-node 2-create-token-metadata.ts <network> <mintAddress>");
    process.exit(1);
  }

  const connection = new Connection(clusterApiUrl(network as any));

  // Load SECRET_KEY from .env (same format as existing .env)
  const env = fs.readFileSync(".env", "utf8");
  const m = env.match(/SECRET_KEY=\s*\[(.*)\]/);
  if (!m) {
    console.error("SECRET_KEY not found in .env");
    process.exit(1);
  }
  const secret = m[1].split(",").map((s) => Number(s.trim()));
  const user = Keypair.fromSecretKey(Uint8Array.from(secret));

  const tokenMintAccount = new PublicKey(mintArg);
  const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );

  const metadataData = {
    name: "TOKEN TB Coin",
    symbol: "TB",
    uri: "https://raw.githubusercontent.com/sjhallo07/tbcoin-assets/main/tbcoin_token_metadata.json",
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  };

  const [metadataPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), tokenMintAccount.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID
  );

  // If metadata account already exists, report and exit
  const existing = await connection.getAccountInfo(metadataPDA);
  if (existing) {
    console.log(`ℹ️ Metadata account already exists: ${metadataPDA.toBase58()}`);
    console.log(`🔗 Explorer: https://explorer.solana.com/address/${metadataPDA.toBase58()}?cluster=${network}`);
    return;
  }

  // Dynamically import the generated serializer (works with ESM loader)
  const mod = await import("@metaplex-foundation/mpl-token-metadata/dist/src/generated/instructions/createMetadataAccountV3.js");
  const { getCreateMetadataAccountV3InstructionDataSerializer } = mod as any;

  const args = {
    data: metadataData,
    isMutable: true,
    collectionDetails: null,
  };

  const serializer = getCreateMetadataAccountV3InstructionDataSerializer();
  const data = serializer.serialize(args);

  const keys = [
    { pubkey: metadataPDA, isSigner: false, isWritable: true },
    { pubkey: tokenMintAccount, isSigner: false, isWritable: false },
    { pubkey: user.publicKey, isSigner: true, isWritable: false },
    { pubkey: user.publicKey, isSigner: true, isWritable: true },
    { pubkey: user.publicKey, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
  ];

  const instruction = {
    keys,
    programId: TOKEN_METADATA_PROGRAM_ID,
    data: Buffer.from(data),
  } as any;

  const tx = new Transaction().add(instruction as any);
  const signature = await sendAndConfirmTransaction(connection, tx, [user]);
  console.log(`✅ Metadata created: https://explorer.solana.com/tx/${signature}?cluster=${network}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
