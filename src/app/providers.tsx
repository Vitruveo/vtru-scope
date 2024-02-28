'use client';

import * as React from 'react';
import {
  RainbowKitProvider,
  getDefaultWallets,
  connectorsForWallets,
  Theme,
  darkTheme,
  lightTheme
} from '@rainbow-me/rainbowkit';
import {
  argentWallet,
  trustWallet,
  ledgerWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import {
  arbitrum,
  base,
  mainnet,
  optimism,
  polygon,
  sepolia,
  zora,
  goerli,
  bsc,
  bscTestnet
} from 'wagmi/chains';
import merge from 'lodash.merge';

const ethereum = {
  id: 1,
  name: 'Ethereum',
  network: 'ethereum',
  iconUrl: '/images/eth.svg',
  iconBackground: '#fff',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: [process.env.NEXT_PUBLIC_INFURA] },
    default: { http: [process.env.NEXT_PUBLIC_INFURA] },
  },
  blockExplorers: {
    default: { name: 'Etherscan', url: 'https://etherscan.io' },
    etherscan: { name: 'Etherscan', url: 'https://etherscan.io' },
  },
  testnet: false,
};

const vitruveo = {
  id: 1490,
  name: 'Vitruveo',
  network: 'vitruveo',
  iconUrl: 'https://irp.cdn-website.com/a01407ef/dms3rep/multi/fav-vit-857c1762.png',
  iconBackground: '#fff',
  nativeCurrency: {
    decimals: 18,
    name: 'Vitruveo',
    symbol: 'VTRU',
  },
  rpcUrls: {
    public: { http: ['https://rpc.vitruveo.xyz/'] },
    default: { http: ['https://rpc.vitruveo.xyz/'] },
  },
  blockExplorers: {
    default: { name: 'VitruveoScan', url: 'https://explorer.vitruveo.xyz' },
    etherscan: { name: 'VitruveoScan', url: 'https://explorer.vitruveo.xyz' },
  },
  testnet: false,
};

const vitruveoTestnet = {
  id: 14333,
  name: 'Vitruveo Testnet',
  network: 'vitruveo-testnet',
  iconUrl: 'https://irp.cdn-website.com/a01407ef/dms3rep/multi/fav-vit-857c1762.png',
  iconBackground: '#fff',
  nativeCurrency: {
    decimals: 18,
    name: 'Vitruveo Testnet',
    symbol: 'tVTRU',
  },
  rpcUrls: {
    public: { http: ['https://test-rpc.vitruveo.xyz/'] },
    default: { http: ['https://test-rpc.vitruveo.xyz/'] },
  },
  blockExplorers: {
    default: { name: 'VitruveoScan', url: 'https://test-explorer.vitruveo.xyz' },
    etherscan: { name: 'VitruveoScan', url: 'https://test-explorer.vitruveo.xyz' },
  },
  testnet: false,
};

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [...process.env.NEXT_PUBLIC_IS_TESTNET == "true" ? [vitruveoTestnet] : [vitruveo]],
  [publicProvider()]
);

const projectId = 'vtru';

const { wallets } = getDefaultWallets({
  appName: 'vtru',
  projectId,
  chains,
});

const demoAppInfo = {
  appName: 'vtru',
};

const connectors = connectorsForWallets([
  ...wallets,
  // {
  //   groupName: 'Other',
  //   wallets: [
  //     argentWallet({ projectId, chains }),
  //     trustWallet({ projectId, chains }),
  //     ledgerWallet({ projectId, chains }),
  //   ],
  // },
]);
const myTheme = merge(lightTheme(), {
  colors: {
    accentColor: '#763EBD',
  },
} as Theme);
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains} appInfo={demoAppInfo} theme={myTheme}>
        {mounted && children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
