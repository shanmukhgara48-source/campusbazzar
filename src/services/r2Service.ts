/**
 * Cloudflare R2 image upload service.
 *
 * Flow per image:
 *   1. Compress to JPEG ≤ 1080 px via expo-image-manipulator
 *   2. POST to Cloudflare Worker  → receive { uploadUrl, publicUrl }
 *   3. PUT compressed blob directly to R2 via the presigned uploadUrl
 *   4. Return publicUrl  → caller stores this in Firestore
 *
 * Config:
 *   Set EXPO_PUBLIC_UPLOAD_WORKER_URL in your .env file:
 *     EXPO_PUBLIC_UPLOAD_WORKER_URL=https://campusbazaar-upload.<your-subdomain>.workers.dev
 *
 *   For local Worker dev (wrangler dev --port 8787):
 *     EXPO_PUBLIC_UPLOAD_WORKER_URL=http://localhost:8787
 */

import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { auth } from './firebase';

// ─── Config ───────────────────────────────────────────────────────────────────

const WORKER_URL: string =
  (process.env.EXPO_PUBLIC_UPLOAD_WORKER_URL as string) ?? '';

const COMPRESS_WIDTH   = 1080;
const COMPRESS_QUALITY = 0.82;
const PRESIGN_TIMEOUT  = 10_000; // 10 s to get signed URL before we give up

// ─── Types ────────────────────────────────────────────────────────────────────

export type R2Folder = 'listings' | 'avatars';

interface PresignResponse {
  uploadUrl: string;
  publicUrl: string;
  key:       string;
}

// ─── Core upload ──────────────────────────────────────────────────────────────

/**
 * Upload a single local image URI to Cloudflare R2.
 * Returns the permanent public URL suitable for storing in Firestore.
 */
export async function uploadImageToR2(
  localUri: string,
  folder:   R2Folder,
  index     = 0,
): Promise<string> {
  if (!WORKER_URL) {
    throw new Error(
      'EXPO_PUBLIC_UPLOAD_WORKER_URL is not set. ' +
      'Add it to your .env file and restart the dev server.',
    );
  }

  // ── Step 1: compress ────────────────────────────────────────────────────────
  const imgRef     = await ImageManipulator.manipulate(localUri)
    .resize({ width: COMPRESS_WIDTH })
    .renderAsync();
  const compressed = await imgRef.saveAsync({
    compress: COMPRESS_QUALITY,
    format:   SaveFormat.JPEG,
  });

  // ── Step 2: get Firebase ID token ───────────────────────────────────────────
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('You must be signed in to upload images.');

  // ── Step 3: request presigned PUT URL from Worker ───────────────────────────
  const filename = `image_${index}.jpg`;

  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), PRESIGN_TIMEOUT);

  let presign: PresignResponse;
  try {
    const res = await fetch(`${WORKER_URL}/upload-url`, {
      method:  'POST',
      signal:  controller.signal,
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ folder, filename, contentType: 'image/jpeg' }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Worker error ${res.status}: ${err}`);
    }

    presign = (await res.json()) as PresignResponse;
  } finally {
    clearTimeout(timer);
  }

  // ── Step 4: PUT blob directly to R2 via presigned URL ───────────────────────
  // React Native's native fetch reads file:// URIs — no JS Blob constructor.
  const localResponse = await fetch(compressed.uri);
  const blob          = await localResponse.blob();

  if (!blob || blob.size === 0) {
    throw new Error(`Image ${index} produced an empty blob — cannot upload.`);
  }

  const uploadResponse = await fetch(presign.uploadUrl, {
    method:  'PUT',
    headers: { 'Content-Type': 'image/jpeg' },
    body:    blob,
  });

  if (!uploadResponse.ok) {
    const body = await uploadResponse.text().catch(() => '');
    throw new Error(`R2 upload failed (${uploadResponse.status}): ${body}`);
  }

  return presign.publicUrl;
}

/**
 * Upload multiple images concurrently.
 * Returns an array of public URLs in the same order as the input URIs.
 */
export async function uploadImagesToR2(
  localUris: string[],
  folder:    R2Folder,
): Promise<string[]> {
  return Promise.all(
    localUris.map((uri, i) => uploadImageToR2(uri, folder, i)),
  );
}
