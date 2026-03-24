'use client';

import { useMemo, useState } from 'react';
import { uploadFileToIPFS } from '@/utils/ipfs';
import { encryptFile } from '@/utils/encryption';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface UploadResult {
  cid: string;
  ipfsUri: string;
  gatewayUrl: string;
}

export function MedicalFileUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [encryptionKey, setEncryptionKey] = useState('');
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  const acceptedTypes = useMemo(
    () => '.pdf,.png,.jpg,.jpeg,.webp,.dcm,application/pdf,image/*',
    [],
  );

  const handleUpload = async () => {
    if (!selectedFile) {
      return;
    }

    if (!encryptionKey || encryptionKey.trim().length < 8) {
      setStatus('error');
      setError('Encryption key must be at least 8 characters long.');
      return;
    }

    setStatus('uploading');
    setError(null);
    setResult(null);

    try {
      const uploaded = await uploadFileToIPFS(selectedFile, {
        // Encrypt before upload. Only encrypted payload is pinned to IPFS.
        encryptFile: async (file) => encryptFile(file, encryptionKey),
        fileName: `${selectedFile.name}.enc.json`,
        contentType: 'application/json',
      });

      setResult(uploaded);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <section className="w-full rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-1 text-lg font-semibold">Upload Medical File to IPFS</h3>
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Flow: file selection, encryption stage hook, IPFS upload, and CID return.
      </p>
      <p className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
        Security: encryption key stays in this client session only. Do not store it on-chain.
      </p>

      <div className="space-y-3">
        <input
          type="password"
          placeholder="Enter encryption key (min 8 chars)"
          value={encryptionKey}
          onChange={(event) => {
            setEncryptionKey(event.target.value);
            setStatus('idle');
            setError(null);
          }}
          className="block w-full rounded-md border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
        />

        <input
          type="file"
          accept={acceptedTypes}
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            setSelectedFile(file);
            setStatus('idle');
            setError(null);
            setResult(null);
          }}
          className="block w-full rounded-md border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
        />

        {selectedFile && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Selected: {selectedFile.name} ({Math.ceil(selectedFile.size / 1024)} KB)
          </p>
        )}

        <button
          type="button"
          onClick={handleUpload}
          disabled={!selectedFile || !encryptionKey || status === 'uploading'}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'uploading' ? 'Uploading...' : 'Upload to IPFS'}
        </button>
      </div>

      {status === 'error' && error && (
        <p className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
          Upload failed: {error}
        </p>
      )}

      {status === 'success' && result && (
        <div className="mt-4 space-y-2 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
          <p>Upload complete.</p>
          <p className="break-all">CID: {result.cid}</p>
          <p className="break-all">IPFS URI: {result.ipfsUri}</p>
          <a
            href={result.gatewayUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block underline"
          >
            Open via gateway
          </a>
        </div>
      )}
    </section>
  );
}
