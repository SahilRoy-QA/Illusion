/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface RequestContext {
  readonly tenantId: string;
  readonly userId: string;
  readonly role: 'super_admin' | 'business_admin' | 'staff';
  readonly permissions: ReadonlySet<string>;
  readonly timezone: string;
  readonly requestId: string;
  readonly impersonatedBy?: string;
}

export interface SuperAdminSeed {
  username: string; // "admin"
  passwordHash: string; // SHA-256 (via the browser's built-in Web Crypto SubtleCrypto), computed once at seed time — the raw password string is never written into source, config, or any log
  mustChangePassword: boolean; // seed true; the account can change its own password from its profile screen at any time regardless of this flag
}

export interface UserAccount {
  id: string;
  username?: string;
  tenantId?: string;
  email: string;
  fullName: string;
  role: 'super_admin' | 'business_admin' | 'staff';
  customRoleLabel?: string;
  active: boolean;
  passwordHash?: string;
  mustChangePassword?: boolean;
  lastLoginAt?: string;
  createdAt: string;
}
