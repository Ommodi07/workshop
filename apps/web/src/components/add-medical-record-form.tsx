'use client';

import { useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import type { Address } from 'viem';
import { uploadFileToIPFS, uploadJSONToIPFS } from '@/utils/ipfs';
import { encryptFile } from '@/utils/encryption';
import {
  appendMedicalRecord,
  createPatientHealthMetadata,
  validatePatientHealthMetadata,
  type MedicalRecordMetadata,
  type PatientHealthNFTMetadata,
} from '@/lib/medical-metadata';
import { appendActivityLog } from '@/lib/activity-log';

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
const MAX_FILES_PER_RECORD = 5;
const RECORD_TYPE_PATTERN = /^[a-zA-Z0-9\s\-_/]{1,64}$/;

interface MetadataPublishResult {
  metadataCid: string;
  metadataIpfsUri: string;
  metadataGatewayUrl: string;
  fileCids: string[];
}

function getMetadataKey(tokenId: string): string {
  return `medical-nft:pending-metadata:${tokenId}`;
}

function getMetadataPointerKey(tokenId: string): string {
  return `medical-nft:metadata-pointer:${tokenId}`;
}

export function AddMedicalRecordForm() {
  const { address } = useAccount();
  const [tokenId, setTokenId] = useState('');
  const [recordType, setRecordType] = useState('MRI');
  const [recordDate, setRecordDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [encryptionKey, setEncryptionKey] = useState('');
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [publishResult, setPublishResult] = useState<MetadataPublishResult | null>(null);
  const [metadataPreview, setMetadataPreview] = useState<PatientHealthNFTMetadata | null>(null);

  const acceptedTypes = useMemo(
    () => '.pdf,.png,.jpg,.jpeg,.webp,.dcm,application/pdf,image/*',
    [],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!address) {
      setStatus('error');
      setError('Connect wallet before adding records.');
      return;
    }
    if (!tokenId.trim() || !/^\d+$/.test(tokenId.trim())) {
      setStatus('error');
      setError('Token ID must be a non-negative integer.');
      return;
    }
    if (!recordType.trim() || !RECORD_TYPE_PATTERN.test(recordType.trim())) {
      setStatus('error');
      setError('Record type must be 1-64 chars and use letters, numbers, spaces, -, _, /.');
      return;
    }
    if (!recordDate || !/^\d{4}-\d{2}-\d{2}$/.test(recordDate)) {
      setStatus('error');
      setError('Record date must be in YYYY-MM-DD format.');
      return;
    }
    if (selectedFiles.length === 0) {
      setStatus('error');
      setError('Select at least one medical file to upload.');
      return;
    }
    if (selectedFiles.length > MAX_FILES_PER_RECORD) {
      setStatus('error');
      setError(`You can upload up to ${MAX_FILES_PER_RECORD} files per record.`);
      return;
    }
    if (selectedFiles.some((file) => file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES)) {
      setStatus('error');
      setError('Each file must be between 1 byte and 25MB.');
      return;
    }
    if (!encryptionKey || encryptionKey.trim().length < 8) {
      setStatus('error');
      setError('Encryption key must be at least 8 characters.');
      return;
    }

    setStatus('submitting');
    setError(null);
    setPublishResult(null);

    try {
      const metadataKey = getMetadataKey(tokenId);
      const existingMetadataRaw = localStorage.getItem(metadataKey);
      const baseMetadata: PatientHealthNFTMetadata = existingMetadataRaw
        ? (JSON.parse(existingMetadataRaw) as PatientHealthNFTMetadata)
        : createPatientHealthMetadata(address as Address, []);

      validatePatientHealthMetadata(baseMetadata);

      // Step 6 submit flow:
      // 1) Encrypt file
      // 2) Upload encrypted file to IPFS
      // 3) Append record to metadata
      // 4) Publish updated metadata JSON to IPFS
      // Optional advanced feature: allow multiple files in a single medical record entry.
      const uploadedFiles = await Promise.all(
        selectedFiles.map((file) =>
          uploadFileToIPFS(file, {
            encryptFile: async (inputFile) => encryptFile(inputFile, encryptionKey),
            fileName: `${file.name}.enc.json`,
            contentType: 'application/json',
          }),
        ),
      );
      const fileCids = uploadedFiles.map((file) => file.cid);

      const record: MedicalRecordMetadata = {
        type: recordType.trim(),
        date: recordDate,
        cid: fileCids[0],
        cids: fileCids,
        encrypted: true,
      };

      const updatedMetadata = appendMedicalRecord(baseMetadata, record);
      const metadataUpload = await uploadJSONToIPFS(updatedMetadata, {
        name: `patient-health-metadata-token-${tokenId}.json`,
      });

      // Dynamic metadata pointer (app-side) for the selected token.
      // This is used until a dedicated backend metadata API is introduced.
      localStorage.setItem(metadataKey, JSON.stringify(updatedMetadata));
      localStorage.setItem(
        getMetadataPointerKey(tokenId),
        JSON.stringify({
          tokenId,
          cid: metadataUpload.cid,
          ipfsUri: metadataUpload.ipfsUri,
          gatewayUrl: metadataUpload.gatewayUrl,
          updatedAt: new Date().toISOString(),
        }),
      );

      setMetadataPreview(updatedMetadata);
      setPublishResult({
        metadataCid: metadataUpload.cid,
        metadataIpfsUri: metadataUpload.ipfsUri,
        metadataGatewayUrl: metadataUpload.gatewayUrl,
        fileCids,
      });
      appendActivityLog({
        action: 'ADD_RECORD',
        actor: address,
        tokenId: tokenId.trim(),
        details: `Type: ${record.type}, Files: ${fileCids.length}`,
      });
      setStatus('success');
    } catch (submitError) {
      setStatus('error');
      setError(submitError instanceof Error ? submitError.message : String(submitError));
    } finally {
      // Security: remove key from component state after operation completes.
      setEncryptionKey('');
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {/* Token ID */}
      <div className="space-y-2">
        <label htmlFor="tokenId" className="label-base">
          NFT Token ID
        </label>
        <input
          id="tokenId"
          type="text"
          placeholder="Enter your medical NFT token ID"
          value={tokenId}
          onChange={(event) => {
            setTokenId(event.target.value);
            setStatus('idle');
            setError(null);
          }}
          className="input-base"
        />
        <p className="helper-text">
          The unique identifier of your medical identity NFT
        </p>
      </div>

      {/* Record Type & Date */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="recordType" className="label-base">
            Record Type
          </label>
          <select
            id="recordType"
            value={recordType}
            onChange={(event) => {
              setRecordType(event.target.value);
              setStatus('idle');
              setError(null);
            }}
            className="input-base"
          >
            <option>MRI</option>
            <option>CT Scan</option>
            <option>X-Ray</option>
            <option>Blood Test</option>
            <option>Ultrasound</option>
            <option>ECG</option>
            <option>Prescription</option>
            <option>Lab Report</option>
            <option>Other</option>
          </select>
          <p className="helper-text">
            Type of medical examination or test
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="recordDate" className="label-base">
            Date of Record
          </label>
          <input
            id="recordDate"
            type="date"
            value={recordDate}
            onChange={(event) => {
              setRecordDate(event.target.value);
              setStatus('idle');
              setError(null);
            }}
            className="input-base"
          />
          <p className="helper-text">
            When the test/examination was performed
          </p>
        </div>
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <label htmlFor="files" className="label-base">
          Medical Documents
        </label>
        <div className="relative">
          <input
            id="files"
            type="file"
            multiple
            accept={acceptedTypes}
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              setSelectedFiles(files);
              setStatus('idle');
              setError(null);
            }}
            className="hidden"
          />
          <label
            htmlFor="files"
            className="cursor-pointer block rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition hover:border-blue-400 dark:border-gray-700 dark:hover:border-blue-600"
          >
            <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16v4m0 0l-3-3m3 3l3-3m0-8V8m0 0l-3 3m3-3l3 3" />
            </svg>
            <p className="mt-2 font-medium text-gray-700 dark:text-gray-300">
              Drop files here or click to select
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              PDF, PNG, JPG, DICOM up to 25MB each (max 5 files)
            </p>
          </label>
        </div>

        {selectedFiles.length > 0 && (
          <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
            </p>
            <div className="space-y-1">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="truncate text-gray-600 dark:text-gray-400">{file.name}</span>
                  </div>
                  <span className="text-gray-500 dark:text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 pt-2 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Total size: {(selectedFiles.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        )}

        <p className="helper-text">
          Files will be encrypted locally before upload to IPFS
        </p>
      </div>

      {/* Encryption Key */}
      <div className="space-y-2">
        <label htmlFor="encryptionKey" className="label-base">
          Encryption Password
        </label>
        <input
          id="encryptionKey"
          type="password"
          placeholder="Create a strong password (min 8 characters)"
          value={encryptionKey}
          autoComplete="off"
          onChange={(event) => {
            setEncryptionKey(event.target.value);
            setStatus('idle');
            setError(null);
          }}
          className="input-base"
        />
        <p className="helper-text">
          This password will be used to encrypt your files. Keep it safe - only doctors you share it with can decrypt records.
        </p>
      </div>

      {/* Error Alert */}
      {status === 'error' && error && (
        <div className="alert-error">
          <svg className="h-5 w-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-red-700 dark:text-red-300">
            <p className="font-medium">Failed to add record</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="btn-primary w-full"
      >
        {status === 'submitting' ? (
          <>
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Processing...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Record
          </>
        )}
      </button>

      {/* Success Alert */}
      {status === 'success' && publishResult && (
        <div className="alert-success">
          <svg className="h-5 w-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-emerald-700 dark:text-emerald-300">
            <p className="font-medium">Record added successfully!</p>
            <div className="mt-3 space-y-2">
              <div>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">File CIDs:</p>
                <p className="text-xs font-mono text-emerald-700 dark:text-emerald-300 break-all">
                  {publishResult.fileCids.join(', ')}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Metadata CID:</p>
                <p className="text-xs font-mono text-emerald-700 dark:text-emerald-300 break-all">
                  {publishResult.metadataCid}
                </p>
              </div>
              <a
                href={publishResult.metadataGatewayUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                View on IPFS Gateway
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Metadata Preview */}
      {metadataPreview && (
        <details className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
          <summary className="cursor-pointer font-medium text-gray-900 dark:text-white">
            View Updated Metadata
          </summary>
          <div className="mt-3 overflow-auto rounded bg-gray-50 p-3 dark:bg-gray-800/50">
            <pre className="text-xs text-gray-700 dark:text-gray-300">
              {JSON.stringify(metadataPreview, null, 2)}
            </pre>
          </div>
        </details>
      )}
    </form>
  );
}

