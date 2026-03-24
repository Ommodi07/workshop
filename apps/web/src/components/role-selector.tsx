'use client';

import type { UserRole } from '@/context/user-role-context';

interface RoleSelectorProps {
  onSelectRole: (role: UserRole) => void;
}

export function RoleSelector({ onSelectRole }: RoleSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Choose your role</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Select how you want to use the platform in this session.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Patient Card */}
        <button
          type="button"
          onClick={() => onSelectRole('patient')}
          className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:border-blue-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-700"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-blue-900/20" />
          
          <div className="relative space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <svg
                className="h-7 w-7 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <div className="space-y-2 text-left">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Patient Portal</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Mint your medical identity NFT and securely manage your health records
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400">With this role, you can:</p>
              <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  Create medical records
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  Grant doctor access
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  View activity logs
                </li>
              </ul>
            </div>
          </div>

          <div className="pointer-events-none absolute right-4 top-4 transition-transform group-hover:translate-x-1">
            <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        {/* Doctor Card */}
        <button
          type="button"
          onClick={() => onSelectRole('doctor')}
          className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:border-emerald-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-emerald-700"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-emerald-900/20" />
          
          <div className="relative space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <svg
                className="h-7 w-7 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>

            <div className="space-y-2 text-left">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Doctor Portal</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Access approved patient records and provide medical consultations
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">With this role, you can:</p>
              <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Request record access
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  View decrypt medical data
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Track access logs
                </li>
              </ul>
            </div>
          </div>

          <div className="pointer-events-none absolute right-4 top-4 transition-transform group-hover:translate-x-1">
            <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>
    </div>
  );
}
