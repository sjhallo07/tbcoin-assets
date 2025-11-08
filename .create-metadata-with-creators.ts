import "dotenv/config";
import {
  Connection,
  clusterApiUrl,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  Keypair,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import fs from "fs";

// Import the serializer from mpl-token-metadata
const mod = await import("@metaplex-foundation/mpl-token-metadata/dist/src/generated/instructions/createMetadataAccountV3.js");
const { getCreateMetadataAccountV3InstructionDataSerializer } = mod as any;

async function main() {
  const network = process.env.SOLANA_NETWORK || "devnet";
  const mintArg = process.argv[2];
  if (!mintArg) {
    console.error("Usage: ts-node create-metadata-with-creators.ts <mintAddress>");
    process.exit(1);
  }

  const connection = new Connection(clusterApiUrl(network as any));

  // Load keypair from .env
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

  // Example creators and uses
  const creators = [
    {
      address: user.publicKey,
      verified: true,
      share: 50,
    },
    {
      address: new PublicKey("2upvUrj31kyhmya7HJBTJVpFz2RtE2nXTwPr8vwHCHgY"),
      verified: false,
      share: 50,
    },
  ];
  const uses = {
    useMethod: 0, // Burn
    remaining: 10,
    total: 10,
  };

  const metadataData = {
    name: "TOKEN TB Coin",
    symbol: "TB",
    description: "Token TB Coin",
    image: "https://sjhallo07.github.io/tbcoin-assets/tbcoin_logo.png",
    uri: "https://sjhallo07.github.io/tbcoin-assets/tbcoin_token_metadata.json",
    sellerFeeBasisPoints: 0,
    creators,
    collection: null,
    uses,
  };

  const [metadataPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), tokenMintAccount.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID
  );

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
  console.log(`✅ Metadata created/updated: https://explorer.solana.com/tx/${signature}?cluster=${network}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
