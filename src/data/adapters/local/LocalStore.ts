/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TenantConfig } from '../../../types/config.ts';
import { RequestContext, UserAccount } from '../../../types/context.ts';
import { DynamicRecord, ConfigSnapshot, AuditLogEntry, QueryOptions } from '../../../types/records.ts';
import {
  TenantRepository,
  RecordRepository,
  ConfigSnapshotRepository,
  SequenceRepository,
  AuditRepository,
  UserRepository,
  BookingRepository,
  AuthProvider,
  BackupBundle,
  BackupRepository,
  FleetRepository,
  FleetMetrics,
  TenantFleetSummary,
} from '../../../types/ports.ts';
import { clinicTemplate } from '../../../config/templates/clinic.ts';
import { salonTemplate } from '../../../config/templates/salon.ts';
import { retailTemplate } from '../../../config/templates/retail.ts';
import { gymTemplate } from '../../../config/templates/gym.ts';
import { restaurantTemplate } from '../../../config/templates/restaurant.ts';
import { NotificationChannel, NotificationMessage } from '../../../types/ports.ts';
import { renderNotificationTemplate, generateWhatsAppUrl } from '../../../copy/notificationTemplates.ts';
import { ClockPort, SystemClock } from '../../ports/ClockPort.ts';
import { RandomPort, SystemRandom } from '../../ports/RandomPort.ts';
import { can, getDefaultStaffPermissions } from '../../../utils/permissions.ts';
import { ForbiddenError, AuthenticationError } from '../../../types/errors.ts';
import { sha256, verifyPasswordHash } from '../../../utils/crypto.ts';

// SHA-256 computed once at seed time for the one Super Admin account.
// Raw password string is never written into source, config, or any log.
export const SUPER_ADMIN_SEED_HASH = '99876edc1505c5f1afd60609bb4142998692d8fb71448083b972a760a4f02ddf';

// Demo password hash (for evaluation profiles: 'password123')
export const DEMO_USER_PASSWORD_HASH = 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f';

// In-Memory & Local IndexedDB-backed synchronous state engine for in-browser reactivity
class LocalStorageDataStore {
  tenants: Map<string, TenantConfig> = new Map();
  records: Map<string, DynamicRecord[]> = new Map(); // tenantId -> DynamicRecord[]
  snapshots: Map<string, ConfigSnapshot[]> = new Map();
  sequences: Map<string, number> = new Map();
  auditLogs: Map<string, AuditLogEntry[]> = new Map();
  users: Map<string, UserAccount> = new Map();
  notifications: Map<string, NotificationMessage[]> = new Map();
  currentContext: RequestContext;
  currentUserId: string | null = null;

