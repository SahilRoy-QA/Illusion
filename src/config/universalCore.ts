/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Stage 15: Universal Business Core & Profit & Loss
 * Universal entities applicable to every single business vertical:
 * Contacts, Expenses, Tasks, Notes, and Documents.
 */

import { EntityDef, TenantConfig } from '../types/config.ts';
import { DynamicRecord } from '../types/records.ts';
import { ProfitAndLossReport } from '../types/booking.ts';

export const universalContactsEntity: EntityDef = {
  key: 'contacts',
  singular: 'Contact',
  plural: 'Contacts',
  icon: 'Contact',
  system: false,
  permissionKey: 'records.contacts',
  emptyStateText: 'No contacts added yet. Keep all clients, guests, patients, and suppliers in one place.',
  listColumns: ['name', 'type', 'phone', 'email', 'city'],
  defaultSort: { field: 'name', dir: 'asc' },
  searchableFields: ['name', 'phone', 'email', 'city', 'type'],
  fields: [
    {
      key: 'name',
      label: 'Full Name',
      type: 'text',
      required: true,
      showInList: true,
      order: 1,
      width: 'half',
    },
    {
      key: 'type',
      label: 'Contact Category',
      type: 'select',
      required: true,
      showInList: true,
      order: 2,
      width: 'half',
      options: [
        { value: 'customer', label: 'Customer / Client' },
        { value: 'guest', label: 'Guest' },
        { value: 'patient', label: 'Patient' },
        { value: 'supplier', label: 'Supplier / Vendor' },
        { value: 'partner', label: 'Business Partner' },
        { value: 'other', label: 'Other' },
      ],
    },
    {
      key: 'phone',
      label: 'Phone Number',
      type: 'phone',
      required: false,
      showInList: true,
      order: 3,
      width: 'half',
    },
    {
      key: 'email',
      label: 'Email Address',
      type: 'email',
      required: false,
      showInList: true,
      order: 4,
      width: 'half',
    },
    {
      key: 'city',
      label: 'City / Location',
      type: 'text',
      required: false,
      showInList: true,
      order: 5,
      width: 'half',
    },
    {
      key: 'address',
      label: 'Full Address',
      type: 'textarea',
      required: false,
      showInList: false,
      order: 6,
      width: 'full',
    },
    {
      key: 'notes',
      label: 'Important Notes',
      type: 'textarea',
      required: false,
      showInList: false,
      order: 7,
      width: 'full',
    },
  ],
};

export const universalExpensesEntity: EntityDef = {
  key: 'expenses',
  singular: 'Expense',
  plural: 'Expenses',
  icon: 'DollarSign',
  system: false,
  permissionKey: 'records.expenses',
  emptyStateText: 'No expenses recorded yet. Track operations, rent, supplies, and staff payouts.',
  listColumns: ['title', 'category', 'amountMinor', 'expenseDate', 'paidTo'],
  defaultSort: { field: 'expenseDate', dir: 'desc' },
  searchableFields: ['title', 'category', 'paidTo', 'notes'],
  fields: [
    {
      key: 'title',
      label: 'Expense Description',
      type: 'text',
      required: true,
      showInList: true,
      order: 1,
      width: 'half',
    },
    {
      key: 'category',
      label: 'Expense Category',
      type: 'select',
      required: true,
      showInList: true,
      order: 2,
      width: 'half',
      options: [
        { value: 'rent', label: 'Property Rent / Lease' },
        { value: 'salaries', label: 'Staff Salaries & Wages' },
        { value: 'utilities', label: 'Electricity, Water & Internet' },
        { value: 'supplies', label: 'Operating Supplies & Inventory' },
        { value: 'maintenance', label: 'Repairs & Maintenance' },
        { value: 'marketing', label: 'Advertising & Marketing' },
        { value: 'other', label: 'Other Operating Expenses' },
      ],
    },
    {
      key: 'amountMinor',
      label: 'Amount Paid',
      type: 'currency',
      required: true,
      showInList: true,
      order: 3,
      width: 'half',
    },
    {
      key: 'expenseDate',
      label: 'Date of Expense',
      type: 'date',
      required: true,
      showInList: true,
      order: 4,
      width: 'half',
    },
    {
      key: 'paidTo',
      label: 'Paid To (Vendor / Person)',
      type: 'text',
      required: false,
      showInList: true,
      order: 5,
      width: 'half',
    },
    {
      key: 'paymentMode',
      label: 'Payment Mode',
      type: 'select',
      required: false,
      showInList: false,
      order: 6,
      width: 'half',
      options: [
        { value: 'bank_transfer', label: 'Bank Transfer / NEFT / IMPS' },
        { value: 'upi', label: 'UPI / QR' },
        { value: 'cheque', label: 'Cheque' },
        { value: 'cash', label: 'Cash' },
        { value: 'card', label: 'Corporate Card' },
      ],
    },
    {
      key: 'notes',
      label: 'Invoice / Receipt Notes',
      type: 'textarea',
      required: false,
      showInList: false,
      order: 7,
      width: 'full',
    },
  ],
};

