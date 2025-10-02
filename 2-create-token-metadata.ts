import "dotenv/config";
import {
  getKeypairFromEnvironment,
  getExplorerLink,
} from "@solana-developers/helpers";
import {
  Connection,
  clusterApiUrl,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { createCreateMetadataAccountV3Instruction } from "@metaplex-foundation/mpl-token-metadata";

const user = getKeypairFromEnvironment("SECRET_KEY");
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
  : undefined;

// REPLACE WITH YOUR TOKEN MINT ADDRESS
const tokenMintAccount = new PublicKey(process.argv[3] || "4Ci4xVxKDdB4bLB2CASFtV2qxCpMg9BRBfFus5wv2ThD");

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
  uses: null
};

const [metadataPDA] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("metadata"),
    TOKEN_METADATA_PROGRAM_ID.toBuffer(),
    tokenMintAccount.toBuffer(),
  ],
  TOKEN_METADATA_PROGRAM_ID
);

const transaction = new Transaction().add(
  createCreateMetadataAccountV3Instruction(
    {
      metadata: metadataPDA,
      mint: tokenMintAccount,
      mintAuthority: user.publicKey,
      payer: user.publicKey,
      updateAuthority: user.publicKey,
    },
    {
      createMetadataAccountArgsV3: {
        data: metadataData,
        isMutable: true,
        collectionDetails: null,
      }
    }
  )
);

const signature = await sendAndConfirmTransaction(connection, transaction, [user]);
console.log(`✅ Metadata created: ${getExplorerLink("transaction", signature, network as Cluster)}`);