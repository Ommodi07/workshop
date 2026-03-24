'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Header } from '@/components/header';
import { WalletButton } from '@/components/wallet-button';
import { RoleSelector } from '@/components/role-selector';
import { DoctorDashboard, PatientDashboard } from '@/components/role-dashboards';
import { useUserRole } from '@/context/user-role-context';

export default function Home() {
  const { isConnected, address } = useAccount();
  const { role, setRole, clearRole } = useUserRole();

  useEffect(() => {
    if (!isConnected) {
      clearRole();
    }
  }, [isConnected, clearRole]);

  const renderContent = () => {
    if (!isConnected) {
      return <LandingPage />;
    }

    if (!role) {
      return (
        <div className="space-y-6">
          <RoleSelector onSelectRole={setRole} />
        </div>
      );
    }

    if (role === 'patient') {
      return (
        <PatientDashboard onSwitchRole={() => clearRole()} />
      );
    }

    if (role === 'doctor') {
      return (
        <DoctorDashboard onSwitchRole={() => clearRole()} />
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <Header showRole={!!role} currentRole={role} onRoleSwitch={() => clearRole()} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {renderContent()}
      </main>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="space-y-12 text-center">
      {/* Hero Section */}
      <div className="space-y-6 pt-12">
        <div className="inline-flex">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600">
            <svg
              className="h-10 w-10 text-white"
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
        </div>

        <div className="space-y-2">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            Your Health Records,
            <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Your Control
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-600 dark:text-gray-400">
            Secure, decentralized medical records. Own your health data with blockchain-backed NFTs. Decide who sees what, when.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mx-auto max-w-4xl pt-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white/50 p-4 backdrop-blur dark:border-gray-800 dark:bg-gray-900/30">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Secure</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Encrypted, tamper-proof records on the blockchain</p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white/50 p-4 backdrop-blur dark:border-gray-800 dark:bg-gray-900/30">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Instant Access</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Share records instantly with healthcare providers</p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white/50 p-4 backdrop-blur dark:border-gray-800 dark:bg-gray-900/30">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">You Own It</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">NFT-backed ownership - hospitals don't control your data</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="space-y-4 pt-8">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Getting started takes minutes</p>
        <div className="flex justify-center gap-4">
          <WalletButton />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          Secure your health records powered by blockchain technology
        </p>
      </div>
    </div>
  );
}