export const universalTasksEntity: EntityDef = {
  key: 'tasks',
  singular: 'Task',
  plural: 'Tasks',
  icon: 'CheckSquare',
  system: false,
  permissionKey: 'records.tasks',
  emptyStateText: 'No operational tasks pending. Keep your team in sync.',
  listColumns: ['title', 'status', 'assignedTo', 'dueDate'],
  defaultSort: { field: 'dueDate', dir: 'asc' },
  searchableFields: ['title', 'assignedTo'],
  fields: [
    {
      key: 'title',
      label: 'Task Title',
      type: 'text',
      required: true,
      showInList: true,
      order: 1,
      width: 'full',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      showInList: true,
      order: 2,
      width: 'half',
      options: [
        { value: 'to_do', label: 'To Do' },
        { value: 'doing', label: 'In Progress' },
        { value: 'done', label: 'Completed' },
      ],
    },
    {
      key: 'assignedTo',
      label: 'Assigned To',
      type: 'text',
      required: false,
      showInList: true,
      order: 3,
      width: 'half',
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      type: 'date',
      required: false,
      showInList: true,
      order: 4,
      width: 'half',
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      required: false,
      showInList: false,
      order: 5,
      width: 'half',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Normal' },
        { value: 'high', label: 'Urgent' },
      ],
    },
    {
      key: 'notes',
      label: 'Instructions / Checklist',
      type: 'textarea',
      required: false,
      showInList: false,
      order: 6,
      width: 'full',
    },
  ],
};

export const universalNotesEntity: EntityDef = {
  key: 'notes',
  singular: 'Activity Note',
  plural: 'Notes & Logs',
  icon: 'FileText',
  system: false,
  permissionKey: 'records.notes',
  emptyStateText: 'No activity notes logged yet.',
  listColumns: ['subject', 'linkedRecord', 'authorName', 'createdAt'],
  defaultSort: { field: 'createdAt', dir: 'desc' },
  searchableFields: ['subject', 'noteText', 'authorName'],
  fields: [
    {
      key: 'subject',
      label: 'Note Summary',
      type: 'text',
      required: true,
      showInList: true,
      order: 1,
      width: 'half',
    },
    {
      key: 'linkedRecord',
      label: 'Linked To Record',
      type: 'text',
      required: false,
      showInList: true,
      order: 2,
      width: 'half',
    },
    {
      key: 'noteText',
      label: 'Note Content',
      type: 'textarea',
      required: true,
      showInList: false,
      order: 3,
      width: 'full',
    },
    {
      key: 'authorName',
      label: 'Author',
      type: 'text',
      required: false,
      showInList: true,
      order: 4,
      width: 'half',
    },
  ],
};

export const universalDocumentsEntity: EntityDef = {
  key: 'documents',
  singular: 'Document',
  plural: 'Documents',
  icon: 'Paperclip',
  system: false,
  permissionKey: 'records.documents',
  emptyStateText: 'No documents uploaded yet. Store leases, licenses, and contracts safely.',
  listColumns: ['name', 'category', 'uploadedDate', 'fileUrl'],
  defaultSort: { field: 'uploadedDate', dir: 'desc' },
  searchableFields: ['name', 'category'],
  fields: [
    {
      key: 'name',
      label: 'Document Name',
      type: 'text',
      required: true,
      showInList: true,
      order: 1,
      width: 'half',
    },
    {
      key: 'category',
      label: 'Category',
      type: 'select',
      required: true,
      showInList: true,
      order: 2,
      width: 'half',
      options: [
        { value: 'licenses', label: 'Licenses & Registrations' },
        { value: 'tax_gst', label: 'GST & Tax Returns' },
        { value: 'contracts', label: 'Vendor & Lease Contracts' },
        { value: 'compliance', label: 'Health & Safety Compliance' },
        { value: 'other', label: 'Other Files' },
      ],
    },
    {
      key: 'fileUrl',
      label: 'File / Document Link',
      type: 'text',
      required: true,
      showInList: true,
      order: 3,
      width: 'half',
    },
    {
      key: 'uploadedDate',
      label: 'Date Uploaded',
      type: 'date',
      required: true,
      showInList: true,
      order: 4,
      width: 'half',
    },
    {
      key: 'notes',
      label: 'Notes & Expiry Details',
      type: 'textarea',
      required: false,
      showInList: false,
      order: 5,
      width: 'full',
    },
  ],
};

export const universalCoreEntities: EntityDef[] = [
  universalContactsEntity,
  universalExpensesEntity,
  universalTasksEntity,
  universalNotesEntity,
  universalDocumentsEntity,
];

/**
 * Ensures any TenantConfig includes the Universal Core entities (Expenses, Tasks, etc.)
 * if they are not already defined by the tenant's vertical template.
 */
