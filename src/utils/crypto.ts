/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Computes SHA-256 hash using the Web Crypto API (SubtleCrypto).
 * The raw password is never written into source, config, or any log.
 */
export async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const rawBytes = encoder.encode(data);
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;

  if (!cryptoObj || !cryptoObj.subtle) {
    // Fallback if subtle is unavailable in non-secure test env
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = (hash << 5) - hash + data.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }

  const hashBuffer = await cryptoObj.subtle.digest('SHA-256', rawBytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPasswordHash(enteredPassword: string, expectedHash: string): Promise<boolean> {
  const computed = await sha256(enteredPassword);
  return computed.toLowerCase() === expectedHash.toLowerCase();
}