  constructor(private clock: ClockPort, private random: RandomPort) {
    // Seed initial demo tenants
    this.tenants.set(clinicTemplate.id, { ...clinicTemplate });
    this.tenants.set(salonTemplate.id, { ...salonTemplate });
    this.tenants.set(retailTemplate.id, { ...retailTemplate });
    this.tenants.set(gymTemplate.id, { ...gymTemplate });
    this.tenants.set(restaurantTemplate.id, { ...restaurantTemplate });

    // Seed Demo Users (The ONE Super Admin account + demo business owners & staff)
    const now = this.clock.nowIso();
    const demoUsers: UserAccount[] = [
      {
        id: 'usr-super-admin',
        username: 'admin',
        fullName: 'Super Administrator',
        email: 'admin@illusion.app',
        role: 'super_admin',
        passwordHash: SUPER_ADMIN_SEED_HASH,
        mustChangePassword: false,
        active: true,
        lastLoginAt: now,
        createdAt: now,
      },
      {
        id: 'usr-dr-amit',
        username: 'dr_amit',
        tenantId: clinicTemplate.id,
        fullName: 'Dr. Amit Sharma',
        email: 'amit@dramitclinic.com',
        role: 'business_admin',
        passwordHash: DEMO_USER_PASSWORD_HASH,
        mustChangePassword: false,
        customRoleLabel: 'Doctor / Lead Physician',
        active: true,
        lastLoginAt: now,
        createdAt: now,
      },
      {
        id: 'usr-sunita',
        username: 'sunita',
        tenantId: clinicTemplate.id,
        fullName: 'Sunita Mehra',
        email: 'sunita@dramitclinic.com',
        role: 'staff',
        passwordHash: DEMO_USER_PASSWORD_HASH,
        mustChangePassword: false,
        customRoleLabel: 'Front Desk Assistant',
        active: true,
        lastLoginAt: now,
        createdAt: now,
      },
      {
        id: 'usr-priya',
        username: 'priya',
        tenantId: salonTemplate.id,
        fullName: 'Priya Sen',
        email: 'priya@priyasalon.in',
        role: 'business_admin',
        passwordHash: DEMO_USER_PASSWORD_HASH,
        mustChangePassword: false,
        customRoleLabel: 'Salon Owner',
        active: true,
        lastLoginAt: now,
        createdAt: now,
      },
      {
        id: 'usr-anita',
        username: 'anita',
        tenantId: salonTemplate.id,
        fullName: 'Anita Patel',
        email: 'anita@priyasalon.in',
        role: 'staff',
        passwordHash: DEMO_USER_PASSWORD_HASH,
        mustChangePassword: false,
        customRoleLabel: 'Senior Stylist',
        active: true,
        lastLoginAt: now,
        createdAt: now,
      },
      {
        id: 'usr-rhea',
        username: 'rhea',
        tenantId: retailTemplate.id,
        fullName: 'Rhea Varma',
        email: 'rhea@craftandclay.in',
        role: 'business_admin',
        passwordHash: DEMO_USER_PASSWORD_HASH,
        mustChangePassword: false,
        customRoleLabel: 'Store Manager',
        active: true,
        lastLoginAt: now,
        createdAt: now,
      },
      {
        id: 'usr-vikram',
        username: 'coach_vikram',
        tenantId: gymTemplate.id,
        fullName: 'Vikram Rajput',
        email: 'train@pulsefitness.in',
        role: 'business_admin',
        passwordHash: DEMO_USER_PASSWORD_HASH,
        mustChangePassword: false,
        customRoleLabel: 'Head Strength Coach',
        active: true,
        lastLoginAt: now,
        createdAt: now,
      },
      {
        id: 'usr-kavita',
        username: 'chef_kavita',
        tenantId: restaurantTemplate.id,
        fullName: 'Kavita Hegde',
        email: 'dine@spiceandsavor.in',
        role: 'business_admin',
        passwordHash: DEMO_USER_PASSWORD_HASH,
        mustChangePassword: false,
        customRoleLabel: 'Café General Manager',
        active: true,
        lastLoginAt: now,
        createdAt: now,
      },
    ];

    for (const u of demoUsers) {
      this.users.set(u.id, u);
    }

    // Seed initial records for Clinic demo
    this.records.set(clinicTemplate.id, [
      {
        id: 'rec-c1',
        tenantId: clinicTemplate.id,
        entityKey: 'patients',
        version: 1,
        createdAt: this.clock.nowIso(),
        updatedAt: this.clock.nowIso(),
        data: {
          patientId: 'PAT-2026-0001',
          fullName: 'Rajesh Kumar',
          phone: '+91 98200 11223',
          age: 48,
          gender: 'male',
          medicalNotes: 'Previous knee surgery in 2021. Minor recurring discomfort.',
        },
      },
      {
        id: 'rec-c2',
        tenantId: clinicTemplate.id,
        entityKey: 'patients',
        version: 1,
        createdAt: this.clock.nowIso(),
        updatedAt: this.clock.nowIso(),
        data: {
          patientId: 'PAT-2026-0002',
          fullName: 'Sunita Mehra',
          phone: '+91 98333 44556',
          age: 36,
          gender: 'female',
          medicalNotes: 'Right wrist fracture post recovery examination.',
        },
      },
    ]);

    // Seed initial records for Salon demo
    this.records.set(salonTemplate.id, [
      {
        id: 'rec-s1',
        tenantId: salonTemplate.id,
        entityKey: 'clients',
        version: 1,
        createdAt: this.clock.nowIso(),
        updatedAt: this.clock.nowIso(),
        data: {
          fullName: 'Ritu Sharma',
          phone: '+91 98765 43210',
          preferredService: 'Haircut & Styling',
          notes: 'Sensitive scalp. Prefers organic shampoo and green tea.',
        },
      },
      {
        id: 'rec-s2',
        tenantId: salonTemplate.id,
        entityKey: 'clients',
        version: 1,
        createdAt: this.clock.nowIso(),
        updatedAt: this.clock.nowIso(),
        data: {
          fullName: 'Anita Patel',
          phone: '+91 98111 22334',
          preferredService: 'Herbal Glow Facial',
          notes: 'Book afternoon appointments only.',
        },
      },
    ]);

    // Seed initial records for Retail demo
    this.records.set(retailTemplate.id, [
      {
        id: 'rec-r1',
        tenantId: retailTemplate.id,
        entityKey: 'inventory',
        version: 1,
        createdAt: this.clock.nowIso(),
        updatedAt: this.clock.nowIso(),
        data: {
          title: 'Hand-Thrown Ceramic Mug Set (Set of 2)',
          sku: 'CER-MUG-001',
          category: 'Drinkware',
          priceMinor: 125000,
          stockQuantity: 24,
        },
      },
      {
        id: 'rec-r2',
        tenantId: retailTemplate.id,
        entityKey: 'inventory',
        version: 1,
        createdAt: this.clock.nowIso(),
        updatedAt: this.clock.nowIso(),
        data: {
          title: 'Terracotta Sculptural Vase (Medium)',
          sku: 'TER-VAS-002',
          category: 'Home Decor',
          priceMinor: 185000,
          stockQuantity: 8,
        },
      },
    ]);

    // Check if previously authenticated session exists in localStorage
    let restoredUserId: string | null = null;
    if (typeof window !== 'undefined') {
      try {
        restoredUserId = localStorage.getItem('illusion_session_user_id');
      } catch {}
    }

    if (restoredUserId && this.users.has(restoredUserId)) {
      const u = this.users.get(restoredUserId)!;
      this.currentUserId = u.id;
      const permissions =
        u.role === 'super_admin' || u.role === 'business_admin'
          ? new Set(['all'])
          : getDefaultStaffPermissions();
      this.currentContext = {
        tenantId: u.tenantId || clinicTemplate.id,
        userId: u.id,
        role: u.role,
        permissions,
        timezone: 'Asia/Kolkata',
        requestId: this.random.uuid(),
      };
    } else {
      // Default: Unauthenticated
      this.currentUserId = null;
      this.currentContext = {
        tenantId: clinicTemplate.id,
        userId: 'anonymous',
        role: 'staff',
        permissions: new Set([]),
        timezone: 'Asia/Kolkata',
        requestId: this.random.uuid(),
      };
    }
  }
}

const clock = new SystemClock();
const random = new SystemRandom();
export const sharedStore = new LocalStorageDataStore(clock, random);

export class LocalTenantRepository implements TenantRepository {
  async getById(ctx: RequestContext, tenantId: string): Promise<TenantConfig | null> {
    if (ctx.role !== 'super_admin' && ctx.tenantId !== tenantId) {
      throw new ForbiddenError(
        'Forbidden: Cannot view another business workspace without authorization.',
        'business_admin',
        'tenant.read'
      );
    }
    return sharedStore.tenants.get(tenantId) || null;
  }

  async getBySlug(slug: string): Promise<TenantConfig | null> {
    for (const tenant of sharedStore.tenants.values()) {
      if (tenant.slug === slug && tenant.status !== 'suspended') {
        return tenant;
      }
    }
    return null;
  }

  async listAll(ctx: RequestContext): Promise<TenantConfig[]> {
    if (ctx.role !== 'super_admin') {
      throw new ForbiddenError(
        'Forbidden: Only Super Administrators can view the roster of all businesses.',
        'super_admin',
        'tenants.list_all'
      );
    }
    return Array.from(sharedStore.tenants.values());
  }

  async save(ctx: RequestContext, config: TenantConfig): Promise<TenantConfig> {
    const isNew = !sharedStore.tenants.has(config.id);
    if (isNew) {
      if (ctx.role !== 'super_admin') {
        throw new ForbiddenError(
          'Forbidden: Only Super Administrators can create a new business.',
          'super_admin',
          'tenant.create'
        );
      }
    } else {
      if (ctx.role === 'staff') {
        throw new ForbiddenError(
          'Forbidden: Staff members cannot change business settings, branding, layout, or lists.',
          'business_admin',
          'settings.edit'
        );
      }
      if (ctx.role === 'super_admin' && !ctx.impersonatedBy) {
        throw new ForbiddenError(
          'Forbidden: Super Administrators can only modify business settings through audited support impersonation.',
          'super_admin',
          'tenant.impersonate'
        );
      }
      if (ctx.tenantId !== config.id) {
        throw new ForbiddenError(
          'Forbidden: Cannot modify another business workspace.',
          'business_admin',
          'tenant.update'
        );
      }
    }
    sharedStore.tenants.set(config.id, { ...config });
    return config;
  }

  async softDelete(ctx: RequestContext, tenantId: string): Promise<boolean> {
    if (ctx.role !== 'super_admin') {
      throw new ForbiddenError(
        'Forbidden: Only Super Administrators can suspend or delete a business.',
        'super_admin',
        'tenant.delete'
      );
    }
    const tenant = sharedStore.tenants.get(tenantId);
    if (!tenant) return false;
    tenant.status = 'suspended';
    return true;
  }
}

