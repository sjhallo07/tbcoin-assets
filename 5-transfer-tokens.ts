// Script para transferir tokens SPL
import 'dotenv/config';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getMint,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
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
import BigNumber from "bignumber.js";

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

  // Usage: ts-node 5-transfer-tokens.ts <MINT_ADDRESS> <RECIPIENT_ADDRESS> <AMOUNT>
  if (process.argv.length < 5) {
    console.log("Usage: ts-node 5-transfer-tokens.ts <MINT_ADDRESS> <RECIPIENT_ADDRESS> <AMOUNT>");
    console.log("  <MINT_ADDRESS>: SPL token mint address");
    console.log("  <RECIPIENT_ADDRESS>: recipient's wallet address");
    console.log("  <AMOUNT>: amount to transfer in whole tokens (e.g. 1.5 for 1.5 tokens)");
    process.exit(1);
  }
  const tokenMintAccount = new PublicKey(process.argv[2]);
  const recipient = new PublicKey(process.argv[3]);

  const amountInput = process.argv[4].trim();
  let amountBN: BigNumber;
  try {
    amountBN = new BigNumber(amountInput);
  } catch {
    console.error("Amount must be a valid number.");
    process.exit(1);
  }
  if (!amountBN.isFinite() || !amountBN.isPositive()) {
    console.error("Amount must be a positive number in whole tokens.");
    process.exit(1);
  }

  // Fetch mint info to get decimals
  const mintInfo = await getMint(connection, tokenMintAccount);
  const decimals = mintInfo.decimals;

  // Convert to integer base units using bignumber.js to handle decimals and scientific notation
  const amount = amountBN.shiftedBy(decimals).integerValue(BigNumber.ROUND_DOWN);
  if (amount.decimalPlaces() !== 0) {
    console.error(`Amount has more decimal places than the token supports (${decimals}).`);
    process.exit(1);
  }
  if (amount.isLessThanOrEqualTo(0)) {
    console.error("Amount must be greater than zero after conversion.");
    process.exit(1);
  }
  const amountBigInt = BigInt(amount.toFixed(0));

  // ATAs
  const sourceAccount = await getOrCreateAta(connection, sender, tokenMintAccount, sender.publicKey);
  const destAccount = await getOrCreateAta(connection, sender, tokenMintAccount, recipient);

  // Transferencia
  const tx = new Transaction().add(
    createTransferInstruction(
      sourceAccount,
      destAccount,
      sender.publicKey,
      amountBigInt,
      [],
      TOKEN_PROGRAM_ID
    )
  );

  const signature = await sendAndConfirmTransaction(connection, tx, [sender]);

  // Fetch and display supply
  const supply = mintInfo.supply;
  const formattedSupply = Number(supply) / Math.pow(10, decimals);

  console.log(
    `✅ Tokens transferred: ${getExplorerLink("transaction", signature, network as any)}`
  );
  console.log(
    `Total supply on-chain: ${supply.toString()} (raw units), ${formattedSupply} (formatted with ${decimals} decimals)`
  );
}

main().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});