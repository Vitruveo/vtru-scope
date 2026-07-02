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
import { bsc } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { usePathname } from 'next/navigation';

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
    public: { http: ['https://rpc.vitruveo.ai/'] },
    default: { http: ['https://rpc.vitruveo.ai/'] },
  },
  blockExplorers: {
    default: { name: 'VitruveoScan', url: 'https://explorer.vitruveo.ai' },
    etherscan: { name: 'VitruveoScan', url: 'https://explorer.vitruveo.ai' },
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
    public: { http: ['https://test-rpc.vitruveo.ai/'] },
    default: { http: ['https://test-rpc.vitruveo.ai/'] },
  },
  blockExplorers: {
    default: { name: 'VitruveoScan', url: 'https://test-explorer.vitruveo.ai' },
    etherscan: { name: 'VitruveoScan', url: 'https://test-explorer.vitruveo.ai' },
  },
  testnet: false,
};

const projectId = '7a21b3d51f846061c7b618791d151066';
const appName = 'Vitruveo Scope';

const appInfo = {
  appName,
  learnMoreUrl: 'https://www.vitruveo.ai'
};

const myTheme = merge(darkTheme(), {
  colors: {
    accentColor: '#763EBD',
  },
} as Theme);

// Build a wagmi config for the given chain set. BSC is only included on the bridge route,
// so the rest of Scope never sees BSC as a supported network.
function buildWagmi(includeBsc: boolean) {
  const baseChains = process.env.NEXT_PUBLIC_IS_TESTNET == "true" ? [vitruveoTestnet] : [vitruveo];
  const { chains, publicClient, webSocketPublicClient } = configureChains(
    includeBsc ? [...baseChains, bsc] : baseChains,
    [publicProvider()]
  );
  const { wallets } = getDefaultWallets({ appName, projectId, chains });
  const connectors = connectorsForWallets([...wallets]);
  const wagmiConfig = createConfig({
    autoConnect: true,
    connectors,
    publicClient,
    webSocketPublicClient,
  });
  return { wagmiConfig, chains };
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const pathname = usePathname();
  const includeBsc = !!pathname && pathname.startsWith('/services/bridge');
  const { wagmiConfig, chains } = React.useMemo(() => buildWagmi(includeBsc), [includeBsc]);

  return (
    <WagmiConfig config={wagmiConfig} key={includeBsc ? 'with-bsc' : 'base'}>
      <RainbowKitProvider id={projectId} chains={chains} appInfo={appInfo} theme={myTheme}>
        {mounted && children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
