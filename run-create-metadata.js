// Lightweight metadata creator using mpl-token-metadata generated serializer
// This avoids using the UMI transaction builder by directly serializing
// the instruction data and sending a TransactionInstruction to the metadata program.
const { Connection, clusterApiUrl, PublicKey, Transaction, sendAndConfirmTransaction, SystemProgram, SYSVAR_RENT_PUBKEY } = require('@solana/web3.js');
const fs = require('fs');

const { getCreateMetadataAccountV3InstructionDataSerializer } = require('@metaplex-foundation/mpl-token-metadata/dist/src/generated/instructions/createMetadataAccountV3');

async function main() {
  const network = process.argv[2] || 'devnet';
  const mintArg = process.argv[3];
  if (!mintArg) {
    console.error('Usage: node run-create-metadata.js <network> <mintAddress>');
    process.exit(1);
  }
  const connection = new Connection(clusterApiUrl(network));

  // Load key from .env SECRET_KEY if present, otherwise fail
  const env = fs.readFileSync('.env', 'utf8');
  const m = env.match(/SECRET_KEY=\s*\[(.*)\]/);
  if (!m) {
    console.error('SECRET_KEY not found in .env');
    process.exit(1);
  }
  const secret = m[1].split(',').map(s => Number(s.trim()));
  const { Keypair } = require('@solana/web3.js');
  const user = Keypair.fromSecretKey(Uint8Array.from(secret));

  const tokenMintAccount = new PublicKey(mintArg);
  const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

  // Find metadata PDA (same as earlier TS file)
  const [metadataPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), tokenMintAccount.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID
  );

  // Build metadata data object matching the TS file
  const metadataData = {
    name: 'TOKEN TB Coin',
    symbol: 'TB',
    uri: 'https://raw.githubusercontent.com/sjhallo07/tbcoin-assets/main/tbcoin_token_metadata.json',
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null
  };

  // Build args expected by serializer
  const args = {
    data: metadataData,
    isMutable: true,
    collectionDetails: null
  };

  // Get serializer and serialize
  const serializer = getCreateMetadataAccountV3InstructionDataSerializer();
  const data = serializer.serialize(args);

  // Build keys
  const keys = [
    { pubkey: metadataPDA, isSigner: false, isWritable: true },
    { pubkey: tokenMintAccount, isSigner: false, isWritable: false },
    { pubkey: user.publicKey, isSigner: true, isWritable: false },
    { pubkey: user.publicKey, isSigner: true, isWritable: true },
    { pubkey: user.publicKey, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }
  ];

  const instruction = {
    keys,
    programId: TOKEN_METADATA_PROGRAM_ID,
    data: Buffer.from(data)
  };

  const tx = new Transaction().add(instruction);
  const signature = await sendAndConfirmTransaction(connection, tx, [user]);
  console.log('✅ Metadata tx signature:', signature);
  console.log('🔗 Explorer:', `https://explorer.solana.com/tx/${signature}?cluster=${network}`);
}

main().catch(err => {
  console.error('Error creating metadata:', err);
  process.exit(1);
});
