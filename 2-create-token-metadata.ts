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
import { createUpdateMetadataAccountV2Instruction } from "@metaplex-foundation/mpl-token-metadata";

const user = getKeypairFromEnvironment("SECRET_KEY");
const connection = new Connection(clusterApiUrl("devnet"));

// REPLACE WITH YOUR TOKEN MINT ADDRESS
const tokenMintAccount = new PublicKey("4Ci4xVxKDdB4bLB2CASFtV2qxCpMg9BRBfFus5wv2ThD");

const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

const metadataData = {
  name: "TOKEN TB Coin",
  symbol: "TB",
  uri: "https://raw.githubusercontent.com/sjhallo07/tbcoin-assets/main/metadata.json",
  sellerFeeBasisPoints: 0,
  creators: null,
  collection: null,
  uses: null,
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
  createUpdateMetadataAccountV2Instruction(
    {
      metadata: metadataPDA,
      updateAuthority: user.publicKey,
    },
    {
      updateMetadataAccountArgsV2: {
        data: metadataData,
        updateAuthority: user.publicKey,
        primarySaleHappened: null,
        isMutable: true,
      }
    }
  )
);

const signature = await sendAndConfirmTransaction(connection, transaction, [user]);
console.log(`✅ Metadata created: ${getExplorerLink("transaction", signature, "devnet")}`);