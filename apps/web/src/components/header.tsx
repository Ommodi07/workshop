'use client';

import { useAccount } from 'wagmi';
import { WalletButton } from './wallet-button';

interface HeaderProps {
  showRole?: boolean;
  currentRole?: 'patient' | 'doctor' | null;
  onRoleSwitch?: () => void;
}

export function Header({ showRole = false, currentRole, onRoleSwitch }: HeaderProps) {
  const { isConnected } = useAccount();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo & Branding */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m7.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">MedicalNFT</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Secure Health Records</p>
          </div>
        </div>

        {/* Right Section: Role + Wallet */}
        <div className="flex items-center gap-4">
          {showRole && currentRole && (
            <div className="hidden sm:flex items-center gap-3">
              <div
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
                  currentRole === 'patient'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    currentRole === 'patient' ? 'bg-blue-500' : 'bg-emerald-500'
                  }`}
                />
                {currentRole === 'patient' ? 'Patient' : 'Doctor'}
              </div>
              {onRoleSwitch && (
                <button
                  onClick={onRoleSwitch}
                  className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition"
                >
                  Switch
                </button>
              )}
            </div>
          )}

          {isConnected && (
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-800" />
          )}

          <WalletButton />
        </div>
      </div>
    </header>
  );
}