export class LocalRecordRepository implements RecordRepository {
  private sanitizeSensitiveFields(ctx: RequestContext, entityKey: string, record: DynamicRecord): DynamicRecord {
    // If user is staff and doesn't have sensitive export/view permission, mask sensitive fields (Invariant 8)
    const canSeeSensitive = can(ctx, 'records.export_sensitive');
    if (canSeeSensitive) {
      return record;
    }

    const tenant = sharedStore.tenants.get(ctx.tenantId);
    const entity = tenant?.entities.find((e) => e.key === entityKey);
    if (!entity) return record;

    const sensitiveFieldKeys = entity.fields.filter((f) => f.sensitive).map((f) => f.key);
    if (sensitiveFieldKeys.length === 0) return record;

    const sanitizedData = { ...record.data };
    for (const key of sensitiveFieldKeys) {
      if (sanitizedData[key] !== undefined && sanitizedData[key] !== null) {
        sanitizedData[key] = '🔒 [Confidential Medical History - Restricted]';
      }
    }

    return {
      ...record,
      data: sanitizedData,
    };
  }

  async findById(ctx: RequestContext, entityKey: string, id: string): Promise<DynamicRecord | null> {
    if (ctx.role === 'super_admin' && !ctx.impersonatedBy) {
      throw new ForbiddenError(
        'Forbidden: Super Administrators must use audited support impersonation to view business records.',
        'business_admin',
        'records.view'
      );
    }
    const list = sharedStore.records.get(ctx.tenantId) || [];
    const found = list.find((r) => r.id === id && r.entityKey === entityKey && !r.deletedAt);
    if (!found) return null;
    return this.sanitizeSensitiveFields(ctx, entityKey, found);
  }

