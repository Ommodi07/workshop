'use client';

/**
 * ERC-721 NFT Interaction Panel
 */

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useERC721Interactions } from '@/lib/erc721-stylus/src';
import type { Address } from 'viem';
import {
  createPatientHealthMetadata,
  validatePatientHealthMetadata,
  type PatientHealthNFTMetadata,
} from '@/lib/medical-metadata';

const NFT_ADDRESS = process.env.NEXT_PUBLIC_NFT_ADDRESS as Address;

export function ERC721NFTPanel() {
  const { address: userAddress } = useAccount();
  const [mintTo, setMintTo] = useState('');
  const [metadataPreview, setMetadataPreview] = useState<PatientHealthNFTMetadata | null>(null);

  const nft = useERC721Interactions({
    contractAddress: NFT_ADDRESS,
    network: 'arbitrum-sepolia',
    userAddress,
  });

  const collectionInfo = nft.collectionInfo.status === 'success' ? nft.collectionInfo.data : null;
  const balance = nft.balance.status === 'success' ? nft.balance.data : null;

  const handleMint = async () => {
    if (!mintTo) return;
    try {
      // Step 3 schema: metadata contains patientId hash + encrypted record pointers only.
      const metadata = createPatientHealthMetadata(mintTo as Address, []);
      validatePatientHealthMetadata(metadata);

      const result = await nft.mint(mintTo as Address, metadata);

      // Temporary client-side handoff for next step (IPFS upload pipeline).
      // We persist structured metadata only, never raw medical files.
      localStorage.setItem(`medical-nft:pending-metadata:${result.tokenId.toString()}`, JSON.stringify(metadata));
      setMetadataPreview(metadata);

      console.log('Minted NFT #' + result.tokenId.toString());
      setMintTo('');
    } catch (error) {
      console.error('Mint failed:', error);
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
            <p className="font-medium">Contract Not Deployed</p>
            <p className="mt-1">Run deployment script to activate NFT minting. Check environment variables.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Collection Info Card */}
      <div className="card">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {collectionInfo?.name || 'Medical NFT Collection'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {collectionInfo?.symbol || 'MNFT'} • {NFT_ADDRESS.slice(0, 10)}...{NFT_ADDRESS.slice(-8)}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Total Supply</p>
              <p className="mt-1 text-2xl font-bold text-blue-900 dark:text-blue-100">
                {collectionInfo?.formattedTotalSupply || '0'}
              </p>
            </div>

            <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Your NFTs</p>
              <p className="mt-1 text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                {balance?.balance?.toString() || '0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mint NFT Section */}
      <div className="card">
        <div className="space-y-4">
          <div>
            <h4 className="text-base font-semibold text-gray-900 dark:text-white">Mint Medical Identity NFT</h4>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Create your health record NFT. This becomes your medical identity on-chain.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label htmlFor="mintTo" className="label-base">
                Recipient Address
              </label>
              <input
                id="mintTo"
                type="text"
                placeholder="0x..."
                value={mintTo}
                onChange={(e) => setMintTo(e.target.value)}
                className="input-base"
              />
              <p className="helper-text">
                Usually your own wallet address. The address that will own the medical NFT.
              </p>
            </div>

            <button
              onClick={handleMint}
              disabled={nft.isLoading || !mintTo}
              className="btn-primary w-full"
            >
              {nft.isLoading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Minting...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Mint NFT
                </>
              )}
            </button>
          </div>

          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
            <p className="font-medium">ℹ️ How it works</p>
            <p className="mt-2 text-xs">
              Your NFT stores a hash of your patient ID. Actual medical records are stored on IPFS. Only the encrypted links are stored in the NFT metadata.
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {nft.txState.status === 'success' && (
        <div className="alert-success">
          <svg className="h-5 w-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-emerald-700 dark:text-emerald-300">
            <p className="font-medium">NFT Minted Successfully!</p>
            <p className="mt-1 text-xs font-mono break-all">
              Tx: {nft.txState.hash}
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {nft.error && (
        <div className="alert-error">
          <svg className="h-5 w-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-red-700 dark:text-red-300">
            <p className="font-medium">Mint Failed</p>
            <p className="mt-1 text-xs">{nft.error.message}</p>
          </div>
        </div>
      )}

      {/* Metadata Preview */}
      {metadataPreview && (
        <details className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
          <summary className="cursor-pointer font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
            View NFT Metadata
          </summary>
          <div className="mt-3 overflow-auto rounded bg-gray-50 p-3 dark:bg-gray-800/50">
            <pre className="text-xs text-gray-700 dark:text-gray-300">
              {JSON.stringify(metadataPreview, null, 2)}
            </pre>
          </div>
        </details>
      )}
    </div>
  );
}
