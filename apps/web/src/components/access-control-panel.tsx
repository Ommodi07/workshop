'use client';

import { useState } from 'react';
import { isAddress } from 'viem/utils';
import type { Address } from 'viem';
import { useAccount } from 'wagmi';
import { useERC721Interactions } from '@/lib/erc721-stylus/src';
import { appendActivityLog } from '@/lib/activity-log';

const NFT_ADDRESS = process.env.NEXT_PUBLIC_NFT_ADDRESS as Address;

export function AccessControlPanel() {
  const { address: userAddress } = useAccount();
  const [tokenId, setTokenId] = useState('');
  const [doctorAddress, setDoctorAddress] = useState('');
  const [accessExpiryDateTime, setAccessExpiryDateTime] = useState('');
  const [checkResult, setCheckResult] = useState<boolean | null>(null);
  const [expiryStatus, setExpiryStatus] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isWorking, setIsWorking] = useState(false);

  const nft = useERC721Interactions({
    contractAddress: NFT_ADDRESS,
    network: 'arbitrum-sepolia',
    userAddress,
  });

  const parseInputs = (): { parsedTokenId: bigint; parsedDoctor: Address } => {
    if (!tokenId.trim() || !/^\d+$/.test(tokenId.trim())) {
      throw new Error('Token ID must be a non-negative integer');
    }
    if (!doctorAddress.trim() || !isAddress(doctorAddress)) {
      throw new Error('Valid doctor wallet address is required');
    }

    return {
      parsedTokenId: BigInt(tokenId.trim()),
      parsedDoctor: doctorAddress.trim() as Address,
    };
  };

  const parseExpiryUnixSeconds = (): bigint => {
    if (!accessExpiryDateTime.trim()) {
      throw new Error('Select an expiry date/time first');
    }

    const millis = Date.parse(accessExpiryDateTime);
    if (Number.isNaN(millis)) {
      throw new Error('Invalid expiry date/time');
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const nextSeconds = Math.floor(millis / 1000);
    if (nextSeconds <= nowSeconds) {
      throw new Error('Expiry must be in the future');
    }

    return BigInt(nextSeconds);
  };

  const runAction = async (action: 'grant' | 'grant-expiry' | 'revoke' | 'check') => {
    try {
      setIsWorking(true);
      setStatusMessage('');
      setExpiryStatus('');

      const { parsedTokenId, parsedDoctor } = parseInputs();

      if (action === 'grant') {
        const txHash = await nft.grantAccess(parsedTokenId, parsedDoctor);
        setStatusMessage(`Access granted. Tx: ${txHash.slice(0, 10)}...`);
        setCheckResult(true);
        setExpiryStatus('No expiry configured (permanent until revoked).');
        if (userAddress) {
          appendActivityLog({
            action: 'GRANT_ACCESS',
            actor: userAddress,
            tokenId: parsedTokenId.toString(),
            details: `Doctor: ${parsedDoctor}`,
          });
        }
      }

      if (action === 'grant-expiry') {
        const expiry = parseExpiryUnixSeconds();
        const txHash = await nft.grantAccessWithExpiry(parsedTokenId, parsedDoctor, expiry);
        const expiryIso = new Date(Number(expiry) * 1000).toISOString();
        setStatusMessage(`Access with expiry granted. Tx: ${txHash.slice(0, 10)}...`);
        setCheckResult(true);
        setExpiryStatus(`Expires at ${expiryIso}`);
        if (userAddress) {
          appendActivityLog({
            action: 'GRANT_ACCESS_WITH_EXPIRY',
            actor: userAddress,
            tokenId: parsedTokenId.toString(),
            details: `Doctor: ${parsedDoctor}, ExpiresAt: ${expiryIso}`,
          });
        }
      }

      if (action === 'revoke') {
        const txHash = await nft.revokeAccess(parsedTokenId, parsedDoctor);
        setStatusMessage(`Access revoked. Tx: ${txHash.slice(0, 10)}...`);
        setCheckResult(false);
        setExpiryStatus('No active expiry (access revoked).');
        if (userAddress) {
          appendActivityLog({
            action: 'REVOKE_ACCESS',
            actor: userAddress,
            tokenId: parsedTokenId.toString(),
            details: `Doctor: ${parsedDoctor}`,
          });
        }
      }

      if (action === 'check') {
        const [hasAccess, expiresAt] = await Promise.all([
          nft.checkAccess(parsedTokenId, parsedDoctor),
          nft.getAccessExpiry(parsedTokenId, parsedDoctor),
        ]);

        const nowSeconds = BigInt(Math.floor(Date.now() / 1000));
        const hasExpiry = expiresAt > 0n;
        const isExpired = hasExpiry && expiresAt <= nowSeconds;
        const effectiveAccess = hasAccess && !isExpired;

        setCheckResult(effectiveAccess);
        if (!hasAccess) {
          setStatusMessage('Doctor currently has no access.');
          setExpiryStatus('No expiry configured.');
        } else if (!hasExpiry) {
          setStatusMessage('Doctor currently has active access.');
          setExpiryStatus('No expiry configured (permanent until revoked).');
        } else {
          const expiryIso = new Date(Number(expiresAt) * 1000).toISOString();
          setStatusMessage(
            effectiveAccess
              ? 'Doctor currently has active access.'
              : 'Doctor access is configured but expired.',
          );
          setExpiryStatus(`Expiry: ${expiryIso}`);
        }

        if (userAddress) {
          appendActivityLog({
            action: 'CHECK_ACCESS',
            actor: userAddress,
            tokenId: parsedTokenId.toString(),
            details: `Doctor: ${parsedDoctor}, EffectiveAccess: ${effectiveAccess}`,
          });
        }
      }
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsWorking(false);
    }
  };

  if (!NFT_ADDRESS) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-900/10">
        <div className="flex gap-3">
          <svg className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0-6a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <div className="text-sm text-amber-800 dark:text-amber-300">
            <p className="font-medium">Configuration Required</p>
            <p className="mt-1">Set NEXT_PUBLIC_NFT_ADDRESS environment variable to enable access control features.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="tokenId" className="label-base">
            NFT Token ID
          </label>
          <input
            id="tokenId"
            type="text"
            placeholder="Enter token ID"
            value={tokenId}
            onChange={(event) => {
              setTokenId(event.target.value);
              setStatusMessage('');
            }}
            className="input-base"
          />
          <p className="helper-text">The token ID of your medical NFT</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="doctorAddress" className="label-base">
            Doctor Wallet Address
          </label>
          <input
            id="doctorAddress"
            type="text"
            placeholder="0x..."
            value={doctorAddress}
            onChange={(event) => {
              setDoctorAddress(event.target.value);
              setStatusMessage('');
            }}
            className="input-base"
          />
          <p className="helper-text">The Ethereum address of the doctor or healthcare provider</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="expiryDateTime" className="label-base">
            Access Expiry Date & Time
          </label>
          <input
            id="expiryDateTime"
            type="datetime-local"
            value={accessExpiryDateTime}
            onChange={(event) => {
              setAccessExpiryDateTime(event.target.value);
              setStatusMessage('');
              setExpiryStatus('');
            }}
            className="input-base"
          />
          <p className="helper-text">Optional: Leave empty for permanent access until manually revoked</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid gap-2 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => runAction('grant')}
          disabled={isWorking}
          className="btn-primary"
          title="Grant permanent access"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="hidden sm:inline">Grant</span>
        </button>

        <button
          type="button"
          onClick={() => runAction('grant-expiry')}
          disabled={isWorking}
          className={`inline-flex items-center justify-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-blue-100 disabled:opacity-50 dark:border-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 ${
            isWorking ? 'cursor-not-allowed' : ''
          }`}
          title="Grant access until specified time"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="hidden sm:inline">Expiry</span>
        </button>

        <button
          type="button"
          onClick={() => runAction('revoke')}
          disabled={isWorking}
          className={`inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-700/50 dark:bg-red-900/20 dark:hover:bg-red-900/40 ${
            isWorking ? 'cursor-not-allowed' : ''
          }`}
          title="Remove access permanently"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="hidden sm:inline">Revoke</span>
        </button>

        <button
          type="button"
          onClick={() => runAction('check')}
          disabled={isWorking}
          className="btn-secondary"
          title="Check current access status"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="hidden sm:inline">Check</span>
        </button>
      </div>

      {/* Status Messages */}
      {statusMessage && (
        <div className={
          checkResult === null
            ? 'alert-info'
            : checkResult
              ? 'alert-success'
              : 'alert-error'
        }>
          <svg className={`h-5 w-5 flex-shrink-0 ${
            checkResult === null
              ? 'text-blue-500'
              : checkResult
                ? 'text-emerald-500'
                : 'text-red-500'
          }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {checkResult === null ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : checkResult ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
          </svg>
          <div className="text-sm">
            <p className="font-medium">{statusMessage}</p>
            {checkResult !== null && (
              <div className="mt-2 space-y-1">
                <p className="text-xs">
                  Access State:{' '}
                  <span className={`font-semibold ${checkResult ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                    {checkResult ? '✓ ACTIVE' : '✗ DENIED'}
                  </span>
                </p>
                {expiryStatus && (
                  <p className="text-xs">{expiryStatus}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
        <p className="font-medium mb-2">How it works</p>
        <ul className="space-y-1 text-xs">
          <li className="flex gap-2">
            <span className="font-semibold">Grant:</span> Give permanent access
          </li>
          <li className="flex gap-2">
            <span className="font-semibold">Expiry:</span> Set access with automatic revocation date
          </li>
          <li className="flex gap-2">
            <span className="font-semibold">Revoke:</span> Immediately remove access
          </li>
          <li className="flex gap-2">
            <span className="font-semibold">Check:</span> Verify current access status
          </li>
        </ul>
      </div>
    </div>
  );
}
