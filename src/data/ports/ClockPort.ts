/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ClockPort {
  nowIso(): string;
}

export class SystemClock implements ClockPort {
  nowIso(): string {
    return new Date().toISOString();
  }
}

export class DeterministicClock implements ClockPort {
  private currentIso: string;
  constructor(initialIso: string) {
    this.currentIso = initialIso;
  }
  nowIso(): string {
    return this.currentIso;
  }
  setIso(iso: string): void {
    this.currentIso = iso;
  }
}
