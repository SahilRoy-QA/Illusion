/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PermissionDefinition {
  key: string;
  category: 'records' | 'billing' | 'team' | 'settings';
  categoryLabel: string;
  sentence: string;
  description: string;
  sensitive?: boolean;
}

export const plainPermissions: PermissionDefinition[] = [
  {
    key: 'records.view',
    category: 'records',
    categoryLabel: 'Customer & Patient Records',
    sentence: 'Can see lists and contact details',
    description: 'Allows team members to look up customers, patients, and their contact information.',
  },
  {
    key: 'records.create',
    category: 'records',
    categoryLabel: 'Customer & Patient Records',
    sentence: 'Can add new people and records',
    description: 'Allows staff to register new customers or patients in the system.',
  },
  {
    key: 'records.edit',
    category: 'records',
    categoryLabel: 'Customer & Patient Records',
    sentence: 'Can update records and notes',
    description: 'Allows editing contact numbers, preferences, and visit notes.',
  },
  {
    key: 'records.remove',
    category: 'records',
    categoryLabel: 'Customer & Patient Records',
    sentence: 'Can remove old or duplicate entries',
    description: 'Allows removing records when they are no longer needed.',
  },
  {
    key: 'records.export_sensitive',
    category: 'records',
    categoryLabel: 'Customer & Patient Records',
    sentence: 'Can download records (includes confidential notes and medical history)',
    description: 'High-privilege permission. Keeps private medical and personal notes secure from general staff.',
    sensitive: true,
  },
  {
    key: 'billing.create',
    category: 'billing',
    categoryLabel: 'Bills & Payments',
    sentence: 'Can create bills and collect payments',
    description: 'Allows front desk and sales staff to issue receipts and register payments.',
  },
  {
    key: 'billing.refund',
    category: 'billing',
    categoryLabel: 'Bills & Payments',
    sentence: 'Can issue refunds or cancel payments',
    description: 'Allows reversing payments or cancelling unpaid invoices.',
  },
  {
    key: 'team.invite',
    category: 'team',
    categoryLabel: 'Team Members',
    sentence: 'Can add team members and assign duties',
    description: 'Allows inviting new doctors, stylists, or assistants to the business.',
  },
  {
    key: 'settings.change',
    category: 'settings',
    categoryLabel: 'Business Settings',
    sentence: 'Can change opening hours, address, and website look',
    description: 'Allows editing the business profile, colors, and public website.',
  },
];

export const rolesCopy = {
  title: 'Team Roles & Permissions',
  subtitle: 'Choose what each person on your team is allowed to see and do.',
  roleNameLabel: 'What do you call this role in your business?',
  roleNameHelp: 'Example: "Lead Doctor", "Front Desk", "Senior Stylist", or "Sales Staff".',
  saveRoleChanges: 'Save Role Settings',
  adminRoleNotice: 'Business owners always have full access to all features and records.',
  staffRoleNotice: 'You can customise what staff members can do using the switches below.',
} as const;
