'use client';

import { useMemo, useState } from 'react';
import { clearActivityLogs, getActivityLogs, type ActivityAction } from '@/lib/activity-log';

interface ActivityLogPanelProps {
  actorAddress?: string;
}

function ActionBadge({ action }: { action: ActivityAction }) {
  const actionConfig: Record<ActivityAction, { label: string; color: 'blue' | 'emerald' | 'cyan' | 'red' | 'purple'; icon: string }> = {
    'ADD_RECORD': { label: 'Record Added', color: 'blue', icon: '📋' },
    'GRANT_ACCESS': { label: 'Access Granted', color: 'emerald', icon: '✓' },
    'GRANT_ACCESS_WITH_EXPIRY': { label: 'Expiry Set', color: 'cyan', icon: '⏱️' },
    'REVOKE_ACCESS': { label: 'Access Revoked', color: 'red', icon: '✕' },
    'CHECK_ACCESS': { label: 'Access Checked', color: 'purple', icon: '👁️' },
    'DECRYPT_RECORD_SUCCESS': { label: 'Decrypted', color: 'emerald', icon: '🔓' },
    'DECRYPT_RECORD_FAILURE': { label: 'Decrypt Failed', color: 'red', icon: '❌' },
  };

  const config = actionConfig[action];
  const colorClasses: Record<'blue' | 'emerald' | 'cyan' | 'red' | 'purple', string> = {
    blue: 'badge-info',
    emerald: 'badge-success',
    cyan: 'inline-flex items-center gap-1 rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
    red: 'badge-error',
    purple: 'inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  };

  return (
    <div className={colorClasses[config.color]}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </div>
  );
}

export function ActivityLogPanel({ actorAddress }: ActivityLogPanelProps) {
  const [refreshTick, setRefreshTick] = useState(0);

  const logs = useMemo(() => {
    const allLogs = getActivityLogs();
    if (!actorAddress) {
      return allLogs;
    }

    const normalizedActor = actorAddress.toLowerCase();
    return allLogs.filter((entry) => entry.actor.toLowerCase() === normalizedActor);
  }, [actorAddress, refreshTick]);

  const sortedLogs = [...logs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {actorAddress ? 'Your activity' : 'All activity'} on this browser ({logs.length} {logs.length === 1 ? 'entry' : 'entries'})
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRefreshTick((value) => value + 1)}
            className="btn-secondary"
            title="Refresh activity log"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              clearActivityLogs();
              setRefreshTick((value) => value + 1);
            }}
            className={`inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-red-100 dark:border-red-700/50 dark:bg-red-900/20 dark:hover:bg-red-900/40`}
            title="Clear all logs"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear
          </button>
        </div>
      </div>

      {/* Activity List */}
      {logs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-900/30">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 3v5a2 2 0 002 2h5" />
          </svg>
          <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">No activity yet</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Actions will appear here</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900/50">
          {sortedLogs.slice(0, 20).map((entry) => (
            <div
              key={entry.id}
              className="flex flex-col gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <ActionBadge action={entry.action} />
                <time className="text-xs text-gray-500 dark:text-gray-500">
                  {new Date(entry.createdAt).toLocaleString()}
                </time>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Actor:</span>{' '}
                    <code className="bg-gray-100 px-2 py-0.5 rounded dark:bg-gray-800 text-gray-900 dark:text-gray-200">
                      {entry.actor.slice(0, 6)}...{entry.actor.slice(-4)}
                    </code>
                  </p>
                </div>

                {entry.tokenId && (
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Token ID:</span>{' '}
                    <code className="bg-gray-100 px-2 py-0.5 rounded dark:bg-gray-800 text-gray-900 dark:text-gray-200">
                      #{entry.tokenId}
                    </code>
                  </p>
                )}

                {entry.details && (
                  <p className="text-gray-600 dark:text-gray-400 break-words">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Details:</span>{' '}
                    {entry.details}
                  </p>
                )}
              </div>
            </div>
          ))}
          
          {sortedLogs.length > 20 && (
            <div className="p-3 text-center text-xs text-gray-500 dark:text-gray-500">
              Showing 20 of {sortedLogs.length} entries
            </div>
          )}
        </div>
      )}
    </div>
  );
}
