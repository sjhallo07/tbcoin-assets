#!/usr/bin/env node

require('dotenv').config();
const { Connection, clusterApiUrl, PublicKey } = require('@solana/web3.js');

const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
const KNOWN_CLUSTERS = new Set(['devnet', 'testnet', 'mainnet-beta']);

function sanitize(value) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed.length) return undefined;
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function resolveEndpoint(input, fallback = 'devnet') {
  const target = sanitize(input) || fallback || 'devnet';
  if (KNOWN_CLUSTERS.has(target)) {
    return clusterApiUrl(target);
  }
  if (/^https?:\/\//i.test(target)) {
    return target;
  }
  if (KNOWN_CLUSTERS.has(fallback)) {
    return clusterApiUrl(fallback);
  }
  throw new Error(`Unsupported network or RPC endpoint: ${target}`);
}

function ensure(condition, label) {
  if (!condition) {
    throw new Error(`Metadata account truncated while reading ${label}`);
  }
}

function readString(buffer, offset, label) {
  ensure(offset + 4 <= buffer.length, `${label} length`);
  const length = buffer.readUInt32LE(offset);
  offset += 4;
  ensure(offset + length <= buffer.length, label);
  const value = buffer.slice(offset, offset + length).toString('utf8');
  offset += length;
  return { value: value.replace(/\0+$/g, ''), offset };
}

function parseMetadata(buffer) {
  let offset = 0;
  ensure(offset + 1 <= buffer.length, 'key');
  const key = buffer.readUInt8(offset); offset += 1;

  ensure(offset + 32 <= buffer.length, 'update authority');
  const updateAuthority = new PublicKey(buffer.slice(offset, offset + 32)); offset += 32;

  ensure(offset + 32 <= buffer.length, 'mint');
  const mint = new PublicKey(buffer.slice(offset, offset + 32)); offset += 32;

  const nameResult = readString(buffer, offset, 'name');
  const name = nameResult.value.trim();
  offset = nameResult.offset;

  const symbolResult = readString(buffer, offset, 'symbol');
  const symbol = symbolResult.value.trim();
  offset = symbolResult.offset;

  const uriResult = readString(buffer, offset, 'uri');
  const uri = uriResult.value.trim();
  offset = uriResult.offset;

  ensure(offset + 2 <= buffer.length, 'seller fee');
  const sellerFeeBasisPoints = buffer.readUInt16LE(offset); offset += 2;

  let creators = [];
  if (offset < buffer.length) {
    ensure(offset + 1 <= buffer.length, 'creators option');
    const hasCreators = buffer.readUInt8(offset); offset += 1;
    if (hasCreators) {
      ensure(offset + 4 <= buffer.length, 'creators length');
      const count = buffer.readUInt32LE(offset); offset += 4;
      creators = new Array(count);
      for (let i = 0; i < count; i++) {
        ensure(offset + 32 + 1 + 1 <= buffer.length, `creator ${i}`);
        const address = new PublicKey(buffer.slice(offset, offset + 32)); offset += 32;
        const verified = Boolean(buffer.readUInt8(offset)); offset += 1;
        const share = buffer.readUInt8(offset); offset += 1;
        creators[i] = { address: address.toBase58(), verified, share };
      }
    }
  }

  return { key, updateAuthority, mint, name, symbol, uri, sellerFeeBasisPoints, creators };
}

function padRight(value, length) {
  const text = value ?? '';
  if (text.length >= length) return text;
  return text + ' '.repeat(length - text.length);
}