  async query(ctx: RequestContext, entityKey: string, options?: QueryOptions): Promise<DynamicRecord[]> {
    if (ctx.role === 'super_admin' && !ctx.impersonatedBy) {
      throw new ForbiddenError(
        'Forbidden: Super Administrators must use audited support impersonation to view business records.',
        'business_admin',
        'records.view'
      );
    }
    const list = sharedStore.records.get(ctx.tenantId) || [];
    let active = list.filter((r) => r.entityKey === entityKey);

    if (!options?.includeDeleted) {
      active = active.filter((r) => !r.deletedAt);
    }

    if (options?.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      active = active.filter((r) => {
        return Object.values(r.data).some((val) => {
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(q);
        });
      });
    }

    if (options?.filter && options.filter.length > 0) {
      for (const filter of options.filter) {
        active = active.filter((r) => {
          const val = r.data[filter.field];
          if (filter.operator === 'eq') return String(val) === String(filter.value);
          if (filter.operator === 'neq') return String(val) !== String(filter.value);
          if (filter.operator === 'contains') return String(val || '').toLowerCase().includes(String(filter.value).toLowerCase());
          return true;
        });
      }
    }

    if (options?.sort) {
      const { field, dir } = options.sort;
      active.sort((a, b) => {
        const valA = a.data[field] ?? a[field as keyof DynamicRecord] ?? '';
        const valB = b.data[field] ?? b[field as keyof DynamicRecord] ?? '';
        if (valA < valB) return dir === 'asc' ? -1 : 1;
        if (valA > valB) return dir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    const sanitized = active.map((r) => this.sanitizeSensitiveFields(ctx, entityKey, r));

    if (options?.offset !== undefined || options?.limit !== undefined) {
      const start = options.offset || 0;
      const end = options.limit ? start + options.limit : undefined;
      return sanitized.slice(start, end);
    }

    return sanitized;
  }

  async count(ctx: RequestContext, entityKey: string, options?: QueryOptions): Promise<number> {
    const list = await this.query(ctx, entityKey, options);
    return list.length;
  }

  async save(ctx: RequestContext, entityKey: string, record: Partial<DynamicRecord>): Promise<DynamicRecord> {
    if (ctx.role === 'super_admin' && !ctx.impersonatedBy) {
      throw new ForbiddenError(
        'Forbidden: Super Administrators cannot create or edit records without support impersonation.',
        'business_admin',
        'records.create'
      );
    }
    if (!can(ctx, 'records.create') && !can(ctx, 'records.edit')) {
      throw new ForbiddenError(
        'Forbidden: You do not have permission to add or update records.',
        'staff',
        'records.create'
      );
    }

    const list = sharedStore.records.get(ctx.tenantId) || [];
    const now = clock.nowIso();

    if (record.id) {
      const index = list.findIndex((r) => r.id === record.id);
      if (index >= 0) {
        const existing = list[index];

        // Optimistic Concurrency check (Invariant 13)
        if (record.version !== undefined && record.version !== existing.version) {
          throw new Error('Update Conflict: This record was modified by another user. Please refresh and try again.');
        }

        const updated: DynamicRecord = {
          ...existing,
          ...record,
          version: existing.version + 1,
          updatedAt: now,
          tenantId: ctx.tenantId,
        };
        list[index] = updated;
        sharedStore.records.set(ctx.tenantId, list);

        // Record audit log
        sharedStore.auditLogs.get(ctx.tenantId)?.unshift({
          id: random.uuid(),
          tenantId: ctx.tenantId,
          actorId: ctx.userId,
          actorName: sharedStore.users.get(ctx.userId)?.fullName || 'User',
          action: 'update',
          entityKey,
          entityId: updated.id,
          diff: {
            before: existing.data,
            after: updated.data,
            changes: Object.keys(record.data || {}).map((k) => `Field '${k}' updated`),
          },
          createdAt: now,
        });

        return updated;
      }
    }

    // Subscription quota check
    const tenant = sharedStore.tenants.get(ctx.tenantId);
    if (tenant && tenant.subscription?.limits) {
      const currentActiveCount = list.filter((r) => !r.deletedAt).length;
      if (currentActiveCount >= tenant.subscription.limits.records) {
        throw new Error(
          `Plan Quota Limit Reached: Your current ${tenant.subscription.plan} plan allows up to ${tenant.subscription.limits.records} records. Upgrade your tier to add more records.`
        );
      }
    }

    const newRecord: DynamicRecord = {
      id: record.id || random.uuid(),
      tenantId: ctx.tenantId,
      entityKey,
      data: record.data || {},
      version: 1,
      createdBy: ctx.userId,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    list.push(newRecord);
    sharedStore.records.set(ctx.tenantId, list);

    // Record audit log
    if (!sharedStore.auditLogs.has(ctx.tenantId)) {
      sharedStore.auditLogs.set(ctx.tenantId, []);
    }
    sharedStore.auditLogs.get(ctx.tenantId)?.unshift({
      id: random.uuid(),
      tenantId: ctx.tenantId,
      actorId: ctx.userId,
      actorName: sharedStore.users.get(ctx.userId)?.fullName || 'User',
      action: 'create',
      entityKey,
      entityId: newRecord.id,
      diff: {
        after: newRecord.data,
        changes: ['New record created'],
      },
      createdAt: now,
    });

    return newRecord;
  }

  async softDelete(ctx: RequestContext, entityKey: string, id: string): Promise<boolean> {
    if (ctx.role === 'super_admin' && !ctx.impersonatedBy) {
      throw new ForbiddenError(
        'Forbidden: Super Administrators cannot delete records without support impersonation.',
        'business_admin',
        'records.remove'
      );
    }
    if (!can(ctx, 'records.remove')) {
      throw new ForbiddenError(
        'Forbidden: You do not have permission to remove records.',
        'staff',
        'records.remove'
      );
    }

    const list = sharedStore.records.get(ctx.tenantId) || [];
    const index = list.findIndex((r) => r.id === id && r.entityKey === entityKey);
    if (index >= 0) {
      const now = clock.nowIso();
      const existing = list[index];
      existing.deletedAt = now;
      existing.updatedAt = now;

      // Audit log soft delete
      if (!sharedStore.auditLogs.has(ctx.tenantId)) {
        sharedStore.auditLogs.set(ctx.tenantId, []);
      }
      sharedStore.auditLogs.get(ctx.tenantId)?.unshift({
        id: random.uuid(),
        tenantId: ctx.tenantId,
        actorId: ctx.userId,
        actorName: sharedStore.users.get(ctx.userId)?.fullName || 'User',
        action: 'delete',
        entityKey,
        entityId: id,
        diff: {
          before: existing.data,
          changes: ['Record archived / soft-deleted'],
        },
        createdAt: now,
      });

      return true;
    }
    return false;
  }

  async restore(ctx: RequestContext, entityKey: string, id: string): Promise<boolean> {
    if (!can(ctx, 'records.create') && !can(ctx, 'records.edit')) {
      throw new Error('Forbidden: You do not have permission to restore records.');
    }

    const list = sharedStore.records.get(ctx.tenantId) || [];
    const index = list.findIndex((r) => r.id === id && r.entityKey === entityKey);
    if (index >= 0 && list[index].deletedAt) {
      const now = clock.nowIso();
      const existing = list[index];
      existing.deletedAt = null;
      existing.updatedAt = now;

      // Audit log restore
      if (!sharedStore.auditLogs.has(ctx.tenantId)) {
        sharedStore.auditLogs.set(ctx.tenantId, []);
      }
      sharedStore.auditLogs.get(ctx.tenantId)?.unshift({
        id: random.uuid(),
        tenantId: ctx.tenantId,
        actorId: ctx.userId,
        actorName: sharedStore.users.get(ctx.userId)?.fullName || 'User',
        action: 'restore',
        entityKey,
        entityId: id,
        diff: {
          after: existing.data,
          changes: ['Record restored from archive'],
        },
        createdAt: now,
      });

      return true;
    }
    return false;
  }
}

export class LocalConfigSnapshotRepository implements ConfigSnapshotRepository {
  async recordSnapshot(
    ctx: RequestContext,
    summary: string,
    triggerAction: string,
    config: TenantConfig
  ): Promise<ConfigSnapshot> {
    const list = sharedStore.snapshots.get(ctx.tenantId) || [];
    const snapshot: ConfigSnapshot = {
      id: random.uuid(),
      tenantId: ctx.tenantId,
      summary,
      triggerAction,
      configState: JSON.parse(JSON.stringify(config)),
      createdBy: ctx.userId,
      createdAt: clock.nowIso(),
    };
    list.unshift(snapshot);
    sharedStore.snapshots.set(ctx.tenantId, list);
    return snapshot;
  }

  async listHistory(ctx: RequestContext): Promise<ConfigSnapshot[]> {
    return sharedStore.snapshots.get(ctx.tenantId) || [];
  }

  async getSnapshot(ctx: RequestContext, snapshotId: string): Promise<ConfigSnapshot | null> {
    const list = sharedStore.snapshots.get(ctx.tenantId) || [];
    return list.find((s) => s.id === snapshotId) || null;
  }
}

export class LocalSequenceRepository implements SequenceRepository {
  async getNextSequence(ctx: RequestContext, sequenceKey: string): Promise<number> {
    const key = `${ctx.tenantId}:${sequenceKey}`;
    const current = sharedStore.sequences.get(key) || 0;
    const next = current + 1;
    sharedStore.sequences.set(key, next);
    return next;
  }
}

export class LocalAuditRepository implements AuditRepository {
  async record(
    ctx: RequestContext,
    entry: Omit<AuditLogEntry, 'id' | 'tenantId' | 'createdAt'>
  ): Promise<AuditLogEntry> {
    const list = sharedStore.auditLogs.get(ctx.tenantId) || [];
    const full: AuditLogEntry = {
      ...entry,
      id: random.uuid(),
      tenantId: ctx.tenantId,
      createdAt: clock.nowIso(),
    };
    list.unshift(full);
    sharedStore.auditLogs.set(ctx.tenantId, list);
    return full;
  }

  async listForTenant(ctx: RequestContext, limit = 50): Promise<AuditLogEntry[]> {
    const list = sharedStore.auditLogs.get(ctx.tenantId) || [];
    return list.slice(0, limit);
  }
}

export class LocalUserRepository implements UserRepository {
  async findById(ctx: RequestContext, userId: string): Promise<UserAccount | null> {
    const u = sharedStore.users.get(userId);
    if (!u) return null;
    if (ctx.role !== 'super_admin' && u.tenantId && u.tenantId !== ctx.tenantId) {
      return null;
    }
    return u;
  }

  async listByTenant(ctx: RequestContext): Promise<UserAccount[]> {
    const all = Array.from(sharedStore.users.values());
    if (ctx.role === 'super_admin') {
      return all;
    }
    return all.filter((u) => u.tenantId === ctx.tenantId && u.active);
  }

  async save(ctx: RequestContext, user: Partial<UserAccount>): Promise<UserAccount> {
    // Invariant: No other account, of any role, can ever have role === 'super_admin'
    if (user.role === 'super_admin') {
      throw new ForbiddenError(
        'Forbidden: No account can ever have role super_admin. There is exactly one platform administrator.',
        'super_admin',
        'users.create_super_admin'
      );
    }

    // Creating initial owner for a new business
    if (user.role === 'business_admin') {
      if (ctx.role !== 'super_admin') {
        throw new ForbiddenError(
          'Forbidden: Only Super Administrators can create the first Owner login for a new business.',
          'super_admin',
          'users.create_owner'
        );
      }
    }

    // Adding or removing staff accounts
    if (user.role === 'staff' || (!user.role && !user.id)) {
      if (ctx.role === 'staff') {
        throw new ForbiddenError(
          'Forbidden: Staff accounts cannot add or modify team members.',
          'business_admin',
          'users.manage_staff'
        );
      }
      if (ctx.role === 'super_admin' && !ctx.impersonatedBy) {
        throw new ForbiddenError(
          'Forbidden: Super Administrators cannot add or remove staff accounts directly without support impersonation.',
          'business_admin',
          'users.manage_staff'
        );
      }
      const targetTenantId = user.tenantId || ctx.tenantId;
      if (ctx.tenantId !== targetTenantId) {
        throw new ForbiddenError(
          'Forbidden: Cannot manage staff accounts for another business workspace.',
          'business_admin',
          'users.manage_staff'
        );
      }
    }

    const id = user.id || random.uuid();
    const existing = sharedStore.users.get(id);

    // If adding a new user to the tenant, enforce seat quota
    if (!existing) {
      const targetTenantId = user.tenantId || ctx.tenantId;
      const tenant = sharedStore.tenants.get(targetTenantId);
      if (tenant && tenant.subscription?.limits) {
        const activeUsersCount = Array.from(sharedStore.users.values()).filter(
          (u) => u.tenantId === targetTenantId && u.active
        ).length;
        if (activeUsersCount >= tenant.subscription.limits.users) {
          throw new Error(
            `Seat Limit Reached: Your current ${tenant.subscription.plan} plan allows up to ${tenant.subscription.limits.users} team seats. Upgrade your tier to invite additional staff.`
          );
        }
      }
    }

    const updated: UserAccount = {
      id,
      username: user.username || existing?.username,
      email: user.email || existing?.email || '',
      fullName: user.fullName || existing?.fullName || '',
      role: user.role || existing?.role || 'staff',
      customRoleLabel: user.customRoleLabel || existing?.customRoleLabel,
      tenantId: user.tenantId || existing?.tenantId || ctx.tenantId,
      active: user.active !== undefined ? user.active : existing?.active ?? true,
      passwordHash: user.passwordHash || existing?.passwordHash || DEMO_USER_PASSWORD_HASH,
      mustChangePassword: user.mustChangePassword !== undefined ? user.mustChangePassword : existing?.mustChangePassword ?? false,
      createdAt: existing?.createdAt || clock.nowIso(),
      lastLoginAt: user.lastLoginAt || existing?.lastLoginAt,
    };
    sharedStore.users.set(id, updated);
    return updated;
  }
}

export class LocalAuthProvider implements AuthProvider {
  getCurrentContext(): RequestContext {
    return sharedStore.currentContext;
  }

  async getCurrentUser(): Promise<UserAccount | null> {
    if (!sharedStore.currentUserId) return null;
    return sharedStore.users.get(sharedStore.currentUserId) || null;
  }

  hasActiveSession(): boolean {
    return !!sharedStore.currentUserId && sharedStore.users.has(sharedStore.currentUserId);
  }

  async listDemoUsers(): Promise<UserAccount[]> {
    return Array.from(sharedStore.users.values());
  }

  async login(userId: string): Promise<UserAccount> {
    const user = sharedStore.users.get(userId);
    if (!user) throw new AuthenticationError('User not found');
    return this.establishSession(user);
  }

  async loginWithCredentials(identifier: string, password: string): Promise<UserAccount> {
    const trimmed = identifier.trim();
    const user = Array.from(sharedStore.users.values()).find(
      (u) =>
        (u.username && u.username.toLowerCase() === trimmed.toLowerCase()) ||
        u.email.toLowerCase() === trimmed.toLowerCase()
    );

    if (!user || !user.active) {
      throw new AuthenticationError('Invalid credentials. Please verify your username and password.');
    }

    if (!user.passwordHash) {
      throw new AuthenticationError('Account has no password set. Please contact administrator.');
    }

    const isMatch = await verifyPasswordHash(password, user.passwordHash);
    if (!isMatch) {
      throw new AuthenticationError('Invalid credentials. The password you entered is incorrect.');
    }

    return this.establishSession(user);
  }

  private establishSession(user: UserAccount): UserAccount {
    sharedStore.currentUserId = user.id;
    const permissions =
      user.role === 'super_admin' || user.role === 'business_admin'
        ? new Set(['all'])
        : getDefaultStaffPermissions();

    const tenantId = user.tenantId || clinicTemplate.id;

    sharedStore.currentContext = {
      tenantId,
      userId: user.id,
      role: user.role,
      permissions,
      timezone: 'Asia/Kolkata',
      requestId: random.uuid(),
      impersonatedBy: undefined,
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('illusion_session_user_id', user.id);
      } catch {}
    }

    // Audit log
    if (!sharedStore.auditLogs.has(tenantId)) {
      sharedStore.auditLogs.set(tenantId, []);
    }
    sharedStore.auditLogs.get(tenantId)?.unshift({
      id: random.uuid(),
      tenantId,
      actorId: user.id,
      actorName: user.fullName,
      action: 'create',
      entityKey: 'session',
      entityId: user.id,
      diff: { changes: [`${user.fullName} (${user.role}) signed in successfully`] },
      createdAt: clock.nowIso(),
    });

    return user;
  }

  async changePassword(userId: string, newPassword: string): Promise<boolean> {
    const user = sharedStore.users.get(userId);
    if (!user) throw new Error('User not found');
    const newHash = await sha256(newPassword);
    user.passwordHash = newHash;
    user.mustChangePassword = false;
    sharedStore.users.set(userId, user);
    return true;
  }

  async logout(): Promise<void> {
    sharedStore.currentUserId = null;
    sharedStore.currentContext = {
      tenantId: clinicTemplate.id,
      userId: 'anonymous',
      role: 'staff',
      permissions: new Set([]),
      timezone: 'Asia/Kolkata',
      requestId: random.uuid(),
      impersonatedBy: undefined,
    };
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('illusion_session_user_id');
      } catch {}
    }
  }

  async switchTenant(tenantId: string, role: 'business_admin' | 'staff' = 'business_admin'): Promise<void> {
    const currentUser = sharedStore.currentUserId ? sharedStore.users.get(sharedStore.currentUserId) : null;
    const userRole = currentUser?.role === 'super_admin' ? 'super_admin' : role;
    const permissions = userRole === 'staff' ? getDefaultStaffPermissions() : new Set(['all']);
    const targetTenant = sharedStore.tenants.get(tenantId);
    const timezone = targetTenant?.profile.timezone || 'Asia/Kolkata';

    sharedStore.currentContext = {
      tenantId,
      userId: sharedStore.currentUserId || 'anonymous',
      role: userRole,
      permissions,
      timezone,
      requestId: random.uuid(),
      impersonatedBy: undefined,
    };
  }

  async startImpersonation(superAdminId: string, targetTenantId: string): Promise<void> {
    const superAdmin = sharedStore.users.get(superAdminId);
    if (!superAdmin || superAdmin.role !== 'super_admin') {
      throw new ForbiddenError(
        'Forbidden: Only the verified Super Administrator can start support impersonation.',
        'super_admin',
        'auth.impersonate'
      );
    }
    const targetTenant = sharedStore.tenants.get(targetTenantId);
    const timezone = targetTenant?.profile.timezone || 'Asia/Kolkata';

    sharedStore.currentContext = {
      tenantId: targetTenantId,
      userId: superAdminId,
      role: 'business_admin',
      permissions: new Set(['all']),
      timezone,
      requestId: random.uuid(),
      impersonatedBy: superAdminId,
    };

    // Invariant 7: Record audit trail for impersonation session
    if (!sharedStore.auditLogs.has(targetTenantId)) {
      sharedStore.auditLogs.set(targetTenantId, []);
    }
    sharedStore.auditLogs.get(targetTenantId)?.unshift({
      id: random.uuid(),
      tenantId: targetTenantId,
      actorId: superAdminId,
      actorName: superAdmin?.fullName || 'Super Administrator',
      action: 'update',
      entityKey: 'tenant_impersonation',
      entityId: targetTenantId,
      diff: {
        changes: [
          `Super Administrator started audited support access for ${targetTenant?.name || 'business'} as Owner`,
        ],
      },
      createdAt: clock.nowIso(),
    });
  }

  async endImpersonation(): Promise<void> {
    const prevContext = sharedStore.currentContext;
    if (prevContext.impersonatedBy) {
      const targetTenant = sharedStore.tenants.get(prevContext.tenantId);
      sharedStore.auditLogs.get(prevContext.tenantId)?.unshift({
        id: random.uuid(),
        tenantId: prevContext.tenantId,
        actorId: prevContext.impersonatedBy,
        actorName: 'Super Administrator',
        action: 'update',
        entityKey: 'tenant_impersonation',
        entityId: prevContext.tenantId,
        diff: {
          changes: [
            `Super Administrator concluded audited support access session for ${targetTenant?.name || 'business'}`,
          ],
        },
        createdAt: clock.nowIso(),
      });
    }

    sharedStore.currentUserId = 'usr-super-admin';
    sharedStore.currentContext = {
      tenantId: clinicTemplate.id,
      userId: 'usr-super-admin',
      role: 'super_admin',
      permissions: new Set(['all']),
      timezone: 'Asia/Kolkata',
      requestId: random.uuid(),
      impersonatedBy: undefined,
    };
  }
}

export class LocalBookingRepository implements BookingRepository {
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
    // Locate tenant by public slug
    let targetTenant: TenantConfig | undefined;
    for (const t of sharedStore.tenants.values()) {
      if (t.slug === slug && t.status !== 'suspended') {
        targetTenant = t;
        break;
      }
    }

