import { http, createConfig, cookieStorage, createStorage } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { chains } from './chains';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';
const hasWalletConnectProjectId = projectId.trim().length > 0;

const sharedConfig = {
  chains,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
};

export const wagmiConfig = hasWalletConnectProjectId
  ? getDefaultConfig({
      // Full wallet stack (WalletConnect + injected wallets) when projectId is configured.
      appName: process.env.NEXT_PUBLIC_APP_NAME || 'My DApp',
      projectId,
      ...sharedConfig,
    })
  : createConfig({
      // Graceful local/dev fallback: injected wallets only.
      // This avoids runtime crash when WalletConnect projectId is not set.
      connectors: [injected({ shimDisconnect: true })],
      transports: Object.fromEntries(chains.map((chain) => [chain.id, http()])),
      ...sharedConfig,
    });


declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}