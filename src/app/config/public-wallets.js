// Multisig wallets shown on the Public tab in addition to WalletFactory.getPublicWallets().
// The factory sets the public flag only at creation and has no setter, so wallets created as
// non-public that should be listed publicly go here.
export const EXTRA_PUBLIC_WALLETS = {
  mainnet: [
    '0x6B1C34Eb97391216DF5ddD82Eb0B5dE51e39C4d6', // Pretrend Revenue (3-of-3, VUSD)
  ],
  testnet: [],
};