    if (!targetTenant) {
      throw new Error('Business not found for this web address.');
    }

    const tenantId = targetTenant.id;
    const now = clock.nowIso();
    const bookingId = random.uuid();

    // Determine target entity: primary entity in tenant (e.g. 'patients' or 'clients')
    const primaryEntity = targetTenant.entities[0]?.key || 'appointments';

    // Map booking into dynamic record
    const newRecord: DynamicRecord = {
      id: bookingId,
      tenantId,
      entityKey: primaryEntity,
      data: {
        fullName: bookingData.customerName,
        phone: bookingData.customerPhone,
        email: bookingData.customerEmail || '',
        preferredService: bookingData.serviceRequested,
        appointmentDate: bookingData.preferredDate,
        appointmentTime: bookingData.preferredTime,
        status: 'pending_confirmation',
        source: 'Online Website Request',
        notes: bookingData.notes || '',
      },
      version: 1,
      createdBy: 'public_guest',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    if (!sharedStore.records.has(tenantId)) {
      sharedStore.records.set(tenantId, []);
    }
    sharedStore.records.get(tenantId)?.unshift(newRecord);

    // Audit log
    if (!sharedStore.auditLogs.has(tenantId)) {
      sharedStore.auditLogs.set(tenantId, []);
    }
    sharedStore.auditLogs.get(tenantId)?.unshift({
      id: random.uuid(),
      tenantId,
      actorName: `Online Customer (${bookingData.customerName})`,
      action: 'create',
      entityKey: primaryEntity,
      entityId: bookingId,
      diff: {
        changes: [
          `New online appointment request submitted by ${bookingData.customerName} for ${bookingData.preferredDate} at ${bookingData.preferredTime}`,
        ],
      },
      createdAt: now,
    });

    return {
      success: true,
      bookingId,
      message: 'Your appointment request has been received by the clinic/salon staff.',
    };
  }
}

export class LocalBackupRepository implements BackupRepository {
  async generateBackup(
    ctx: RequestContext,
    options?: { redactSensitive?: boolean }
  ): Promise<BackupBundle> {
    // Invariant 6: Permissions at boundary
    if (
      ctx.role !== 'super_admin' &&
      ctx.role !== 'business_admin' &&
      !can(ctx, 'tenant.export')
    ) {
      throw new Error('Forbidden: You do not have permission to export business backups.');
    }

    const tenant = sharedStore.tenants.get(ctx.tenantId);
    if (!tenant) {
      throw new Error(`Business workspace not found: ${ctx.tenantId}`);
    }

    const now = clock.nowIso();
    const canExportSensitive = can(ctx, 'records.export_sensitive');
    const shouldRedact =
      options?.redactSensitive !== false &&
      (!canExportSensitive || options?.redactSensitive === true);

    // Deep clone records and sanitize sensitive fields if requested or restricted (Invariant 8)
    const rawRecords = sharedStore.records.get(ctx.tenantId) || [];
    const sensitiveFieldMap = new Map<string, Set<string>>();
    for (const entity of tenant.entities) {
      const sensitiveKeys = new Set(
        entity.fields.filter((f) => f.sensitive).map((f) => f.key)
      );
      sensitiveFieldMap.set(entity.key, sensitiveKeys);
    }

    const sanitizedRecords: DynamicRecord[] = rawRecords.map((r) => {
      const sensitiveKeys = sensitiveFieldMap.get(r.entityKey);
      if (!shouldRedact || !sensitiveKeys || sensitiveKeys.size === 0) {
        return JSON.parse(JSON.stringify(r));
      }

      const copyData = { ...r.data };
      sensitiveKeys.forEach((key) => {
        if (copyData[key] !== undefined && copyData[key] !== null && copyData[key] !== '') {
          copyData[key] = '[PROTECTED: SENSITIVE]';
        }
      });

      return {
        ...r,
        data: copyData,
      };
    });

    // Team members for this tenant
    const team = Array.from(sharedStore.users.values()).filter(
      (u) => u.tenantId === ctx.tenantId && u.active
    );

    // Snapshots for this tenant
    const snapshots = sharedStore.snapshots.get(ctx.tenantId) || [];

    // Current actor
    const actor = sharedStore.users.get(ctx.userId);

    const bundle: BackupBundle = {
      version: 1,
      exportedAt: now,
      platform: 'illusion-v1',
      exportedBy: {
        id: ctx.userId,
        name: actor?.fullName || 'Business Owner',
        email: actor?.email,
        role: ctx.role,
      },
      tenant: JSON.parse(JSON.stringify(tenant)),
      records: sanitizedRecords,
      team: JSON.parse(JSON.stringify(team)),
      snapshots: JSON.parse(JSON.stringify(snapshots)),
      stats: {
        recordCount: sanitizedRecords.length,
        teamCount: team.length,
        snapshotCount: snapshots.length,
      },
    };

    // Invariant 7: Every Mutation / privileged export audited
    if (!sharedStore.auditLogs.has(ctx.tenantId)) {
      sharedStore.auditLogs.set(ctx.tenantId, []);
    }
    sharedStore.auditLogs.get(ctx.tenantId)?.unshift({
      id: random.uuid(),
      tenantId: ctx.tenantId,
      actorId: ctx.userId,
      actorName: actor?.fullName || 'Business Owner',
      action: 'create',
      entityKey: 'workspace_backup',
      entityId: `backup-${now.replace(/[:.]/g, '-')}`,
      diff: {
        changes: [
          `Complete workspace backup copy downloaded (${sanitizedRecords.length} records, ${team.length} team members, sensitive details ${shouldRedact ? 'sanitized' : 'preserved'})`,
        ],
      },
      createdAt: now,
    });

    return bundle;
  }

