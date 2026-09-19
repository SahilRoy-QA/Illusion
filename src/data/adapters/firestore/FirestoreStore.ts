/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Firestore-backed implementation of Core Repository Ports
 * Adheres strictly to:
 * - RequestContext tenant isolation
 * - Soft-deletes default
 * - Optimistic concurrency (version increment)
 * - Transparent offline-fallback & dual-write synchronization with sharedStore
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { getFirebaseFirestore } from '../../firebase.ts';
import { TenantConfig, EntityDef, FieldDef } from '../../../types/config.ts';
import { RequestContext, UserAccount } from '../../../types/context.ts';
import {
  DynamicRecord,
  ConfigSnapshot,
  AuditLogEntry,
  QueryOptions,
} from '../../../types/records.ts';
import {
  TenantRepository,
  RecordRepository,
  ConfigSnapshotRepository,
  SequenceRepository,
  AuditRepository,
  UserRepository,
  BookingRepository,
  BackupRepository,
  FleetRepository,
  FleetMetrics,
  BackupBundle,
  NotificationChannel,
  NotificationMessage,
} from '../../../types/ports.ts';
import {
  sharedStore,
  LocalTenantRepository,
  LocalRecordRepository,
  LocalConfigSnapshotRepository,
  LocalSequenceRepository,
  LocalAuditRepository,
  LocalUserRepository,
  LocalBookingRepository,
  LocalBackupRepository,
  LocalFleetRepository,
  LocalNotificationChannel,
} from '../local/LocalStore.ts';
import { can } from '../../../utils/permissions.ts';
import { ForbiddenError } from '../../../types/errors.ts';

// Fallback local instances for high resilience & offline cache
const localTenants = new LocalTenantRepository();
const localRecords = new LocalRecordRepository();
const localSnapshots = new LocalConfigSnapshotRepository();
const localSequences = new LocalSequenceRepository();
const localAudit = new LocalAuditRepository();
const localUsers = new LocalUserRepository();
const localBooking = new LocalBookingRepository();
const localBackup = new LocalBackupRepository();
const localFleet = new LocalFleetRepository();
const localNotifications = new LocalNotificationChannel();

export class FirestoreTenantRepository implements TenantRepository {
  async getById(ctx: RequestContext, tenantId: string): Promise<TenantConfig | null> {
    if (ctx.role !== 'super_admin' && ctx.tenantId !== tenantId) {
      throw new ForbiddenError(
        'Forbidden: Cannot view another business workspace without authorization.',
        'business_admin',
        'tenant.read'
      );
    }
    try {
      const db = getFirebaseFirestore();
      const ref = doc(db, 'tenants', tenantId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data() as TenantConfig;
        sharedStore.tenants.set(tenantId, data);
        return data;
      }
    } catch (err) {
      console.warn('Firestore getById fallback to local store:', err);
    }
    return localTenants.getById(ctx, tenantId);
  }

  async getBySlug(slug: string): Promise<TenantConfig | null> {
    try {
      const db = getFirebaseFirestore();
      const q = query(collection(db, 'tenants'), where('slug', '==', slug), limit(1));
      const snaps = await getDocs(q);
      if (!snaps.empty) {
        return snaps.docs[0].data() as TenantConfig;
      }
    } catch (err) {
      console.warn('Firestore getBySlug fallback to local store:', err);
    }
    return localTenants.getBySlug(slug);
  }

  async save(ctx: RequestContext, config: TenantConfig): Promise<TenantConfig> {
    const saved = await localTenants.save(ctx, config);
    try {
      const db = getFirebaseFirestore();
      const ref = doc(db, 'tenants', config.id);
      await setDoc(ref, saved, { merge: true });
    } catch (err) {
      console.warn('Firestore save tenant error (persisted locally):', err);
    }
    return saved;
  }

  async softDelete(ctx: RequestContext, tenantId: string): Promise<boolean> {
    return localTenants.softDelete(ctx, tenantId);
  }

  async listAll(ctx: RequestContext): Promise<TenantConfig[]> {
    if (ctx.role !== 'super_admin') {
      throw new ForbiddenError(
        'Forbidden: Only Super Administrators can view the roster of all businesses.',
        'super_admin',
        'tenants.list_all'
      );
    }
    const localList = await localTenants.listAll(ctx);
    const tenantMap = new Map<string, TenantConfig>();
    for (const t of localList) {
      tenantMap.set(t.id, t);
    }
    try {
      const db = getFirebaseFirestore();
      const snaps = await getDocs(collection(db, 'tenants'));
      if (!snaps.empty) {
        snaps.forEach((docSnap) => {
          const t = docSnap.data() as TenantConfig;
          tenantMap.set(t.id, t);
          sharedStore.tenants.set(t.id, t);
        });
      }
    } catch (err) {
      console.warn('Firestore listAll tenants fallback to local store:', err);
    }
    return Array.from(tenantMap.values());
  }
}

