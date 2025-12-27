# Metadata runner and compatibility shim

What I changed to make metadata creation work with current dependencies:

- Added a compatibility shim for `@solana/spl-token` inside `node_modules` so the project's TypeScript scripts can run without downgrading dependencies. The shim re-exports the original API and provides named functions (`createMint`, `getOrCreateAssociatedTokenAccount`, `mintTo`, `transfer`) used by the TS scripts.
- Added `run-create-metadata.js` (and updated `2-create-token-metadata.ts`) which build the `CreateMetadataAccountV3` instruction using the generated serializer from `@metaplex-foundation/mpl-token-metadata` and send it directly. This avoids the UMI transaction builder and resolves ESM resolution mismatches.

How to run metadata creation (devnet):

1. Ensure `.env` contains `SECRET_KEY=[...]` (an array of secret key bytes).
2. Create the mint (if not already created):

```powershell
npx ts-node-esm --transpile-only create-token-mint.ts devnet
```

3. Create metadata (either):

Using the TypeScript script (updated):

```powershell
npx ts-node-esm --transpile-only 2-create-token-metadata.ts devnet <MINT_ADDRESS>
```

Or using the plain JS runner (already provided):

```powershell
node run-create-metadata.js devnet <MINT_ADDRESS>
```

Notes:

- I modified `node_modules` to add a shim for `@solana/spl-token`. If you'd rather avoid that, I can revert it and pin package versions instead.
- The TS update mirrors the JS runner and should be more maintainable than a node_modules hack long-term.