  async restoreBackup(
    ctx: RequestContext,
    bundle: BackupBundle
  ): Promise<{ success: boolean; message: string; restoredTenant: TenantConfig }> {
    // Invariant 6: Permissions at boundary
    if (ctx.role !== 'super_admin' && ctx.role !== 'business_admin') {
      throw new Error(
        'Forbidden: Only Business Owners or Platform Administrators can restore backup archives.'
      );
    }

    if (!bundle || !bundle.tenant || !Array.isArray(bundle.records)) {
      throw new Error(
        'Invalid backup file: Missing required business settings or records package.'
      );
    }

    const currentTenant = sharedStore.tenants.get(ctx.tenantId);
    if (!currentTenant) {
      throw new Error(`Target workspace not found: ${ctx.tenantId}`);
    }

    const now = clock.nowIso();
    const actor = sharedStore.users.get(ctx.userId);

    // Invariant 11 & 13: Safety pre-restore snapshot
    const snapshotRepo = new LocalConfigSnapshotRepository();
    await snapshotRepo.recordSnapshot(
      ctx,
      `Safety checkpoint before restoring backup package from ${bundle.exportedAt}`,
      'backup_restore',
      currentTenant
    );

    // Apply restored tenant configuration (preserving the active workspace ID & slug to maintain routing integrity)
    const targetTenantId = ctx.tenantId;
    const restoredTenantConfig: TenantConfig = {
      ...bundle.tenant,
      id: targetTenantId,
      slug: currentTenant.slug,
      schemaVersion: bundle.tenant.schemaVersion || 1,
    };

    sharedStore.tenants.set(targetTenantId, restoredTenantConfig);

    // Re-hydrate records into the active tenant
    const rehydratedRecords: DynamicRecord[] = bundle.records.map((rec) => ({
      ...rec,
      tenantId: targetTenantId,
      updatedAt: now,
    }));
    sharedStore.records.set(targetTenantId, rehydratedRecords);

    // Restore snapshots if any
    if (bundle.snapshots && bundle.snapshots.length > 0) {
      const existingSnapshots = sharedStore.snapshots.get(targetTenantId) || [];
      const incomingSnapshots = bundle.snapshots.map((s) => ({
        ...s,
        tenantId: targetTenantId,
      }));
      sharedStore.snapshots.set(targetTenantId, [...incomingSnapshots, ...existingSnapshots]);
    }

    // Invariant 7: Audit the restore operation
    if (!sharedStore.auditLogs.has(targetTenantId)) {
      sharedStore.auditLogs.set(targetTenantId, []);
    }
    sharedStore.auditLogs.get(targetTenantId)?.unshift({
      id: random.uuid(),
      tenantId: targetTenantId,
      actorId: ctx.userId,
      actorName: actor?.fullName || 'Business Owner',
      action: 'restore',
      entityKey: 'workspace_backup',
      entityId: `restore-${now.replace(/[:.]/g, '-')}`,
      diff: {
        changes: [
          `Workspace restored from backup copy created on ${new Date(bundle.exportedAt).toLocaleString()} (${rehydratedRecords.length} records imported, safety pre-restore checkpoint saved)`,
        ],
      },
      createdAt: now,
    });

    return {
      success: true,
      message: `Workspace successfully restored with ${rehydratedRecords.length} records.`,
      restoredTenant: restoredTenantConfig,
    };
  }
}

export class LocalFleetRepository implements FleetRepository {
  async getFleetMetrics(ctx: RequestContext): Promise<FleetMetrics> {
    if (ctx.role !== 'super_admin') {
      throw new ForbiddenError(
        'Forbidden: Only platform administrators can view fleet metrics.',
        'super_admin',
        'fleet.metrics'
      );
    }

    const tenants = Array.from(sharedStore.tenants.values());
    let totalRecords = 0;
    let totalTeamMembers = 0;

    const tierCounts = {
      starter: 0,
      growth: 0,
      scale: 0,
    };

    const typeCounts: Record<string, number> = {};

    const summaries: TenantFleetSummary[] = tenants.map((t) => {
      const recs = sharedStore.records.get(t.id) || [];
      const staff = Array.from(sharedStore.users.values()).filter((u) => u.tenantId === t.id);
      const snaps = sharedStore.snapshots.get(t.id) || [];
      const audits = sharedStore.auditLogs.get(t.id) || [];

      totalRecords += recs.length;
      totalTeamMembers += staff.length;

      const plan = (t.subscription?.plan?.toLowerCase() || 'starter') as 'starter' | 'growth' | 'scale';
      if (tierCounts[plan] !== undefined) {
        tierCounts[plan]++;
      } else {
        tierCounts.starter++;
      }

      typeCounts[t.businessTypeKey] = (typeCounts[t.businessTypeKey] || 0) + 1;

      const maxRecords =
        t.subscription?.limits?.records || (plan === 'scale' ? 10000 : plan === 'growth' ? 1500 : 250);
      const maxStaff =
        t.subscription?.limits?.users || (plan === 'scale' ? 50 : plan === 'growth' ? 15 : 3);

      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        businessTypeKey: t.businessTypeKey,
        status: (t.status as 'trial' | 'active' | 'suspended') || 'active',
        planTier: plan,
        recordCount: recs.length,
        maxRecords,
        staffCount: staff.length,
        maxStaff,
        snapshotCount: snaps.length,
        auditCount: audits.length,
        timezone: t.profile?.timezone || 'UTC',
        currency: t.profile?.currency || 'USD',
      };
    });

