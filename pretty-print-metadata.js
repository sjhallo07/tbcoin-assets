const { Connection, clusterApiUrl, PublicKey } = require('@solana/web3.js');

async function main() {
  const network = process.argv[2] || 'devnet';
  const mintArg = process.argv[3];
  if (!mintArg) {
    console.error('Usage: node pretty-print-metadata.js <network> <mintAddress>');
    process.exit(1);
  }

  const conn = new Connection(clusterApiUrl(network), 'confirmed');
  const mint = new PublicKey(mintArg);
  const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
  const [pda] = PublicKey.findProgramAddressSync([
    Buffer.from('metadata'),
    METADATA_PROGRAM_ID.toBuffer(),
    mint.toBuffer(),
  ], METADATA_PROGRAM_ID);

  console.log('Metadata PDA:', pda.toBase58());
  const info = await conn.getAccountInfo(pda);
  if (!info) {
    console.error('No metadata account found');
    process.exit(2);
  }

  const buf = info.data;
  // Layout based on Metaplex token metadata: key(1) + updateAuthority(32) + mint(32) then data {
  // name: 32 bytes, symbol: 10 bytes, uri: 200 bytes }
  let offset = 0;
  const key = buf.readUInt8(offset); offset += 1;
  const updateAuthority = buf.slice(offset, offset + 32).toString('hex'); offset += 32;
  const mintBuf = buf.slice(offset, offset + 32); offset += 32;
  const name = buf.slice(offset, offset + 32).toString('utf8').replace(/\0/g, '').trim(); offset += 32;
  const symbol = buf.slice(offset, offset + 10).toString('utf8').replace(/\0/g, '').trim(); offset += 10;
  const uri = buf.slice(offset, offset + 200).toString('utf8').replace(/\0/g, '').trim(); offset += 200;

  console.log('Key (enum):', key);
  console.log('Update Authority (hex):', updateAuthority);
  console.log('Mint (raw):', mintBuf.toString('hex'));
  console.log('Name:', name);
  console.log('Symbol:', symbol);
  console.log('URI:', uri);

  // Try to fetch the off-chain JSON if URI is HTTP or ipfs via gateway
  if (uri.startsWith('http')) {
    try {
      // Use global fetch available in Node 18+ (GitHub Actions uses Node 18)
      const fetchImpl = globalThis.fetch;
      if (typeof fetchImpl !== 'function') throw new Error('global fetch is not available in this runtime');
      const res = await fetchImpl(uri, { timeout: 10000 });
      if (res.ok) {
        const j = await res.json();
        console.log('\nOff-chain JSON contents:');
        console.log('  name:', j.name);
        console.log('  symbol:', j.symbol);
        console.log('  description:', j.description || '(none)');
        console.log('  image:', j.image);
      } else {
        console.log('Failed to fetch off-chain JSON, status:', res.status);
      }
    } catch (e) {
      console.log('Error fetching off-chain JSON:', e.message || e);
    }
  } else if (uri.startsWith('ipfs://')) {
    console.log('URI is ipfs:// — you can fetch via a gateway, e.g. https://nftstorage.link/' + uri.replace('ipfs://', 'ipfs/'));
  } else {
    console.log('URI is non-http/ipfs:', uri);
  }
}

main().catch(err => { console.error('Error:', err); process.exit(1); });
