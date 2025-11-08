import path from 'path';
import { config as loadEnv } from 'dotenv';

loadEnv();

const storageDirectory = process.env.STORAGE_DIR
  ? path.resolve(process.cwd(), process.env.STORAGE_DIR)
  : path.resolve(process.cwd(), 'storage');
const eventLogFile = process.env.EVENT_LOG_FILE
  ? path.resolve(process.cwd(), process.env.EVENT_LOG_FILE)
  : path.join(storageDirectory, 'event-logs.json');

export const appConfig = {
  solanaNetwork: process.env.SOLANA_NETWORK ?? 'devnet',
  mintAddress:
    process.env.MINT_ADDRESS ?? '8n3oA4f1LvfFutDmLfuwpasH47JDDp9UtDi37dhAmPW6',
  metadataPda:
    process.env.METADATA_PDA ?? 'GvyJwr4N11A32DAx2ZQ2Y1oTNskPka5FgMEadDsVaVB',
  updateAuthority:
    process.env.UPDATE_AUTHORITY ?? '2upvUrj31kyhmya7HJBTJVpFz2RtE2nXTwPr8vwHCHgY',
  port: Number(process.env.PORT ?? 3000),
  apiKey: (() => {
    if (!process.env.API_KEY) {
      throw new Error('API_KEY environment variable must be set for security reasons.');
    }
    return process.env.API_KEY;
  })(),
  testWallet: process.env.TEST_WALLET ?? '',
  testAmount: Number(process.env.TEST_AMOUNT ?? 1000),
  requiredSignatures: Number(process.env.REQUIRED_SIGNATURES ?? 2),
  modificationDelay: Number(process.env.MODIFICATION_DELAY ?? 86400),
  storageDirectory,
  eventLogFile,
};