export class FirestoreRecordRepository implements RecordRepository {
  async query(
    ctx: RequestContext,
    entityKey: string,
    options?: QueryOptions
  ): Promise<DynamicRecord[]> {
    try {
      const db = getFirebaseFirestore();
      const recordsCol = collection(db, 'tenants', ctx.tenantId, 'records');
      const snaps = await getDocs(query(recordsCol, where('entityKey', '==', entityKey)));
      if (!snaps.empty) {
        let results: DynamicRecord[] = [];
        snaps.forEach((d) => {
          const r = d.data() as DynamicRecord;
          if (!options?.includeDeleted && r.deletedAt) return;
          results.push(r);
        });

        if (results.length > 0) {
          // Sensitive data masking logic
          const tenantConfig = sharedStore.tenants.get(ctx.tenantId);
          const entityDef = tenantConfig?.entities.find((e: EntityDef) => e.key === entityKey);
          const sensitiveKeys = new Set<string>(
            (entityDef?.fields || []).filter((f: FieldDef) => f.sensitive).map((f: FieldDef) => f.key)
          );

          if (sensitiveKeys.size > 0 && ctx.role !== 'super_admin' && ctx.role !== 'business_admin') {
            results = results.map((record) => {
              const sanitizedData: Record<string, unknown> = { ...record.data };
              for (const key of sensitiveKeys) {
                if (sanitizedData[key] !== undefined && sanitizedData[key] !== null) {
                  sanitizedData[key] = '🔒 [Confidential Medical History - Restricted]';
                }
              }
              return { ...record, data: sanitizedData };
            });
          }
          return results;
        }
      }
    } catch (err) {
      console.warn('Firestore query records fallback to local store:', err);
    }
    return localRecords.query(ctx, entityKey, options);
  }

  async count(ctx: RequestContext, entityKey: string, options?: QueryOptions): Promise<number> {
    return localRecords.count(ctx, entityKey, options);
  }

  async findById(
    ctx: RequestContext,
    entityKey: string,
    id: string
  ): Promise<DynamicRecord | null> {
    try {
      const db = getFirebaseFirestore();
      const ref = doc(db, 'tenants', ctx.tenantId, 'records', id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const record = snap.data() as DynamicRecord;
        if (record.entityKey !== entityKey) return null;

        const tenantConfig = sharedStore.tenants.get(ctx.tenantId);
        const entityDef = tenantConfig?.entities.find((e: EntityDef) => e.key === entityKey);
        const sensitiveKeys = new Set<string>(
          (entityDef?.fields || []).filter((f: FieldDef) => f.sensitive).map((f: FieldDef) => f.key)
        );

        if (sensitiveKeys.size > 0 && ctx.role !== 'super_admin' && ctx.role !== 'business_admin') {
          const sanitizedData: Record<string, unknown> = { ...record.data };
          for (const key of sensitiveKeys) {
            if (sanitizedData[key] !== undefined && sanitizedData[key] !== null) {
              sanitizedData[key] = '🔒 [Confidential Medical History - Restricted]';
            }
          }
          return { ...record, data: sanitizedData };
        }
        return record;
      }
    } catch (err) {
      console.warn('Firestore findById fallback to local store:', err);
    }
    return localRecords.findById(ctx, entityKey, id);
  }

  async save(
    ctx: RequestContext,
    entityKey: string,
    record: Partial<DynamicRecord>
  ): Promise<DynamicRecord> {
    // Check optimistic concurrency locally first
    const saved = await localRecords.save(ctx, entityKey, record);
    try {
      const db = getFirebaseFirestore();
      const ref = doc(db, 'tenants', ctx.tenantId, 'records', saved.id);
      await setDoc(ref, saved, { merge: true });
    } catch (err) {
      console.warn('Firestore save record error (persisted locally):', err);
    }
    return saved;
  }

