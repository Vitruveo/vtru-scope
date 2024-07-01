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

import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';

import merge from 'lodash.merge';

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

const projectId = '7a21b3d51f846061c7b618791d151066';
const appName = 'Vitruveo Scope';

const { wallets } = getDefaultWallets({
  appName,
  projectId,
  chains,
});

const appInfo = {
  appName,
  learnMoreUrl: 'https://www.vitruveo.xyz'
};

const connectors = connectorsForWallets([
  ...wallets,
]);
const myTheme = merge(darkTheme(), {
  colors: {
    accentColor: '#ffffff',
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
      <RainbowKitProvider id={projectId} chains={chains} appInfo={appInfo} theme={myTheme}>
        {mounted && children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
