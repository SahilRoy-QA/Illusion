/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FilterExpr } from './config.ts';

export interface DynamicRecord {
  id: string;
  tenantId: string;
  entityKey: string;
  data: Record<string, unknown>;
  version: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface QueryOptions {
  filter?: FilterExpr[];
  search?: string;
  sort?: { field: string; dir: 'asc' | 'desc' };
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}

export interface ConfigSnapshot {
  id: string;
  tenantId: string;
  summary: string;
  triggerAction: string;
  configState: unknown; // TenantConfig
  createdBy?: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  actorId?: string;
  actorName: string;
  action: 'create' | 'update' | 'delete' | 'restore';
  entityKey: string;
  entityId: string;
  diff: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    changes?: string[];
  };
  createdAt: string;
}
