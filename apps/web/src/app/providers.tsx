
    'use client';

import { useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '@/lib/wagmi';
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { UserRoleProvider } from '@/context/user-role-context';
import '@rainbow-me/rainbowkit/styles.css';

    export function Providers({ children }: { children: React.ReactNode }) {
      const [queryClient] = useState(() => new QueryClient());

      return (
      // Wallet stack order:
      // 1) WagmiProvider exposes wallet + chain clients
      // 2) QueryClientProvider caches async Web3 calls
      // 3) RainbowKitProvider renders wallet UI components (ConnectButton, modals)
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          
        <RainbowKitProvider
          theme={{
            lightMode: lightTheme(),
            darkMode: darkTheme(),
          }}
        >
          {/* Global role state for patient/doctor UI flow */}
          <UserRoleProvider>{children}</UserRoleProvider>
        </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
      );
    }
  