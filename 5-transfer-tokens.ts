// Script para transferir tokens SPL
import 'dotenv/config';
import {
  getAssociatedTokenAddress,
  getAccount,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  getExplorerLink,
  getKeypairFromEnvironment,
} from "@solana-developers/helpers";
import {
  Connection,
  PublicKey,
  clusterApiUrl,
  Keypair,
  Transaction,
  sendAndConfirmTransaction
} from "@solana/web3.js";

// Crea la ATA si no existe
async function getOrCreateAta(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  owner: PublicKey
): Promise<PublicKey> {
  const ata = await getAssociatedTokenAddress(
    mint,
    owner,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  try {
    await getAccount(connection, ata);
  } catch {
    const tx = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        payer.publicKey,
        ata,
        owner,
        mint,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
    await sendAndConfirmTransaction(connection, tx, [payer]);
  }
  return ata;
}

async function main() {
  // Network (por defecto devnet)
  const network = process.env.SOLANA_NETWORK || "devnet";
  const connection = new Connection(clusterApiUrl(network as any));

  // Keypair del emisor desde variable de entorno SECRET_KEY
  const sender = getKeypairFromEnvironment("SECRET_KEY");

  // Mint y destinatario desde argumentos o valores por defecto
  const tokenMintAccount = new PublicKey(process.argv[2] || "4Ci4xVxKDdB4bLB2CASFtV2qxCpMg9BRBfFus5wv2ThD");
  const recipient = new PublicKey(process.argv[3] || "6dCMwH4Wx4Sr1Q5TCGeV1ZMN8ihLcPpsP1wQ6Rka9Pgi");

  // ATAs
  const sourceAccount = await getOrCreateAta(connection, sender, tokenMintAccount, sender.publicKey);
  const destAccount = await getOrCreateAta(connection, sender, tokenMintAccount, recipient);

  // Cantidad (100 con 2 decimales => ×100)
  const amount = 100 * 100; // 100 × 10^2

  // Transferencia
  const tx = new Transaction().add(
    createTransferInstruction(
      sourceAccount,
      destAccount,
      sender.publicKey,
      amount,
      [],
      TOKEN_PROGRAM_ID
    )
  );

  const signature = await sendAndConfirmTransaction(connection, tx, [sender]);

  console.log(
    `✅ Tokens transferred: ${getExplorerLink("transaction", signature, network as any)}`
  );
}

main().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});