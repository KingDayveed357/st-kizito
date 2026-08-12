import { supabase } from './supabase';

/**
 * Payment-receipt uploads for bookings and donations.
 *
 * One PRIVATE bucket with a folder per record type (see apps/web/db/upgrade_payments_and_receipts.sql):
 *   payment-receipts/bookings/<client_request_id>.<ext>
 *   payment-receipts/donations/<client_request_id>.<ext>
 *
 * The `client_request_id` is unguessable and is already the submission's idempotency key, so a retry
 * overwrites its own object instead of orphaning files. Anon may upload and overwrite its own path
 * but never read; admins read through short-lived signed URLs. We store the object PATH on the row,
 * not a URL.
 *
 * ── Why this file reads base64 instead of fetching the file URI ──────────────────────────────
 * It previously did `await fetch(localUri).then(r => r.arrayBuffer())`. On React Native that path
 * depends on the Blob implementation supporting `arrayBuffer()`, and on Hermes it can resolve to a
 * ZERO-BYTE buffer without throwing. The upload then "succeeded", the object path was written to
 * the booking row, and the administrator opened a signed URL to a 0-byte object — a broken image
 * with no error anywhere in the chain. That was the root cause of receipts not being viewable.
 *
 * The picker now returns base64 directly (`ImagePicker` `base64: true`), which is decoded here and
 * verified to be non-empty before anything is uploaded or persisted.
 */

const RECEIPT_BUCKET = 'payment-receipts';

export type ReceiptKind = 'bookings' | 'donations';

/** Mirrors the bucket's `file_size_limit` so we fail early with a friendly message. */
export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

/** Matches the bucket's `allowed_mime_types`. Anything else is rejected before the round-trip. */
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']);

const EXT_FOR_MIME: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'application/pdf': 'pdf',
};

const MIME_FOR_EXT: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    heic: 'image/heic',
    pdf: 'application/pdf',
};

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Decode base64 to bytes without a dependency or a global.
 *
 * `atob` exists in recent React Native, but it is a string-based API that would then need a second
 * pass to widen into bytes, and relying on a global that may be absent in a given engine build is
 * exactly the kind of silent failure this file exists to prevent.
 */
const base64ToBytes = (base64: string): Uint8Array => {
    const sanitized = base64.replace(/[^A-Za-z0-9+/=]/g, '');
    const normalized = sanitized.padEnd(Math.ceil(sanitized.length / 4) * 4, '=');
    const padding = normalized.endsWith('==') ? 2 : normalized.endsWith('=') ? 1 : 0;
    const byteLength = Math.floor((normalized.length * 3) / 4) - padding;
    const bytes = new Uint8Array(byteLength);

    let byteIndex = 0;
    for (let i = 0; i < normalized.length; i += 4) {
        const a = BASE64_ALPHABET.indexOf(normalized[i] ?? 'A');
        const b = BASE64_ALPHABET.indexOf(normalized[i + 1] ?? 'A');
        const cChar = normalized[i + 2] ?? '=';
        const dChar = normalized[i + 3] ?? '=';
        const c = cChar === '=' ? 0 : BASE64_ALPHABET.indexOf(cChar);
        const d = dChar === '=' ? 0 : BASE64_ALPHABET.indexOf(dChar);
        const chunk = (a << 18) | (b << 12) | (c << 6) | d;

        if (byteIndex < byteLength) bytes[byteIndex++] = (chunk >> 16) & 0xff;
        if (cChar !== '=' && byteIndex < byteLength) bytes[byteIndex++] = (chunk >> 8) & 0xff;
        if (dChar !== '=' && byteIndex < byteLength) bytes[byteIndex++] = chunk & 0xff;
    }

    return bytes;
};

/** What the image picker hands back, narrowed to the fields this module needs. */
export interface ReceiptAsset {
    uri: string;
    /** Required. Request it with `ImagePicker.launchImageLibraryAsync({ base64: true })`. */
    base64?: string | null;
    mimeType?: string | null;
    fileName?: string | null;
}

export interface ReceiptUploadResult {
    /** Storage object path to persist on the record, e.g. `bookings/bk_123.jpg`. */
    path: string | null;
    /** User-facing reason when the upload could not be completed. */
    error?: string;
    /**
     * Whether retrying the same action could plausibly succeed (a network blip) as opposed to the
     * file itself being unusable. Drives whether the UI offers "Try again" or "Choose another".
     */
    retryable?: boolean;
}

const resolveMime = (asset: ReceiptAsset): string => {
    const declared = (asset.mimeType ?? '').toLowerCase();
    if (ALLOWED_MIME.has(declared)) return declared;

    // Fall back to the file extension: some Android providers report `application/octet-stream`
    // or nothing at all for an image the user picked from the gallery.
    const source = asset.fileName || asset.uri.split('?')[0];
    const ext = (source.split('.').pop() || '').toLowerCase();
    return MIME_FOR_EXT[ext] ?? 'image/jpeg';
};

/**
 * Upload a locally-picked receipt. Returns the object path on success, or `path: null` with a
 * user-facing reason. Never throws.
 *
 * A `null` path MUST NOT be written to the record — the caller decides whether to block the
 * submission or proceed without a receipt, but it must never store a path for an object that is not
 * actually there. That mismatch is what left administrators looking at broken images.
 */
export const uploadReceipt = async (
    asset: ReceiptAsset,
    kind: ReceiptKind,
    clientRequestId: string,
): Promise<ReceiptUploadResult> => {
    try {
        if (!asset.base64) {
            return {
                path: null,
                error: 'That receipt could not be read from your device. Please pick it again.',
                retryable: false,
            };
        }

        const contentType = resolveMime(asset);
        const ext = EXT_FOR_MIME[contentType] ?? 'jpg';
        const path = `${kind}/${clientRequestId}.${ext}`;

        const bytes = base64ToBytes(asset.base64);

        // The check that matters: a zero-byte upload is accepted by storage and produces an object
        // that renders as a broken image for the administrator, with no error on either side.
        if (bytes.byteLength === 0) {
            console.warn('[receipts] decoded 0 bytes — refusing to upload');
            return {
                path: null,
                error: 'That receipt came through empty. Please pick the image again.',
                retryable: false,
            };
        }

        if (bytes.byteLength > MAX_RECEIPT_BYTES) {
            return {
                path: null,
                error: 'That image is larger than 5 MB. Please choose a smaller one.',
                retryable: false,
            };
        }

        const { data, error } = await supabase.storage.from(RECEIPT_BUCKET).upload(path, bytes, {
            contentType,
            // Removed `upsert: true` because PostgreSQL `ON CONFLICT DO UPDATE` requires `SELECT` 
            // permission on the table to check for the existing row. Granting `SELECT` to anon on 
            // `storage.objects` would allow any parishioner to list and download all payment 
            // receipts (a massive privacy leak). Since `clientRequestId` is newly generated on 
            // every `handleSubmit` attempt anyway, a retry will always upload to a fresh path, 
            // making `upsert` completely unnecessary.
        });

        if (error) {
            console.warn('[receipts] upload failed:', error.message);
            return {
                path: null,
                error: 'The receipt could not be uploaded.',
                retryable: true,
            };
        }

        // Trust the write only if storage acknowledged a path.
        if (!data?.path) {
            console.warn('[receipts] upload returned no path');
            return { path: null, error: 'The receipt could not be uploaded.', retryable: true };
        }

        return { path };
    } catch (e) {
        console.warn('[receipts] upload error:', e instanceof Error ? e.message : e);
        return { path: null, error: 'The receipt could not be uploaded.', retryable: true };
    }
};

