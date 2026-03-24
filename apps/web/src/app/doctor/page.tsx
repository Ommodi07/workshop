'use client';

import Link from 'next/link';
import { useAccount } from 'wagmi';
import { WalletButton } from '@/components/wallet-button';
import { DoctorRecordDashboard } from '@/components/doctor-record-dashboard';
import { ActivityLogPanel } from '@/components/activity-log-panel';

export default function DoctorPage() {
  const { isConnected, address } = useAccount();

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-16">
      <div className="w-full max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Doctor Portal</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Verify access and view authorized patient metadata records.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Back to Home
            </Link>
            <WalletButton />
          </div>
        </div>

        {!isConnected && (
          <div className="mb-6 rounded-md border border-dashed border-gray-300 p-4 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400">
            Connect your wallet to continue.
          </div>
        )}

        <div className="space-y-4">
          <DoctorRecordDashboard />
          <ActivityLogPanel actorAddress={address} />
        </div>
      </div>
    </main>
  );
}
