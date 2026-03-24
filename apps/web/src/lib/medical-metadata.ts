import type { Address } from 'viem';
import { keccak256, stringToHex } from 'viem';

const CID_PATTERN = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z0-9]{20,})$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface MedicalRecordMetadata {
  type: string;
  date: string;
  cid: string;
  // Optional multi-file support: record may include one or more encrypted file CIDs.
  cids?: string[];
  encrypted: true;
}

export interface PatientHealthNFTMetadata {
  name: 'Patient Health NFT';
  description: 'Secure medical record';
  patientId: string;
  records: MedicalRecordMetadata[];
}

function normalizeWalletAddress(address: Address): Address {
  return address.toLowerCase() as Address;
}

export function createPatientId(address: Address): string {
  // Use a deterministic hash of the wallet address as a privacy-preserving patient identifier.
  const normalized = normalizeWalletAddress(address);
  return keccak256(stringToHex(normalized));
}

export function createPatientHealthMetadata(
  address: Address,
  records: MedicalRecordMetadata[] = [],
): PatientHealthNFTMetadata {
  return {
    name: 'Patient Health NFT',
    description: 'Secure medical record',
    patientId: createPatientId(address),
    records,
  };
}

export function validatePatientHealthMetadata(metadata: PatientHealthNFTMetadata): void {
  if (metadata.name !== 'Patient Health NFT') {
    throw new Error('Invalid metadata.name');
  }
  if (metadata.description !== 'Secure medical record') {
    throw new Error('Invalid metadata.description');
  }
  if (!metadata.patientId.startsWith('0x') || metadata.patientId.length !== 66) {
    throw new Error('Invalid metadata.patientId hash');
  }

  for (const record of metadata.records) {
    if (!record.type || record.type.trim().length === 0 || record.type.length > 64) {
      throw new Error('Record type must be 1-64 characters');
    }
    if (!DATE_PATTERN.test(record.date)) {
      throw new Error('Record date must use YYYY-MM-DD format');
    }
    // Metadata must only store off-chain pointers, never raw file payloads.
    if (!record.cid || record.cid.startsWith('data:') || record.cid.includes('base64,')) {
      throw new Error('Record must contain a CID/pointer, not raw file data');
    }
    if (!CID_PATTERN.test(record.cid)) {
      throw new Error('Record CID is not a valid IPFS CID');
    }

    if (record.cids !== undefined) {
      if (!Array.isArray(record.cids) || record.cids.length === 0 || record.cids.length > 10) {
        throw new Error('Record cids must include 1-10 IPFS CIDs when provided');
      }

      for (const cid of record.cids) {
        if (!cid || cid.startsWith('data:') || cid.includes('base64,')) {
          throw new Error('Record cids must contain CID pointers only');
        }
        if (!CID_PATTERN.test(cid)) {
          throw new Error('Record cids contains an invalid IPFS CID');
        }
      }

      if (record.cids[0] !== record.cid) {
        throw new Error('Record cid must match the first entry in record.cids');
      }
    }

    if (!record.encrypted) {
      throw new Error('Record must be encrypted before being referenced in metadata');
    }
  }
}

export function appendMedicalRecord(
  metadata: PatientHealthNFTMetadata,
  record: MedicalRecordMetadata,
): PatientHealthNFTMetadata {
  const nextMetadata: PatientHealthNFTMetadata = {
    ...metadata,
    records: [...metadata.records, record],
  };

  validatePatientHealthMetadata(nextMetadata);
  return nextMetadata;
}
