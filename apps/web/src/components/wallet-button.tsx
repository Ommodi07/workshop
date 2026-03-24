'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';

export function WalletButton() {
  return (
    // Primary wallet entry point used by the home page.
    // RainbowKit handles connect/disconnect, account state, and chain display.
    <ConnectButton 
      showBalance={true}
      chainStatus="icon"
      accountStatus="address"
    />
  );
}