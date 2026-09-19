/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TenantConfig } from '../types/config.ts';
import { RequestContext } from '../types/context.ts';
import { DataPorts } from '../data/index.ts';
import { businessArchetypes } from './archetypes.ts';

export interface ProvisionBusinessParams {
  businessTypeKey: string;
  name: string;
  slug: string;
  phone?: string;
  email?: string;
  currency: string;
  timezone: string;
  primaryColor: string;
  radius: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  ownerFullName: string;
  ownerEmail: string;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function provisionTenant(
  ctx: RequestContext,
  ports: DataPorts,
  params: ProvisionBusinessParams
): Promise<TenantConfig> {
  // Check slug uniqueness
  const existingWithSlug = await ports.tenants.getBySlug(params.slug);
  if (existingWithSlug) {
    throw new Error('This web address is already taken. Please pick another one.');
  }

  // Find archetype
  const archetype = businessArchetypes.find((a) => a.key === params.businessTypeKey);
  const baseTemplate = archetype?.template || businessArchetypes[3].template; // Fallback to blank

  const tenantId = `tenant-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const now = new Date().toISOString();

  // Invariant 2: Clone template and detach - template is never mutated or referenced directly again
  const clonedTemplate: TenantConfig = JSON.parse(JSON.stringify(baseTemplate));

  const newConfig: TenantConfig = {
    ...clonedTemplate,
    id: tenantId,
    slug: params.slug,
    name: params.name,
    businessTypeKey: params.businessTypeKey,
    status: 'active',
    schemaVersion: 1,
    profile: {
      ...clonedTemplate.profile,
      phone: params.phone || clonedTemplate.profile.phone,
      email: params.email || clonedTemplate.profile.email,
      timezone: params.timezone || clonedTemplate.profile.timezone,
      currency: params.currency || clonedTemplate.profile.currency,
      locale: params.currency === 'INR' ? 'en-IN' : 'en-US',
    },
    branding: {
      ...clonedTemplate.branding,
      primary: params.primaryColor || clonedTemplate.branding.primary,
      radius: params.radius || clonedTemplate.branding.radius,
      loginHeadline: `Welcome to ${params.name}`,
    },
    subscription: {
      ...clonedTemplate.subscription,
      startedAt: now,
      renewsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    },
  };

  // Save the tenant configuration
  await ports.tenants.save(ctx, newConfig);

  const tenantCtx: RequestContext = {
    ...ctx,
    tenantId: newConfig.id,
  };

  // Invariant 1: Record initial version snapshot
  await ports.snapshots.recordSnapshot(
    tenantCtx,
    `Initial workspace provisioned from ${archetype?.name || 'Custom'} template`,
    'workspace.create',
    newConfig
  );

  // Invariant 7: Create initial business owner user account
  const ownerUserId = `usr-${tenantId}-owner`;
  await ports.users.save(ctx, {
    id: ownerUserId,
    username: params.ownerEmail || `admin@${params.slug}.illusion.app`,
    tenantId,
    fullName: params.ownerFullName || `${params.name} Owner`,
    email: params.ownerEmail || params.email || `admin@${params.slug}.illusion.app`,
    role: 'business_admin',
    customRoleLabel: newConfig.roleLabels.business_admin || 'Business Owner',
    active: true,
  });

  // Audit event in tenant log
  await ports.audit.record(tenantCtx, {
    actorId: ctx.userId,
    actorName: 'Platform Administrator',
    action: 'create',
    entityKey: 'business_workspace',
    entityId: tenantId,
    diff: {
      changes: [
        `Created new business workspace "${newConfig.name}" (slug: ${newConfig.slug})`,
      ],
    },
  });

  return newConfig;
}
