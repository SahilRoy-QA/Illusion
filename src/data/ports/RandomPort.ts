/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface RandomPort {
  uuid(): string;
  nextSeq(prefix: string, sequence: number, digits?: number): string;
}

export class SystemRandom implements RandomPort {
  uuid(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback standard RFC4122 v4
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  nextSeq(prefix: string, sequence: number, digits = 4): string {
    const padded = String(sequence).padStart(digits, '0');
    return `${prefix}-${padded}`;
  }
}
