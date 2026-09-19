/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Format amounts cleanly in integer minor units (e.g. 1250 cents = $12.50)
export function formatMinorUnits(minorUnits: number, currency = 'INR', locale = 'en-IN'): string {
  const major = minorUnits / 100;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: minorUnits % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(major);
}

// Fixed rounding order:
// Line price -> line discount -> line tax -> invoice discount -> invoice tax -> total
export interface LineItemInput {
  unitPriceMinor: number;
  quantity: number;
  discountPercent?: number;
  taxPercent?: number;
  hsnOrSac?: string;
  description?: string;
}

export interface TaxBreakup {
  cgstMinor: number;
  sgstMinor: number;
  igstMinor: number;
  totalTaxMinor: number;
  isInterState: boolean;
  ratePercent: number;
}

export interface InvoiceCalculationResult {
  lines: {
    unitPriceMinor: number;
    quantity: number;
    lineBaseMinor: number;
    lineDiscountMinor: number;
    lineTaxMinor: number;
    lineTotalMinor: number;
    hsnOrSac?: string;
    description?: string;
  }[];
  subtotalMinor: number;
  totalDiscountMinor: number;
  totalTaxMinor: number;
  taxBreakup: TaxBreakup;
  grandTotalMinor: number;
}

export function calculateInvoice(
  lines: LineItemInput[],
  overallDiscountPercent = 0,
  isInterState = false
): InvoiceCalculationResult {
  let subtotalMinor = 0;
  let totalLineDiscountMinor = 0;
  let totalLineTaxMinor = 0;
  let maxTaxRate = 0;

  const calculatedLines = lines.map((line) => {
    const lineBaseMinor = Math.round(line.unitPriceMinor * line.quantity);
    const lineDiscountMinor = Math.round(lineBaseMinor * ((line.discountPercent || 0) / 100));
    const lineAfterDiscount = lineBaseMinor - lineDiscountMinor;
    const taxRate = line.taxPercent || 0;
    if (taxRate > maxTaxRate) maxTaxRate = taxRate;
    const lineTaxMinor = Math.round(lineAfterDiscount * (taxRate / 100));
    const lineTotalMinor = lineAfterDiscount + lineTaxMinor;

    subtotalMinor += lineBaseMinor;
    totalLineDiscountMinor += lineDiscountMinor;
    totalLineTaxMinor += lineTaxMinor;

    return {
      unitPriceMinor: line.unitPriceMinor,
      quantity: line.quantity,
      lineBaseMinor,
      lineDiscountMinor,
      lineTaxMinor,
      lineTotalMinor,
      hsnOrSac: line.hsnOrSac,
      description: line.description,
    };
  });

  const overallDiscountMinor = Math.round((subtotalMinor - totalLineDiscountMinor) * (overallDiscountPercent / 100));
  const grandTotalMinor = subtotalMinor - totalLineDiscountMinor - overallDiscountMinor + totalLineTaxMinor;

  // India GST Breakup logic:
  // Same state (Intra-state) -> Split 50% CGST + 50% SGST
  // Different state (Inter-state) -> 100% IGST
  const cgstMinor = isInterState ? 0 : Math.round(totalLineTaxMinor / 2);
  const sgstMinor = isInterState ? 0 : totalLineTaxMinor - cgstMinor;
  const igstMinor = isInterState ? totalLineTaxMinor : 0;

  const taxBreakup: TaxBreakup = {
    cgstMinor,
    sgstMinor,
    igstMinor,
    totalTaxMinor: totalLineTaxMinor,
    isInterState,
    ratePercent: maxTaxRate,
  };

  return {
    lines: calculatedLines,
    subtotalMinor,
    totalDiscountMinor: totalLineDiscountMinor + overallDiscountMinor,
    totalTaxMinor: totalLineTaxMinor,
    taxBreakup,
    grandTotalMinor: Math.max(0, grandTotalMinor),
  };
}

// Plain-language GST tax summary helper: "Tax: ₹X (GST)" with tap-to-reveal details
export function formatGstTaxLine(
  taxBreakup: TaxBreakup,
  currency = 'INR',
  locale = 'en-IN'
): { summary: string; detail: string } {
  const taxFormatted = formatMinorUnits(taxBreakup.totalTaxMinor, currency, locale);
  const summary = `Tax: ${taxFormatted} (GST)`;

  if (taxBreakup.totalTaxMinor === 0) {
    return { summary, detail: 'Exempt / 0% GST' };
  }

  if (taxBreakup.isInterState) {
    const igstFormatted = formatMinorUnits(taxBreakup.igstMinor, currency, locale);
    return {
      summary,
      detail: `IGST: ${igstFormatted} (${taxBreakup.ratePercent}% Integrated GST)`,
    };
  }

  const cgstFormatted = formatMinorUnits(taxBreakup.cgstMinor, currency, locale);
  const sgstFormatted = formatMinorUnits(taxBreakup.sgstMinor, currency, locale);
  const halfRate = (taxBreakup.ratePercent / 2).toFixed(1).replace(/\.0$/, '');

  return {
    summary,
    detail: `CGST (${halfRate}%): ${cgstFormatted} + SGST (${halfRate}%): ${sgstFormatted}`,
  };
}
