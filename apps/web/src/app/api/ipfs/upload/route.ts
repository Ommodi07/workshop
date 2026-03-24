import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return typeof error === 'string' ? error : 'Unknown error';
}

function isEncryptedMedicalUpload(fileName: string, contentType: string): boolean {
  const normalizedName = fileName.toLowerCase();
  const normalizedType = contentType.toLowerCase();
  return normalizedName.endsWith('.enc.json') && normalizedType.includes('application/json');
}

function getPinataGatewayBase(): string {
  return process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs';
}

function getPinataJwt(): string {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    throw new Error('PINATA_JWT is not configured');
  }
  return jwt;
}

async function uploadFileToPinata(file: File, fileName?: string) {
  const pinataForm = new FormData();
  pinataForm.append('file', file, fileName || file.name);

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getPinataJwt()}`,
    },
    body: pinataForm,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Pinata file upload failed: ${text}`);
  }

  return response.json() as Promise<{ IpfsHash: string }>;
}

async function uploadJSONToPinata(json: unknown, name: string) {
  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getPinataJwt()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pinataMetadata: {
        name,
      },
      pinataContent: json,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Pinata JSON upload failed: ${text}`);
  }

  return response.json() as Promise<{ IpfsHash: string }>;
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    const gatewayBase = getPinataGatewayBase();

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const fileValue = formData.get('file');
      const fileNameValue = formData.get('fileName');
      const fileName = typeof fileNameValue === 'string' ? fileNameValue : undefined;

      if (!(fileValue instanceof File)) {
        return NextResponse.json({ error: 'Missing file in form data' }, { status: 400 });
      }

      if (fileValue.size <= 0) {
        return NextResponse.json({ error: 'File cannot be empty' }, { status: 400 });
      }

      if (fileValue.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json({ error: 'File exceeds 25MB limit' }, { status: 413 });
      }

      // Security rule: medical files must be encrypted client-side before upload.
      const effectiveName = fileName || fileValue.name;
      if (!isEncryptedMedicalUpload(effectiveName, fileValue.type || 'application/octet-stream')) {
        return NextResponse.json(
          { error: 'Only encrypted .enc.json medical payloads are accepted for file uploads' },
          { status: 400 },
        );
      }

      const pinata = await uploadFileToPinata(fileValue, fileName);
      const cid = pinata.IpfsHash;

      return NextResponse.json({
        cid,
        gatewayUrl: `${gatewayBase}/${cid}`,
      });
    }

    if (contentType.includes('application/json')) {
      const body = (await request.json()) as { json?: unknown; name?: string };
      if (typeof body !== 'object' || body === null || !('json' in body)) {
        return NextResponse.json({ error: 'Missing json payload' }, { status: 400 });
      }

      // Guard metadata shape to prevent accidental raw file embedding in metadata JSON.
      const payloadString = JSON.stringify(body.json);
      if (payloadString.includes('data:') || payloadString.includes('base64,')) {
        return NextResponse.json(
          { error: 'Metadata JSON appears to contain raw/base64 content; only pointers are allowed' },
          { status: 400 },
        );
      }

      const pinata = await uploadJSONToPinata(body.json, body.name || 'medical-metadata.json');
      const cid = pinata.IpfsHash;

      return NextResponse.json({
        cid,
        gatewayUrl: `${gatewayBase}/${cid}`,
      });
    }

    return NextResponse.json(
      { error: 'Unsupported content type. Use multipart/form-data or application/json.' },
      { status: 415 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'IPFS upload failed',
        details: sanitizeError(error),
      },
      { status: 500 },
    );
  }
}