function stripTrailingSlash(value) {
  if (!value) return value;
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

async function fetchJson(uri) {
  const fetchImpl = typeof fetch === 'function' ? fetch : null;
  if (!fetchImpl) {
    console.log('ℹ️  global fetch is not available in this runtime; skipping off-chain JSON fetch');
    return null;
  }
  try {
    const res = await fetchImpl(uri, { method: 'GET' });
    if (!res.ok) {
      console.log(`⚠️  Unable to fetch off-chain JSON (status ${res.status})`);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.log('⚠️  Error fetching off-chain JSON:', error.message || error);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const envNetwork = sanitize(process.env.NETWORK) || sanitize(process.env.SOLANA_NETWORK) || 'devnet';

  let network = envNetwork;
  let mintArg;
  if (args.length === 0) {
    console.error('Usage: node verify-metadata.js [network] <mint> [expectedName] [expectedSymbol] [expectedUri]');
    process.exit(1);
  } else if (args.length === 1) {
    mintArg = args[0];
  } else {
    network = args[0];
    mintArg = args[1];
  }

  const expectedName = sanitize(args[2]) || sanitize(process.env.TOKEN_NAME);
  const expectedSymbol = sanitize(args[3]) || sanitize(process.env.TOKEN_SYMBOL);

  const fromEnvUri = sanitize(process.env.METADATA_URI);
  let fallbackUri;
  const ghPages = stripTrailingSlash(sanitize(process.env.GH_PAGES_URL));
  const metadataPath = sanitize(process.env.METADATA_JSON_PATH);
  if (ghPages && metadataPath) {
    fallbackUri = `${ghPages}/${metadataPath}`;
  }
  const expectedUri = sanitize(args[4]) || fromEnvUri || fallbackUri;

  const expectedImage = sanitize(process.env.TOKEN_IMAGE_URL) || (ghPages ? `${ghPages}/tbcoin_logo.png` : undefined);

  const endpoint = resolveEndpoint(network, envNetwork);
  const connection = new Connection(endpoint, 'confirmed');

  const mint = new PublicKey(mintArg);
  const [metadataPDA] = PublicKey.findProgramAddressSync([
    Buffer.from('metadata'),
    METADATA_PROGRAM_ID.toBuffer(),
    mint.toBuffer(),
  ], METADATA_PROGRAM_ID);

  const info = await connection.getAccountInfo(metadataPDA);
  if (!info) {
    console.error('❌ Metadata account not found for mint:', mint.toBase58());
    process.exit(2);
  }

  const metadata = parseMetadata(info.data);

  console.log('Metadata PDA      :', metadataPDA.toBase58());
  console.log('Network / endpoint:', endpoint);
  console.log('Metadata key enum :', metadata.key);
  console.log('Update authority  :', metadata.updateAuthority.toBase58());
  console.log('Mint (account)    :', metadata.mint.toBase58());
  console.log('Name              :', metadata.name);
  console.log('Symbol            :', metadata.symbol);
  console.log('URI               :', metadata.uri);
  console.log('Seller fee (bps)  :', metadata.sellerFeeBasisPoints);

  const checks = [];
  if (expectedName) {
    checks.push({ label: 'Name matches expected', ok: metadata.name === expectedName, expected: expectedName, actual: metadata.name });
  }
  if (expectedSymbol) {
    checks.push({ label: 'Symbol matches expected', ok: metadata.symbol === expectedSymbol, expected: expectedSymbol, actual: metadata.symbol });
  }
  if (expectedUri) {
    checks.push({ label: 'URI matches expected', ok: metadata.uri === expectedUri, expected: expectedUri, actual: metadata.uri });
  }

  if (checks.length) {
    console.log('\nField checks:');
    for (const check of checks) {
      const status = check.ok ? '✅' : '❌';
      console.log(`${status} ${padRight(check.label, 24)} → actual: ${check.actual || '(empty)'}${check.expected ? ` | expected: ${check.expected}` : ''}`);
    }
  }

  if (metadata.creators.length) {
    console.log('\nCreators:');
    metadata.creators.forEach((creator, idx) => {
      console.log(`  ${idx + 1}. ${creator.address} | verified=${creator.verified} | share=${creator.share}`);
    });
  }

  let json;
  if (metadata.uri && metadata.uri.startsWith('http')) {
    console.log('\nFetching off-chain JSON...');
    json = await fetchJson(metadata.uri);
    if (json) {
      console.log('  name       :', json.name);
      console.log('  symbol     :', json.symbol);
      console.log('  description:', json.description || '(none)');
      console.log('  image      :', json.image || '(none)');
      if (expectedImage) {
        const imageMatch = json.image === expectedImage;
        console.log(`${imageMatch ? '✅' : '❌'} image matches expected → ${json.image || '(none)'}${expectedImage ? ` | expected: ${expectedImage}` : ''}`);
      }
    }
  } else if (metadata.uri && metadata.uri.startsWith('ipfs://')) {
    console.log('\nURI uses ipfs://. Consider checking via a gateway, e.g. https://nftstorage.link/' + metadata.uri.replace('ipfs://', 'ipfs/'));
  }

  const failed = checks.some(check => check.ok === false);
  if (failed) {
    process.exitCode = 1;
    console.log('\n❌ Verification completed with mismatches.');
  } else {
    console.log('\n✅ Verification completed.');
  }
}

main().catch(error => {
  console.error('Unexpected error while verifying metadata:', error.stack || error);
  process.exit(1);
});
