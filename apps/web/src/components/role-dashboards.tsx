'use client';

import { ERC721NFTPanel } from '@/lib/erc721-stylus/components/ERC721NFTPanel';
import { AddMedicalRecordForm } from '@/components/add-medical-record-form';
import { AccessControlPanel } from '@/components/access-control-panel';
import { ActivityLogPanel } from '@/components/activity-log-panel';
import { DoctorRecordDashboard } from '@/components/doctor-record-dashboard';

interface DashboardProps {
  onSwitchRole?: () => void;
}

function SectionHeader({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className: string }>;
}) {
  return (
    <div className="space-y-3 border-b border-gray-200 pb-6 dark:border-gray-800">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
          <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

export function PatientDashboard({ onSwitchRole }: DashboardProps) {
  return (
    <div className="space-y-8">
      <SectionHeader
        title="Your Medical Records"
        subtitle="Manage your NFT-backed health data with full control over access and privacy"
        icon={(props) => (
          <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      />

      {/* NFT Panel */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">NFT Management</h3>
        <div className="card">
          <ERC721NFTPanel />
        </div>
      </div>

      {/* Add Medical Record */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Medical Records</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Upload encrypted medical documents. Supports multiple file formats and batch uploads up to 5 files per record.
        </p>
        <div className="card">
          <AddMedicalRecordForm />
        </div>
      </div>

      {/* Access Control */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Access Management</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Grant or revoke doctor access with optional expiry dates. Track all access activity in real-time.
        </p>
        <div className="card">
          <AccessControlPanel />
        </div>
      </div>

      {/* Activity Log */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Audit Trail</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Complete record of all actions performed on your medical data and access permissions.
        </p>
        <div className="card">
          <ActivityLogPanel />
        </div>
      </div>

      {/* Switch Role */}
      {onSwitchRole && (
        <div className="pt-4">
          <button
            onClick={onSwitchRole}
            className="btn-secondary w-full"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12M8 7a2 2 0 010-4h12a2 2 0 010 4M8 7v10a2 2 0 002 2h8a2 2 0 002-2V7m-10-4h4" />
            </svg>
            Switch to Doctor Role
          </button>
        </div>
      )}
    </div>
  );
}

export function DoctorDashboard({ onSwitchRole }: DashboardProps) {
  return (
    <div className="space-y-8">
      <SectionHeader
        title="Patient Records"
        subtitle="View and manage approved patient medical records with full audit trails"
        icon={(props) => (
          <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        )}
      />

      {/* Doctor Records  */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Approved Patient Records</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Access patient medical records that you have been granted permission to view. Use decryption keys provided by patients.
        </p>
        <div className="card">
          <DoctorRecordDashboard />
        </div>
      </div>

      {/* Switch Role */}
      {onSwitchRole && (
        <div className="pt-4">
          <button
            onClick={onSwitchRole}
            className="btn-secondary w-full"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12M8 7a2 2 0 010-4h12a2 2 0 010 4M8 7v10a2 2 0 002 2h8a2 2 0 002-2V7m-10-4h4" />
            </svg>
            Switch to Patient Role
          </button>
        </div>
      )}
    </div>
  );
}
