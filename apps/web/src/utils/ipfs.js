/**
 * IPFS utilities for browser-side uploads.
 *
 * Security model:
 * - Browser never sees Pinata JWT.
 * - Uploads are proxied through /api/ipfs/upload.
 */

const CID_PATTERN = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z0-9]{20,})$/;
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

function normalizeErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }
  return typeof error === 'string' ? error : 'Unknown error';
}

function assertValidCid(cid) {
  if (!cid || !CID_PATTERN.test(cid)) {
    throw new Error('Upload returned an invalid CID');
  }
}

/**
 * Upload a file to IPFS through the app's secure API route.
 *
 * Flow: File -> Encrypt -> Upload -> Return CID
 *
 * @param {File} file
 * @param {{
 *   encryptFile?: (file: File) => Promise<File | Blob>,
 *   fileName?: string,
 *   contentType?: string,
 * }} options
 * @returns {Promise<{ cid: string; ipfsUri: string; gatewayUrl: string }>} 
 */
export async function uploadFileToIPFS(file, options = {}) {
  if (!(file instanceof File)) {
    throw new Error('uploadFileToIPFS expects a File object');
  }
  if (file.size <= 0) {
    throw new Error('File cannot be empty');
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('File is too large. Max allowed size is 25MB.');
  }

  const {
     // AES encryption is injected from the UI before upload.
     // This utility remains generic so encryption strategy can evolve.
    encryptFile,
    fileName,
    contentType,
  } = options;

  const processed = encryptFile ? await encryptFile(file) : file;
  const uploadBlob = processed instanceof File || processed instanceof Blob ? processed : file;
  const resolvedName = fileName || file.name || 'medical-record.bin';
  const resolvedType = contentType || uploadBlob.type || 'application/octet-stream';
  const payloadFile =
    uploadBlob instanceof File
      ? uploadBlob
      : new File([uploadBlob], resolvedName, { type: resolvedType });

  const formData = new FormData();
  formData.append('file', payloadFile);
  formData.append('fileName', resolvedName);

  try {
    const response = await fetch('/api/ipfs/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let details = 'Upload failed';
      try {
        const data = await response.json();
        details = data.error || data.details || details;
      } catch {
        // Ignore JSON parse failures and return generic message.
      }
      throw new Error(details);
    }

    const result = await response.json();
    assertValidCid(result.cid);

    return {
      cid: result.cid,
      ipfsUri: `ipfs://${result.cid}`,
      gatewayUrl: result.gatewayUrl,
    };
  } catch (error) {
    throw new Error(`IPFS file upload error: ${normalizeErrorMessage(error)}`);
  }
}

/**
 * Upload JSON metadata to IPFS through the app's secure API route.
 * @param {unknown} payload
 * @param {{ name?: string }} options
 * @returns {Promise<{ cid: string; ipfsUri: string; gatewayUrl: string }>}
 */
export async function uploadJSONToIPFS(payload, options = {}) {
  try {
    const response = await fetch('/api/ipfs/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: payload,
        name: options.name || 'medical-metadata.json',
      }),
    });

    if (!response.ok) {
      let details = 'JSON upload failed';
      try {
        const data = await response.json();
        details = data.error || data.details || details;
      } catch {
        // Ignore JSON parse failures and return generic message.
      }
      throw new Error(details);
    }

    const result = await response.json();
    assertValidCid(result.cid);

    return {
      cid: result.cid,
      ipfsUri: `ipfs://${result.cid}`,
      gatewayUrl: result.gatewayUrl,
    };
  } catch (error) {
    throw new Error(`IPFS JSON upload error: ${normalizeErrorMessage(error)}`);
  }
}
