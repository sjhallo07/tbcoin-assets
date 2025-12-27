const fs = require('fs');
const {
  Connection,
  clusterApiUrl,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  Keypair,
} = require('@solana/web3.js');

async function main() {
  const network = process.argv[2] || 'devnet';
  const mintArg = process.argv[3];
  const metadataJsonPath = process.argv[4] || 'tbcoin_token_metadata.json';
  if (!mintArg) {
    console.error('Usage: node update-metadata.js <network> <mintAddress> [metadataJsonPath]');
    process.exit(1);
  }

  const connection = new Connection(clusterApiUrl(network));

  const env = fs.readFileSync('.env', 'utf8');
  const m = env.match(/SECRET_KEY=\s*\[(.*)\]/);
  if (!m) {
    console.error('SECRET_KEY not found in .env');
    process.exit(1);
  }
  const secret = m[1].split(',').map(s => Number(s.trim()));
  const user = Keypair.fromSecretKey(Uint8Array.from(secret));

  const tokenMintAccount = new PublicKey(mintArg);
  const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

  const [metadataPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), tokenMintAccount.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID
  );

  const raw = JSON.parse(fs.readFileSync(metadataJsonPath, 'utf8'));

  // Use the off-chain JSON's name and symbol and set uri to the raw GitHub URL by default
  const uri = raw.uri || 'https://raw.githubusercontent.com/sjhallo07/tbcoin-assets/main/tbcoin_token_metadata.json';
  const name = raw.name || 'TOKEN TB Coin';
  const symbol = raw.symbol || 'TB';

  // Import serializer
  const mod = require('@metaplex-foundation/mpl-token-metadata/dist/src/generated/instructions/updateMetadataAccountV2');
  const { getUpdateMetadataAccountV2InstructionDataSerializer } = mod;

  const args = {
    data: {
      name,
      symbol,
      uri,
      sellerFeeBasisPoints: raw.sellerFeeBasisPoints || 0,
      creators: null,
      collection: null,
      uses: null,
    },
    newUpdateAuthority: null,
    primarySaleHappened: null,
    isMutable: true,
  };

  const serializer = getUpdateMetadataAccountV2InstructionDataSerializer();
  const data = serializer.serialize(args);

  const keys = [
    { pubkey: metadataPDA, isSigner: false, isWritable: true },
    { pubkey: user.publicKey, isSigner: true, isWritable: false },
  ];

  const instruction = { keys, programId: TOKEN_METADATA_PROGRAM_ID, data: Buffer.from(data) };
  const tx = new Transaction().add(instruction);
  const sig = await sendAndConfirmTransaction(connection, tx, [user]);
  console.log('✅ Metadata updated:', sig);
  console.log('🔗 Explorer:', `https://explorer.solana.com/tx/${sig}?cluster=${network}`);
}

main().catch(err => { console.error('Error updating metadata:', err); process.exit(1); });
