/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RequestContext, UserAccount } from './context.ts';
import { TenantConfig } from './config.ts';
import { DynamicRecord, QueryOptions, ConfigSnapshot, AuditLogEntry } from './records.ts';

export interface TenantRepository {
  getById(ctx: RequestContext, tenantId: string): Promise<TenantConfig | null>;
  getBySlug(slug: string): Promise<TenantConfig | null>;
  listAll(ctx: RequestContext): Promise<TenantConfig[]>;
  save(ctx: RequestContext, config: TenantConfig): Promise<TenantConfig>;
  softDelete(ctx: RequestContext, tenantId: string): Promise<boolean>;
}

export interface RecordRepository {
  findById(ctx: RequestContext, entityKey: string, id: string): Promise<DynamicRecord | null>;
  query(ctx: RequestContext, entityKey: string, options?: QueryOptions): Promise<DynamicRecord[]>;
  count(ctx: RequestContext, entityKey: string, options?: QueryOptions): Promise<number>;
  save(ctx: RequestContext, entityKey: string, record: Partial<DynamicRecord>): Promise<DynamicRecord>;
  softDelete(ctx: RequestContext, entityKey: string, id: string): Promise<boolean>;
  restore(ctx: RequestContext, entityKey: string, id: string): Promise<boolean>;
}

export interface ConfigSnapshotRepository {
  recordSnapshot(ctx: RequestContext, summary: string, triggerAction: string, config: TenantConfig): Promise<ConfigSnapshot>;
  listHistory(ctx: RequestContext): Promise<ConfigSnapshot[]>;
  getSnapshot(ctx: RequestContext, snapshotId: string): Promise<ConfigSnapshot | null>;
}

export interface SequenceRepository {
  getNextSequence(ctx: RequestContext, sequenceKey: string): Promise<number>;
}

export interface AuditRepository {
  record(ctx: RequestContext, entry: Omit<AuditLogEntry, 'id' | 'tenantId' | 'createdAt'>): Promise<AuditLogEntry>;
  listForTenant(ctx: RequestContext, limit?: number): Promise<AuditLogEntry[]>;
}

export interface UserRepository {
  findById(ctx: RequestContext, userId: string): Promise<UserAccount | null>;
  listByTenant(ctx: RequestContext): Promise<UserAccount[]>;
  save(ctx: RequestContext, user: Partial<UserAccount>): Promise<UserAccount>;
}

export interface BookingRepository {
  createPublicBooking(
    slug: string,
    bookingData: {
      customerName: string;
      customerPhone: string;
      customerEmail?: string;
      serviceRequested: string;
      preferredDate: string;
      preferredTime: string;
      notes?: string;
    }
  ): Promise<{ success: boolean; bookingId: string; message: string }>;
}

export interface BackupBundle {
  version: number;
  exportedAt: string;
  platform: string;
  exportedBy: {
    id: string;
    name: string;
    email?: string;
    role: string;
  };
  tenant: TenantConfig;
  records: DynamicRecord[];
  team: UserAccount[];
  snapshots: ConfigSnapshot[];
  stats: {
    recordCount: number;
    teamCount: number;
    snapshotCount: number;
  };
}

export interface BackupRepository {
  generateBackup(ctx: RequestContext, options?: { redactSensitive?: boolean }): Promise<BackupBundle>;
  restoreBackup(
    ctx: RequestContext,
    bundle: BackupBundle
  ): Promise<{ success: boolean; message: string; restoredTenant: TenantConfig }>;
}

export interface TenantFleetSummary {
  id: string;
  name: string;
  slug: string;
  businessTypeKey: string;
  status: 'trial' | 'active' | 'suspended';
  planTier: string;
  createdAt?: string;
  recordCount: number;
  maxRecords: number;
  staffCount: number;
  maxStaff: number;
  snapshotCount: number;
  auditCount: number;
  timezone: string;
  currency: string;
}

export interface FleetMetrics {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  totalRecords: number;
  totalTeamMembers: number;
  tierCounts: {
    starter: number;
    growth: number;
    scale: number;
  };
  typeCounts: Record<string, number>;
  tenants: TenantFleetSummary[];
}

export interface FleetRepository {
  getFleetMetrics(ctx: RequestContext): Promise<FleetMetrics>;
  updateTenantStatus(
    ctx: RequestContext,
    tenantId: string,
    status: 'active' | 'suspended'
  ): Promise<boolean>;
  updateTenantPlan(
    ctx: RequestContext,
    tenantId: string,
    planTier: string
  ): Promise<TenantConfig>;
  exportFleetDiagnostic(ctx: RequestContext): Promise<Record<string, unknown>>;
}

export interface NotificationMessage {
  id: string;
  tenantId: string;
  channel: 'whatsapp' | 'sms';
  recipientPhone: string;
  recipientName: string;
  templateKey: string;
  renderedText: string;
  status: 'sent' | 'queued' | 'simulated';
  createdAt: string;
  waUrl?: string;
}

export interface NotificationChannel {
  sendTemplate(
    ctx: RequestContext,
    payload: {
      channel: 'whatsapp' | 'sms';
      recipientPhone: string;
      recipientName: string;
      templateKey: string;
      variables: Record<string, string | number>;
    }
  ): Promise<NotificationMessage>;
  listHistory(ctx: RequestContext, limit?: number): Promise<NotificationMessage[]>;
}

export interface AuthProvider {
  getCurrentContext(): RequestContext;
  getCurrentUser(): Promise<UserAccount | null>;
  hasActiveSession(): boolean;
  login(userId: string): Promise<UserAccount>;
  loginWithCredentials(identifier: string, password: string): Promise<UserAccount>;
  changePassword(userId: string, newPassword: string): Promise<boolean>;
  logout(): Promise<void>;
  listDemoUsers(): Promise<UserAccount[]>;
  switchTenant(tenantId: string, role?: 'business_admin' | 'staff'): Promise<void>;
  startImpersonation(superAdminId: string, targetTenantId: string): Promise<void>;
  endImpersonation(): Promise<void>;
}
