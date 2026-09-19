/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Inventory, Batch & Expiry tracking utilities
 */

export interface ExpiryStatus {
  status: 'expired' | 'expiring_soon' | 'fresh';
  label: string;
  daysRemaining: number;
  badgeClass: string;
}

/**
 * Evaluates expiry status for perishable items (medicines, cosmetics, food)
 */
export function getExpiryStatus(expiryDateStr?: string, referenceDate: Date = new Date()): ExpiryStatus {
  if (!expiryDateStr) {
    return {
      status: 'fresh',
      label: 'No expiry date set',
      daysRemaining: 9999,
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    };
  }

  const expiry = new Date(expiryDateStr);
  if (isNaN(expiry.getTime())) {
    return {
      status: 'fresh',
      label: expiryDateStr,
      daysRemaining: 9999,
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    };
  }

  const diffTime = expiry.getTime() - referenceDate.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return {
      status: 'expired',
      label: `Expired (${Math.abs(daysRemaining)}d ago)`,
      daysRemaining,
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 font-medium',
    };
  }

  if (daysRemaining <= 30) {
    return {
      status: 'expiring_soon',
      label: `Expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`,
      daysRemaining,
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 font-medium',
    };
  }

  // Fresh
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formatted = `${monthNames[expiry.getMonth()]} ${expiry.getFullYear()}`;

  return {
    status: 'fresh',
    label: `Good through ${formatted}`,
    daysRemaining,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
}

export function isBatchTrackedEntity(entityKey: string): boolean {
  const trackedEntities = [
    'pharmacy_stock',
    'stock_batches',
    'salon_stock',
    'ingredient_stock',
    'products',
    'inventory',
  ];
  return trackedEntities.includes(entityKey);
}
