/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RequestContext } from '../types/context.ts';

export function can(ctx: RequestContext, action: string): boolean {
  // Super admin can do everything across the platform
  if (ctx.role === 'super_admin') {
    return true;
  }

  // Business admin (Owner/Doctor/Salon owner) has full administrative access to their tenant
  if (ctx.role === 'business_admin') {
    return true;
  }

  // Staff members are governed by explicit permissions
  if (ctx.role === 'staff') {
    if (ctx.permissions.has('all')) {
      return true;
    }
    return ctx.permissions.has(action);
  }

  return false;
}

export function getDefaultStaffPermissions(): Set<string> {
  return new Set([
    'records.view',
    'records.create',
    'records.edit',
    'billing.create',
  ]);
}
