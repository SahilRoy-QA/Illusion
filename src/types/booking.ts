/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Stage 15: Universal Business Core, Resource Booking, & Hotel/Guesthouse Vertical
 * Primitives for date-range bookable resources (rooms, tables, equipment, rentals)
 * and guest folios ("Guest Bills").
 */

export type ResourceStatus = 'available' | 'booked' | 'occupied' | 'cleaning' | 'maintenance';

export interface BookableResource {
  id: string;
  entityKey: string;        // which list this resource belongs to, e.g. "rooms", "tables", "equipment"
  label: string;             // e.g. "Room 101", "Table 4", "Power Rack A"
  capacity?: number;
  baseRate?: { amountMinor: number; currency: string };
  status: ResourceStatus;
  amenities?: string[];
  floorOrLocation?: string;
  notes?: string;
}

export type ReservationStatus = 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';

export interface ResourceReservation {
  id: string;
  tenantId: string;
  resourceId: string;
  resourceLabel: string;
  entityKey: string;
  guestOrCustomerId: string;
  guestName: string;
  guestPhone?: string;
  startDate: string;         // date-only (YYYY-MM-DD), not a timestamp — a stay is nights/days
  endDate: string;           // date-only (YYYY-MM-DD)
  status: ReservationStatus;
  ratePerNight?: { amountMinor: number; currency: string };
  advancePaid?: { amountMinor: number; currency: string };
  numberOfGuests?: number;
  specialRequests?: string;
  folioId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FolioLineItem {
  id: string;
  description: string;
  amountMinor: number;
  postedAt: string;
  source: 'room' | 'service' | 'other';
  referenceId?: string;
}

export interface Folio {
  id: string;
  tenantId: string;
  reservationId: string;
  resourceLabel: string;
  guestName: string;
  lineItems: FolioLineItem[];
  advancePaidMinor: number;
  status: 'open' | 'settled';
  settledAt?: string;
  paymentMethod?: string;
  taxRate?: number;
  taxAmountMinor?: number;
  subtotalMinor?: number;
  grandTotalMinor?: number;
  balanceDueMinor?: number;
  invoiceId?: string;
}

export interface DateRangeOverlapCheckResult {
  hasOverlap: boolean;
  conflictingReservation?: ResourceReservation;
  message?: string;
}

/**
 * Validates date range overlap between two date ranges [startA, endA] and [startB, endB].
 * In hospitality/rentals, checkout on date D frees the resource for check-in on date D.
 * Therefore, ranges overlap iff: startA < endB && endA > startB.
 */
export function checkDateRangeOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return startA < endB && endA > startB;
}

export interface ProfitAndLossReport {
  period: 'today' | '7d' | '30d' | 'ytd';
  currency: string;
  grossRevenueMinor: number;
  totalExpensesMinor: number;
  netProfitMinor: number;
  operatingMarginPercent: number;
  revenueBreakdown: { category: string; amountMinor: number }[];
  expenseBreakdown: { category: string; amountMinor: number }[];
}
