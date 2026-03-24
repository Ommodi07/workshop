'use client';

import { useEffect, useMemo, useState } from 'react';
import { isAddress } from 'viem/utils';
import type { Address } from 'viem';
import { useAccount } from 'wagmi';
import { useERC721Interactions } from '@/lib/erc721-stylus/src';
import type { MedicalRecordMetadata, PatientHealthNFTMetadata } from '@/lib/medical-metadata';
import { decryptFile } from '@/utils/encryption';
import { appendActivityLog } from '@/lib/activity-log';

const NFT_ADDRESS = process.env.NEXT_PUBLIC_NFT_ADDRESS as Address;
const CID_PATTERN = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z0-9]{20,})$/;

type AccessState = 'idle' | 'checking' | 'allowed' | 'denied' | 'error';

interface DecryptedRecordView {
  fileName: string;
  mimeType: string;
  objectUrl: string;
}

function getRecordCids(record: MedicalRecordMetadata): string[] {
  if (Array.isArray(record.cids) && record.cids.length > 0) {
    return record.cids;
  }

  return [record.cid];
}

function resolveGatewayUrl(input: string): string {
  if (input.startsWith('http://') || input.startsWith('https://')) {
    return input;
  }

  if (input.startsWith('ipfs://')) {
    const cid = input.replace('ipfs://', '');
    const base = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs';
    return `${base}/${cid}`;
  }

  return input;
}

async function fetchMetadataFromPointer(tokenId: string): Promise<PatientHealthNFTMetadata | null> {
  const pointerRaw = localStorage.getItem(`medical-nft:metadata-pointer:${tokenId}`);
  if (!pointerRaw) {
    return null;
  }

  try {
    const pointer = JSON.parse(pointerRaw) as { gatewayUrl?: string; cid?: string };
    const base = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs';
    const url = pointer.gatewayUrl || (pointer.cid ? `${base}/${pointer.cid}` : '');
    if (!url) {
      return null;
    }

    const response = await fetch(resolveGatewayUrl(url));
    if (!response.ok) {
      return null;
    }

    return (await response.json()) as PatientHealthNFTMetadata;
  } catch {
    return null;
  }
}