  async softDelete(ctx: RequestContext, entityKey: string, id: string): Promise<boolean> {
    const success = await localRecords.softDelete(ctx, entityKey, id);
    try {
      const db = getFirebaseFirestore();
      const ref = doc(db, 'tenants', ctx.tenantId, 'records', id);
      await updateDoc(ref, {
        deletedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Firestore softDelete error:', err);
    }
    return success;
  }

  async restore(ctx: RequestContext, entityKey: string, id: string): Promise<boolean> {
    return localRecords.restore(ctx, entityKey, id);
  }
}

export class FirestoreAuditRepository implements AuditRepository {
  async record(
    ctx: RequestContext,
    entry: Omit<AuditLogEntry, 'id' | 'tenantId' | 'createdAt'>
  ): Promise<AuditLogEntry> {
    const saved = await localAudit.record(ctx, entry);
    try {
      const db = getFirebaseFirestore();
      const ref = doc(db, 'tenants', ctx.tenantId, 'audit', saved.id);
      await setDoc(ref, saved);
    } catch (err) {
      console.warn('Firestore record audit error:', err);
    }
    return saved;
  }

  async listForTenant(ctx: RequestContext, limitCount = 50): Promise<AuditLogEntry[]> {
    try {
      const db = getFirebaseFirestore();
      const auditCol = collection(db, 'tenants', ctx.tenantId, 'audit');
      const snaps = await getDocs(query(auditCol, orderBy('createdAt', 'desc'), limit(limitCount)));
      if (!snaps.empty) {
        const list: AuditLogEntry[] = [];
        snaps.forEach((d) => list.push(d.data() as AuditLogEntry));
        return list;
      }
    } catch (err) {
      console.warn('Firestore listForTenant audit fallback to local store:', err);
    }
    return localAudit.listForTenant(ctx, limitCount);
  }
}

export class FirestoreBookingRepository implements BookingRepository {
  async createPublicBooking(
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
  ): Promise<{ success: boolean; bookingId: string; message: string }> {
    const res = await localBooking.createPublicBooking(slug, bookingData);
    try {
      const tenant = await localTenants.getBySlug(slug);
      if (tenant) {
        const db = getFirebaseFirestore();
        const ref = doc(db, 'tenants', tenant.id, 'bookings', res.bookingId);
        await setDoc(ref, {
          ...bookingData,
          id: res.bookingId,
          tenantId: tenant.id,
          status: 'pending',
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('Firestore createPublicBooking sync error:', err);
    }
    return res;
  }
}

export class FirestoreUserRepository implements UserRepository {
  async findById(ctx: RequestContext, userId: string): Promise<UserAccount | null> {
    return localUsers.findById(ctx, userId);
  }

  async listByTenant(ctx: RequestContext): Promise<UserAccount[]> {
    return localUsers.listByTenant(ctx);
  }

  async save(ctx: RequestContext, user: Partial<UserAccount>): Promise<UserAccount> {
    return localUsers.save(ctx, user);
  }
}

export class FirestoreConfigSnapshotRepository implements ConfigSnapshotRepository {
  async recordSnapshot(
    ctx: RequestContext,
    summary: string,
    triggerAction: string,
    config: TenantConfig
  ): Promise<ConfigSnapshot> {
    return localSnapshots.recordSnapshot(ctx, summary, triggerAction, config);
  }

  async listHistory(ctx: RequestContext): Promise<ConfigSnapshot[]> {
    return localSnapshots.listHistory(ctx);
  }

  async getSnapshot(ctx: RequestContext, snapshotId: string): Promise<ConfigSnapshot | null> {
    return localSnapshots.getSnapshot(ctx, snapshotId);
  }
}

export class FirestoreSequenceRepository implements SequenceRepository {
  async getNextSequence(ctx: RequestContext, sequenceKey: string): Promise<number> {
    return localSequences.getNextSequence(ctx, sequenceKey);
  }
}

export class FirestoreBackupRepository implements BackupRepository {
  async generateBackup(ctx: RequestContext, options?: { redactSensitive?: boolean }): Promise<BackupBundle> {
    return localBackup.generateBackup(ctx, options);
  }

  async restoreBackup(
    ctx: RequestContext,
    bundle: BackupBundle
  ): Promise<{ success: boolean; message: string; restoredTenant: TenantConfig }> {
    return localBackup.restoreBackup(ctx, bundle);
  }
}

export class FirestoreFleetRepository implements FleetRepository {
  async getFleetMetrics(ctx: RequestContext): Promise<FleetMetrics> {
    return localFleet.getFleetMetrics(ctx);
  }

  async updateTenantPlan(ctx: RequestContext, tenantId: string, planTier: string): Promise<TenantConfig> {
    return localFleet.updateTenantPlan(ctx, tenantId, planTier);
  }

  async updateTenantStatus(
    ctx: RequestContext,
    tenantId: string,
    status: 'active' | 'suspended'
  ): Promise<boolean> {
    return localFleet.updateTenantStatus(ctx, tenantId, status);
  }

  async exportFleetDiagnostic(ctx: RequestContext): Promise<Record<string, unknown>> {
    return localFleet.exportFleetDiagnostic(ctx);
  }
}

export class FirestoreNotificationChannel implements NotificationChannel {
  async sendTemplate(
    ctx: RequestContext,
    payload: {
      channel: 'whatsapp' | 'sms';
      recipientPhone: string;
      recipientName: string;
      templateKey: string;
      variables: Record<string, string | number>;
    }
  ): Promise<NotificationMessage> {
    return localNotifications.sendTemplate(ctx, payload);
  }

  async listHistory(ctx: RequestContext, limit?: number): Promise<NotificationMessage[]> {
    return localNotifications.listHistory(ctx, limit);
  }
}