export function ensureUniversalCoreEntities(config: TenantConfig): TenantConfig {
  const existingKeys = new Set(config.entities.map((e) => e.key));
  const missingCore = universalCoreEntities.filter((core) => !existingKeys.has(core.key));

  if (missingCore.length === 0) {
    return config;
  }

  return {
    ...config,
    entities: [...config.entities, ...missingCore],
  };
}

/**
 * Calculates a genuine Profit & Loss report:
 * Revenue (from invoices/orders/sales/folios) minus Expenses (from expenses list).
 */
export function calculateProfitAndLoss(
  allRecords: DynamicRecord[],
  currency: string = 'INR',
  period: 'today' | '7d' | '30d' | 'ytd' = '30d'
): ProfitAndLossReport {
  const now = new Date();
  let filterDateCutoff: Date;

  if (period === 'today') {
    filterDateCutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === '7d') {
    filterDateCutoff = new Date(now.getTime() - 7 * 86400000);
  } else if (period === '30d') {
    filterDateCutoff = new Date(now.getTime() - 30 * 86400000);
  } else {
    // YTD: January 1 of current year
    filterDateCutoff = new Date(now.getFullYear(), 0, 1);
  }

  const isRecordInPeriod = (rec: DynamicRecord): boolean => {
    const dStr =
      (rec.data.expenseDate as string) ||
      (rec.data.invoiceDate as string) ||
      (rec.data.orderDate as string) ||
      rec.createdAt;
    if (!dStr) return true;
    const d = new Date(dStr);
    return isNaN(d.getTime()) || d >= filterDateCutoff;
  };

  // 1. Calculate Expenses
  const expenseRecords = allRecords.filter(
    (r) => !r.deletedAt && r.entityKey === 'expenses' && isRecordInPeriod(r)
  );

  let totalExpensesMinor = 0;
  const expenseCategoryMap: Record<string, number> = {};

  for (const exp of expenseRecords) {
    const rawAmt = Number(exp.data.amountMinor || exp.data.amount || 0);
    const cat = String(exp.data.category || 'General Operating');
    totalExpensesMinor += rawAmt;
    expenseCategoryMap[cat] = (expenseCategoryMap[cat] || 0) + rawAmt;
  }

  // 2. Calculate Revenue
  // Invoices, bills, orders, memberships, room reservations, etc.
  const revenueEntities = ['invoices', 'folios', 'orders', 'sales', 'billing', 'appointments'];
  const revenueRecords = allRecords.filter(
    (r) => !r.deletedAt && revenueEntities.includes(r.entityKey) && isRecordInPeriod(r)
  );

  let grossRevenueMinor = 0;
  const revenueCategoryMap: Record<string, number> = {};

  for (const rev of revenueRecords) {
    // If invoice/folio, use netPaidMinor, totalDueMinor, totalAmountMinor, amountMinor, or grandTotal
    let amt = Number(
      rev.data.netPaidMinor ??
      rev.data.totalAmountMinor ??
      rev.data.grandTotalMinor ??
      rev.data.totalDueMinor ??
      rev.data.amountMinor ??
      rev.data.priceMinor ??
      0
    );

    // If unit stored in rupees instead of minor units (rare), ensure integer minor units
    if (amt > 0) {
      grossRevenueMinor += amt;
      const cat = rev.entityKey.charAt(0).toUpperCase() + rev.entityKey.slice(1);
      revenueCategoryMap[cat] = (revenueCategoryMap[cat] || 0) + amt;
    }
  }

  // If no revenue records logged yet, provide a baseline if demo records have pricing
  if (grossRevenueMinor === 0) {
    // Check for inventory sales or reservations
    const otherEarners = allRecords.filter(
      (r) => !r.deletedAt && (r.entityKey === 'reservations' || r.entityKey === 'inventory')
    );
    for (const earner of otherEarners) {
      if (earner.data.advancePaidMinor) {
        const adv = Number(earner.data.advancePaidMinor);
        grossRevenueMinor += adv;
        revenueCategoryMap['Advance Deposits'] = (revenueCategoryMap['Advance Deposits'] || 0) + adv;
      }
    }
  }

  const netProfitMinor = grossRevenueMinor - totalExpensesMinor;
  const operatingMarginPercent =
    grossRevenueMinor > 0 ? Math.round((netProfitMinor / grossRevenueMinor) * 100) : 0;

  const revenueBreakdown = Object.entries(revenueCategoryMap).map(([category, amountMinor]) => ({
    category,
    amountMinor,
  }));

  const expenseBreakdown = Object.entries(expenseCategoryMap).map(([category, amountMinor]) => ({
    category,
    amountMinor,
  }));

  return {
    period,
    currency,
    grossRevenueMinor,
    totalExpensesMinor,
    netProfitMinor,
    operatingMarginPercent,
    revenueBreakdown,
    expenseBreakdown,
  };
}