export function DoctorRecordDashboard() {
  const { address: doctorAddress, isConnected } = useAccount();
  const [tokenIdInput, setTokenIdInput] = useState('');
  const [accessState, setAccessState] = useState<AccessState>('idle');
  const [accessExpiryText, setAccessExpiryText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<PatientHealthNFTMetadata | null>(null);
  const [recordKeys, setRecordKeys] = useState<Record<string, string>>({});
  const [recordDecrypting, setRecordDecrypting] = useState<Record<string, boolean>>({});
  const [recordErrors, setRecordErrors] = useState<Record<string, string>>({});
  const [decryptedViews, setDecryptedViews] = useState<Record<string, DecryptedRecordView>>({});

  const nft = useERC721Interactions({
    contractAddress: NFT_ADDRESS,
    network: 'arbitrum-sepolia',
    userAddress: doctorAddress,
  });

  const canRun = useMemo(() => isConnected && !!doctorAddress && !!NFT_ADDRESS, [isConnected, doctorAddress]);

  useEffect(() => {
    // Release object URLs to avoid memory leaks when previews change/unmount.
    return () => {
      Object.values(decryptedViews).forEach((view) => {
        URL.revokeObjectURL(view.objectUrl);
      });
    };
  }, [decryptedViews]);

  const handleDecryptRecord = async (recordKey: string, tokenId: string, cid: string) => {
    const key = recordKeys[recordKey] || '';
    if (!key || key.trim().length < 8) {
      setRecordErrors((prev) => ({
        ...prev,
        [recordKey]: 'Decryption key must be at least 8 characters.',
      }));
      return;
    }

    setRecordDecrypting((prev) => ({ ...prev, [recordKey]: true }));
    setRecordErrors((prev) => ({ ...prev, [recordKey]: '' }));

    try {
      if (!CID_PATTERN.test(cid)) {
        throw new Error('Invalid CID format in metadata record');
      }

      // Step 10 flow:
      // 1) get CID from metadata
      // 2) fetch encrypted file from IPFS gateway
      // 3) decrypt with user-provided key
      const base = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs';
      const response = await fetch(`${base}/${cid}`);
      if (!response.ok) {
        throw new Error('Unable to fetch encrypted file from IPFS');
      }

      const encryptedBlob = await response.blob();
      const encryptedFile = new File([encryptedBlob], `${cid}.enc.json`, {
        type: encryptedBlob.type || 'application/json',
      });

      const decryptedFile = await decryptFile(encryptedFile, key);
      const objectUrl = URL.createObjectURL(decryptedFile);

      setDecryptedViews((prev) => {
        const previous = prev[recordKey];
        if (previous?.objectUrl) {
          URL.revokeObjectURL(previous.objectUrl);
        }

        return {
          ...prev,
          [recordKey]: {
            fileName: decryptedFile.name,
            mimeType: decryptedFile.type || 'application/octet-stream',
            objectUrl,
          },
        };
      });

      if (doctorAddress) {
        appendActivityLog({
          action: 'DECRYPT_RECORD_SUCCESS',
          actor: doctorAddress,
          tokenId,
          details: `CID: ${cid}`,
        });
      }
    } catch (decryptError) {
      setRecordErrors((prev) => ({
        ...prev,
        [recordKey]: decryptError instanceof Error ? decryptError.message : String(decryptError),
      }));
      if (doctorAddress) {
        appendActivityLog({
          action: 'DECRYPT_RECORD_FAILURE',
          actor: doctorAddress,
          tokenId,
          details: decryptError instanceof Error ? decryptError.message : String(decryptError),
        });
      }
    } finally {
      setRecordDecrypting((prev) => ({ ...prev, [recordKey]: false }));
      // Security: do not retain decryption key in UI state after attempt.
      setRecordKeys((prev) => ({ ...prev, [recordKey]: '' }));
    }
  };

  const handleCheckAccess = async () => {
    if (!canRun || !doctorAddress) {
      setAccessState('error');
      setError('Connect wallet before checking access.');
      return;
    }

    if (!tokenIdInput.trim() || !/^\d+$/.test(tokenIdInput.trim())) {
      setAccessState('error');
      setError('Patient NFT ID must be a non-negative integer.');
      return;
    }

    setAccessState('checking');
    setError(null);
    setAccessExpiryText('');
    setMetadata(null);
      setRecordKeys({});
      setRecordErrors({});

      setDecryptedViews((prev) => {
        Object.values(prev).forEach((view) => {
          URL.revokeObjectURL(view.objectUrl);
        });
        return {};
      });

    try {
      const tokenId = BigInt(tokenIdInput.trim());
      const tokenIdText = tokenIdInput.trim();

      // Step 9 primary gate: doctor must pass smart-contract access check.
      const [hasAccess, expiresAt] = await Promise.all([
        nft.checkAccess(tokenId, doctorAddress as Address),
        nft.getAccessExpiry(tokenId, doctorAddress as Address),
      ]);

      const nowSeconds = BigInt(Math.floor(Date.now() / 1000));
      const hasExpiry = expiresAt > 0n;
      const isExpired = hasExpiry && expiresAt <= nowSeconds;
      if (!hasAccess || isExpired) {
        setAccessState('denied');
        if (hasAccess && isExpired) {
          setError('Access exists but has expired. Ask patient to renew permission.');
        }
        appendActivityLog({
          action: 'CHECK_ACCESS',
          actor: doctorAddress,
          tokenId: tokenIdText,
          details: hasAccess ? 'Denied due to expiry' : 'Denied (not granted)',
        });
        return;
      }

      setAccessState('allowed');
      if (hasExpiry) {
        setAccessExpiryText(`Access expires at ${new Date(Number(expiresAt) * 1000).toISOString()}`);
      } else {
        setAccessExpiryText('Access has no expiry configured.');
      }
      appendActivityLog({
        action: 'CHECK_ACCESS',
        actor: doctorAddress,
        tokenId: tokenIdText,
        details: 'Allowed',
      });

      // If access is granted, fetch metadata.
      // Priority: dynamic pointer (Step 6), fallback to tokenURI from chain.
      let fetchedMetadata = await fetchMetadataFromPointer(tokenIdInput.trim());

      if (!fetchedMetadata) {
        const nftInfo = await nft.getNFTInfo(tokenId);
        const metadataResponse = await fetch(resolveGatewayUrl(nftInfo.tokenUri));
        if (metadataResponse.ok) {
          fetchedMetadata = (await metadataResponse.json()) as PatientHealthNFTMetadata;
        }
      }

      setMetadata(fetchedMetadata || null);
    } catch (checkError) {
      setAccessState('error');
      setError(checkError instanceof Error ? checkError.message : String(checkError));
    }
  };

  return (
    <section className="w-full max-w-4xl rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-1 text-2xl font-semibold">Doctor Dashboard</h2>
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Enter patient NFT ID, validate your contract access, and view allowed records.
      </p>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="Patient NFT ID"
          value={tokenIdInput}
          onChange={(event) => {
            setTokenIdInput(event.target.value);
            setAccessState('idle');
            setError(null);
          }}
          className="block w-full rounded-md border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
        />

        <button
          type="button"
          onClick={handleCheckAccess}
          disabled={!canRun || accessState === 'checking'}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {accessState === 'checking' ? 'Checking Access...' : 'Check Access'}
        </button>
      </div>

      {accessState === 'denied' && (
        <p className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
          Access Denied
        </p>
      )}

      {accessState === 'error' && error && (
        <p className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
          Error: {error}
        </p>
      )}

      {accessState === 'allowed' && (
        <div className="mt-4 space-y-3 rounded-md border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Access granted</p>

          {!metadata && (
            <p className="text-sm text-emerald-800 dark:text-emerald-300">
              No metadata found for this token yet.
            </p>
          )}

          {metadata && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold">{metadata.name}</p>
                <p className="text-xs text-gray-700 dark:text-gray-300">{metadata.description}</p>
                <p className="text-xs text-gray-700 dark:text-gray-300 break-all">Patient ID: {metadata.patientId}</p>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold">Records</p>
                {accessExpiryText && (
                  <p className="mb-2 text-xs text-gray-700 dark:text-gray-300">{accessExpiryText}</p>
                )}
                {metadata.records.length === 0 && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">No records available.</p>
                )}

                {metadata.records.length > 0 && (
                  <ul className="space-y-2">
                    {metadata.records.map((record, index) => (
                      <li
                        key={`${record.cid}-${index}`}
                        className="rounded-md border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                      >
                        <p><span className="font-medium">Type:</span> {record.type}</p>
                        <p><span className="font-medium">Date:</span> {record.date}</p>
                        <p><span className="font-medium">Encrypted:</span> {record.encrypted ? 'true' : 'false'}</p>
                        <p><span className="font-medium">Files in record:</span> {getRecordCids(record).length}</p>

                        <div className="mt-3 space-y-3 rounded-md border border-gray-200 p-2 dark:border-gray-700">
                          {getRecordCids(record).map((cid, fileIndex) => {
                            const recordKey = `${index}:${fileIndex}:${cid}`;
                            const decryptedView = decryptedViews[recordKey];

                            return (
                              <div key={recordKey} className="space-y-2 rounded border border-gray-200 p-2 dark:border-gray-700">
                                <p className="break-all text-xs"><span className="font-medium">CID:</span> {cid}</p>

                                <input
                                  type="password"
                                  placeholder="Enter decryption key"
                                  value={recordKeys[recordKey] || ''}
                                  autoComplete="off"
                                  onChange={(event) => {
                                    const nextKey = event.target.value;
                                    setRecordKeys((prev) => ({ ...prev, [recordKey]: nextKey }));
                                    setRecordErrors((prev) => ({ ...prev, [recordKey]: '' }));
                                  }}
                                  className="block w-full rounded-md border border-gray-300 p-2 text-xs dark:border-gray-700 dark:bg-gray-800"
                                />

                                <button
                                  type="button"
                                  onClick={() => handleDecryptRecord(recordKey, tokenIdInput.trim(), cid)}
                                  disabled={recordDecrypting[recordKey]}
                                  className="rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                                >
                                  {recordDecrypting[recordKey] ? 'Decrypting...' : 'Fetch + Decrypt'}
                                </button>

                                {recordErrors[recordKey] && (
                                  <p className="text-xs text-red-600 dark:text-red-300">{recordErrors[recordKey]}</p>
                                )}

                                {decryptedView && (
                                  <div className="space-y-2 rounded-md border border-emerald-300 bg-emerald-50 p-2 dark:border-emerald-900 dark:bg-emerald-950/30">
                                    <p className="text-xs">
                                      <span className="font-medium">Decrypted:</span> {decryptedView.fileName}
                                    </p>

                                    {decryptedView.mimeType.startsWith('image/') && (
                                      <img
                                        src={decryptedView.objectUrl}
                                        alt="Decrypted medical record"
                                        className="max-h-80 rounded border border-gray-200 object-contain dark:border-gray-700"
                                      />
                                    )}

                                    {decryptedView.mimeType === 'application/pdf' && (
                                      <iframe
                                        src={decryptedView.objectUrl}
                                        title={`Decrypted PDF record ${recordKey}`}
                                        className="h-96 w-full rounded border border-gray-200 dark:border-gray-700"
                                      />
                                    )}

                                    {!decryptedView.mimeType.startsWith('image/') &&
                                      decryptedView.mimeType !== 'application/pdf' && (
                                        <a
                                          href={decryptedView.objectUrl}
                                          download={decryptedView.fileName}
                                          className="text-xs underline"
                                        >
                                          Download decrypted file
                                        </a>
                                      )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {!isConnected && (
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Connect wallet to use doctor access checks.
        </p>
      )}

      {doctorAddress && isAddress(doctorAddress) && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 break-all">
          Doctor wallet: {doctorAddress}
        </p>
      )}
    </section>
  );
}