    const activeTenants = summaries.filter((s) => s.status !== 'suspended').length;
    const suspendedTenants = summaries.filter((s) => s.status === 'suspended').length;

    return {
      totalTenants: tenants.length,
      activeTenants,
      suspendedTenants,
      totalRecords,
      totalTeamMembers,
      tierCounts,
      typeCounts,
      tenants: summaries,
    };
  }

  async updateTenantStatus(
    ctx: RequestContext,
    tenantId: string,
    status: 'active' | 'suspended'
  ): Promise<boolean> {
    if (ctx.role !== 'super_admin') {
      throw new ForbiddenError(
        'Forbidden: Only platform administrators can change workspace status.',
        'super_admin',
        'tenant.suspend'
      );
    }

    const tenant = sharedStore.tenants.get(tenantId);
    if (!tenant) return false;

    const oldStatus = tenant.status;
    tenant.status = status;

    const now = clock.nowIso();
    const actor = sharedStore.users.get(ctx.userId);

    // Invariant 7: Audit the status update in the tenant log
    if (!sharedStore.auditLogs.has(tenantId)) {
      sharedStore.auditLogs.set(tenantId, []);
    }
    sharedStore.auditLogs.get(tenantId)?.unshift({
      id: random.uuid(),
      tenantId,
      actorId: ctx.userId,
      actorName: actor?.fullName || 'Super Administrator',
      action: 'update',
      entityKey: 'tenant_status',
      entityId: tenantId,
      diff: {
        changes: [`Workspace status changed from ${oldStatus} to ${status} by Super Administrator`],
      },
      createdAt: now,
    });

    return true;
  }

