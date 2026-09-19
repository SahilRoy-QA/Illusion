/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TenantConfig } from '../../types/config.ts';

export const blankTemplate: TenantConfig = {
  id: 'template-blank',
  slug: 'new-workspace',
  name: 'New Custom Business',
  businessTypeKey: 'blank',
  status: 'active',
  schemaVersion: 1,
  profile: {
    timezone: 'Asia/Kolkata',
    locale: 'en-IN',
    currency: 'INR',
    taxRate: 0,
  },
  branding: {
    primary: '#4f46e5', // Indigo
    secondary: '#0f172a',
    accent: '#818cf8',
    font: 'sans-serif',
    radius: 'md',
    buttonStyle: 'solid',
    mode: 'light',
    loginHeadline: 'Welcome to your business workspace',
  },
  modules: {
    records: { enabled: true },
    billing: { enabled: true },
  },
  roleLabels: {
    business_admin: 'Business Owner',
    staff: 'Team Member',
  },
  entities: [
    {
      key: 'items',
      singular: 'Item',
      plural: 'Items',
      icon: 'Folder',
      system: true,
      permissionKey: 'records.items',
      emptyStateText: 'No items created yet. Add your first item to start tracking entries.',
      searchableFields: ['name'],
      defaultSort: { field: 'createdAt', dir: 'desc' },
      listColumns: ['name', 'notes'],
      fields: [
        {
          key: 'name',
          label: 'Name',
          type: 'text',
          required: true,
          order: 1,
          showInList: true,
          width: 'full',
        },
        {
          key: 'notes',
          label: 'Notes',
          type: 'textarea',
          order: 2,
          showInList: true,
          width: 'full',
        },
      ],
    },
  ],
  dashboard: {
    widgets: [
      {
        id: 'w-blank-1',
        type: 'metric',
        title: 'Total Entries',
        dataSource: { entity: 'items', aggregate: 'count' },
        span: 1,
        order: 1,
      },
    ],
  },
  website: {
    draft: {
      headline: 'Welcome to our business',
      tagline: 'Quality services and solutions.',
      themeName: 'clean-slate',
      sections: [],
    },
    published: null,
  },
  subscription: {
    plan: 'starter',
    status: 'trial',
    startedAt: '2026-01-01T00:00:00.000Z',
    renewsAt: '2026-02-01T00:00:00.000Z',
    limits: {
      users: 5,
      records: 2000,
      storageMb: 500,
      modules: ['records', 'billing'],
    },
    usage: {
      users: 1,
      records: 0,
      storageMb: 10,
    },
  },
};
