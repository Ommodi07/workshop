import CryptoJS from 'crypto-js';

const PBKDF2_ITERATIONS = 120000;
const AES_KEY_SIZE_WORDS = 256 / 32;

function arrayBufferToWordArray(buffer) {
  const bytes = new Uint8Array(buffer);
  const words = [];

  for (let i = 0; i < bytes.length; i += 1) {
    words[i >>> 2] |= bytes[i] << (24 - (i % 4) * 8);
  }

  return CryptoJS.lib.WordArray.create(words, bytes.length);
}

function wordArrayToUint8Array(wordArray) {
  const { words, sigBytes } = wordArray;
  const result = new Uint8Array(sigBytes);

  for (let i = 0; i < sigBytes; i += 1) {
    result[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
  }

  return result;
}

function deriveAesKey(key, salt, iterations = PBKDF2_ITERATIONS) {
  return CryptoJS.PBKDF2(key, salt, {
    keySize: AES_KEY_SIZE_WORDS,
    iterations,
    hasher: CryptoJS.algo.SHA256,
  });
}

/**
 * Encrypts a file using AES-256-CBC and returns a JSON-wrapped encrypted file.
 *
 * IMPORTANT:
 * - Do not store `key` on-chain.
 * - Do not persist `key` in plaintext browser storage.
 *
 * @param {File} file
 * @param {string} key
 * @returns {Promise<File>}
 */
export async function encryptFile(file, key) {
  if (!(file instanceof File)) {
    throw new Error('encryptFile expects a File object');
  }
  if (!key || key.trim().length < 8) {
    throw new Error('Encryption key must be at least 8 characters');
  }

  const buffer = await file.arrayBuffer();
  const fileData = arrayBufferToWordArray(buffer);

  const salt = CryptoJS.lib.WordArray.random(16);
  const iv = CryptoJS.lib.WordArray.random(16);
  const derivedKey = deriveAesKey(key, salt, PBKDF2_ITERATIONS);

  const encrypted = CryptoJS.AES.encrypt(fileData, derivedKey, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  const payload = {
    v: 1,
    alg: 'AES-256-CBC',
    kdf: 'PBKDF2-SHA256',
    iterations: PBKDF2_ITERATIONS,
    salt: CryptoJS.enc.Base64.stringify(salt),
    iv: CryptoJS.enc.Base64.stringify(iv),
    data: CryptoJS.enc.Base64.stringify(encrypted.ciphertext),
    mimeType: file.type || 'application/octet-stream',
    originalName: file.name,
  };

  const encryptedBlob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  return new File([encryptedBlob], `${file.name}.enc.json`, { type: 'application/json' });
}

/**
 * Decrypts a JSON-wrapped encrypted file created by encryptFile.
 *
 * @param {File} encryptedFile
 * @param {string} key
 * @returns {Promise<File>}
 */
export async function decryptFile(encryptedFile, key) {
  if (!(encryptedFile instanceof File)) {
    throw new Error('decryptFile expects a File object');
  }
  if (!key || key.trim().length < 8) {
    throw new Error('Decryption key must be at least 8 characters');
  }

  const text = await encryptedFile.text();
  let payload;

  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error('Encrypted file payload is not valid JSON');
  }

  const salt = CryptoJS.enc.Base64.parse(payload.salt || '');
  const iv = CryptoJS.enc.Base64.parse(payload.iv || '');
  const ciphertext = CryptoJS.enc.Base64.parse(payload.data || '');
  const iterations = Number(payload.iterations) || PBKDF2_ITERATIONS;

  const derivedKey = deriveAesKey(key, salt, iterations);
  const decrypted = CryptoJS.AES.decrypt(
    { ciphertext },
    derivedKey,
    {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    },
  );

  if (!decrypted || decrypted.sigBytes <= 0) {
    throw new Error('Failed to decrypt file. Check encryption key.');
  }

  const bytes = wordArrayToUint8Array(decrypted);
  const originalName = payload.originalName || 'decrypted-medical-record.bin';
  const mimeType = payload.mimeType || 'application/octet-stream';

  return new File([bytes], originalName, { type: mimeType });
}