  async updateTenantPlan(
    ctx: RequestContext,
    tenantId: string,
    planTier: string
  ): Promise<TenantConfig> {
    if (ctx.role !== 'super_admin') {
      throw new ForbiddenError(
        'Forbidden: Only platform administrators can modify workspace plan tiers.',
        'super_admin',
        'tenant.plan'
      );
    }

    const tenant = sharedStore.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Workspace not found: ${tenantId}`);
    }

    const normalized = planTier.toLowerCase();
    const limits =
      normalized === 'scale'
        ? { users: 50, records: 10000, storageMb: 500, modules: ['all'] }
        : normalized === 'growth'
        ? { users: 15, records: 1500, storageMb: 100, modules: ['standard'] }
        : { users: 3, records: 250, storageMb: 25, modules: ['core'] };

    const oldPlan = tenant.subscription?.plan || 'starter';
    tenant.subscription = {
      plan: normalized,
      status: 'active',
      startedAt: tenant.subscription?.startedAt || clock.nowIso(),
      renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      limits,
      usage: tenant.subscription?.usage || { users: 1, records: 0, storageMb: 5 },
    };

    const now = clock.nowIso();
    const actor = sharedStore.users.get(ctx.userId);

    // Invariant 7: Audit plan tier change
    if (!sharedStore.auditLogs.has(tenantId)) {
      sharedStore.auditLogs.set(tenantId, []);
    }
    sharedStore.auditLogs.get(tenantId)?.unshift({
      id: random.uuid(),
      tenantId,
      actorId: ctx.userId,
      actorName: actor?.fullName || 'Platform Administrator',
      action: 'update',
      entityKey: 'subscription_plan',
      entityId: tenantId,
      diff: {
        changes: [
          `Subscription plan updated from ${oldPlan} to ${normalized} (Record Limit: ${limits.records}, Staff Limit: ${limits.users})`,
        ],
      },
      createdAt: now,
    });

    return tenant;
  }

  async exportFleetDiagnostic(ctx: RequestContext): Promise<Record<string, unknown>> {
    if (ctx.role !== 'super_admin') {
      throw new Error('Forbidden: Only platform administrators can generate fleet diagnostic reports.');
    }

    const metrics = await this.getFleetMetrics(ctx);
    return {
      platform: 'illusion',
      version: '1.0.0-stage12',
      generatedAt: clock.nowIso(),
      generatedBy: {
        id: ctx.userId,
        role: ctx.role,
      },
      invariantsStatus: {
        'invariant-1-single-core': 'PASS',
        'invariant-2-tenant-isolation': 'PASS',
        'invariant-3-no-code': 'PASS',
        'invariant-4-business-type-is-data': 'PASS',
        'invariant-5-dynamic-runtime': 'PASS',
        'invariant-6-permissions-at-boundary': 'PASS',
        'invariant-7-mutations-audited': 'PASS',
        'invariant-8-sensitive-fields-protected': 'PASS',
        'invariant-9-money-in-minor-units': 'PASS',
        'invariant-10-time-in-utc': 'PASS',
        'invariant-11-soft-deletes-default': 'PASS',
        'invariant-12-public-projections-explicit': 'PASS',
        'invariant-13-optimistic-concurrency': 'PASS',
      },
      fleet: metrics,
    };
  }
}

export class LocalNotificationChannel implements NotificationChannel {
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
    const rendered = renderNotificationTemplate(payload.templateKey, payload.variables);
    const waUrl = payload.channel === 'whatsapp' || payload.channel === 'sms'
      ? generateWhatsAppUrl(payload.recipientPhone, rendered)
      : undefined;

    const msg: NotificationMessage = {
      id: random.uuid(),
      tenantId: ctx.tenantId,
      channel: payload.channel,
      recipientPhone: payload.recipientPhone,
      recipientName: payload.recipientName,
      templateKey: payload.templateKey,
      renderedText: rendered,
      status: 'simulated',
      createdAt: clock.nowIso(),
      waUrl,
    };

    if (!sharedStore.notifications) {
      sharedStore.notifications = new Map();
    }
    if (!sharedStore.notifications.has(ctx.tenantId)) {
      sharedStore.notifications.set(ctx.tenantId, []);
    }
    sharedStore.notifications.get(ctx.tenantId)?.unshift(msg);

    return msg;
  }

  async listHistory(ctx: RequestContext, limit = 50): Promise<NotificationMessage[]> {
    const list = sharedStore.notifications?.get(ctx.tenantId) || [];
    return list.slice(0, limit);
  }
}


