/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Standard searchable GST Tax Codes (HSN for goods, SAC for services)
 * Displayed in plain language as "Tax code (for GST)"
 */

export interface HsnSacCode {
  code: string;
  type: 'HSN' | 'SAC';
  label: string; // Plain language description
  category: 'healthcare' | 'pharma' | 'retail' | 'salon' | 'gym' | 'restaurant' | 'general';
  defaultTaxRate: number; // Percentage, e.g. 5, 12, 18
}

export const STANDARD_TAX_CODES: HsnSacCode[] = [
  // Healthcare / Clinic
  {
    code: '999312',
    type: 'SAC',
    label: 'Clinical & medical consultation services',
    category: 'healthcare',
    defaultTaxRate: 0,
  },
  {
    code: '999313',
    type: 'SAC',
    label: 'Physiotherapy & orthopedic rehabilitation',
    category: 'healthcare',
    defaultTaxRate: 5,
  },
  {
    code: '999319',
    type: 'SAC',
    label: 'Diagnostic, radiology & clinical lab tests',
    category: 'healthcare',
    defaultTaxRate: 0,
  },
  // Pharma / Medicines (Perishables)
  {
    code: '300490',
    type: 'HSN',
    label: 'Allopathic medicines, capsules & analgesics',
    category: 'pharma',
    defaultTaxRate: 12,
  },
  {
    code: '300410',
    type: 'HSN',
    label: 'Antibiotics & therapeutic oral formulations',
    category: 'pharma',
    defaultTaxRate: 12,
  },
  {
    code: '300510',
    type: 'HSN',
    label: 'Bandages, surgical dressings & orthopedic splints',
    category: 'pharma',
    defaultTaxRate: 12,
  },
  {
    code: '210690',
    type: 'HSN',
    label: 'Dietary supplements, vitamins & nutrition powders',
    category: 'pharma',
    defaultTaxRate: 18,
  },
  // Retail
  {
    code: '691110',
    type: 'HSN',
    label: 'Tableware, ceramic cups & kitchen decor goods',
    category: 'retail',
    defaultTaxRate: 18,
  },
  {
    code: '691390',
    type: 'HSN',
    label: 'Handmade pottery, statues & artisan ornamentals',
    category: 'retail',
    defaultTaxRate: 12,
  },
  {
    code: '442199',
    type: 'HSN',
    label: 'Wooden crafts, kitchenware & handcrafted trays',
    category: 'retail',
    defaultTaxRate: 12,
  },
  {
    code: '340600',
    type: 'HSN',
    label: 'Scented candles, aroma diffusers & home fragrances',
    category: 'retail',
    defaultTaxRate: 18,
  },
  // Salon / Personal Care
  {
    code: '999721',
    type: 'SAC',
    label: 'Hairdressing, cutting, coloring & styling services',
    category: 'salon',
    defaultTaxRate: 18,
  },
  {
    code: '999722',
    type: 'SAC',
    label: 'Facials, skin therapy, manicure & spa services',
    category: 'salon',
    defaultTaxRate: 18,
  },
  {
    code: '330510',
    type: 'HSN',
    label: 'Hair shampoos, conditioners & professional serums',
    category: 'salon',
    defaultTaxRate: 18,
  },
  {
    code: '330499',
    type: 'HSN',
    label: 'Skin care lotions, creams & cosmetic packs',
    category: 'salon',
    defaultTaxRate: 18,
  },
  // Gym / Fitness
  {
    code: '999291',
    type: 'SAC',
    label: 'Gym membership, strength training & studio access',
    category: 'gym',
    defaultTaxRate: 18,
  },
  {
    code: '999292',
    type: 'SAC',
    label: 'Personal training & 1-on-1 coaching sessions',
    category: 'gym',
    defaultTaxRate: 18,
  },
  {
    code: '999293',
    type: 'SAC',
    label: 'Group fitness classes (Yoga, HIIT, Zumba, Pilates)',
    category: 'gym',
    defaultTaxRate: 18,
  },
  // Restaurant / Food
  {
    code: '996331',
    type: 'SAC',
    label: 'Restaurant dining, café service & takeaway meals',
    category: 'restaurant',
    defaultTaxRate: 5,
  },
  {
    code: '996332',
    type: 'SAC',
    label: 'Outdoor catering & event food service',
    category: 'restaurant',
    defaultTaxRate: 18,
  },
  {
    code: '210500',
    type: 'HSN',
    label: 'Ice creams, desserts & packaged sweets',
    category: 'restaurant',
    defaultTaxRate: 18,
  },
  // General / Professional
  {
    code: '998314',
    type: 'SAC',
    label: 'Professional consulting & management services',
    category: 'general',
    defaultTaxRate: 18,
  },
  {
    code: '998719',
    type: 'SAC',
    label: 'Maintenance, repair & installation services',
    category: 'general',
    defaultTaxRate: 18,
  },
];

export function findTaxCode(codeOrQuery: string): HsnSacCode | undefined {
  if (!codeOrQuery) return undefined;
  const q = codeOrQuery.toLowerCase().trim();
  return STANDARD_TAX_CODES.find(
    (c) => c.code.toLowerCase() === q || c.label.toLowerCase().includes(q)
  );
}

export function searchTaxCodes(query: string, category?: string): HsnSacCode[] {
  const q = query.toLowerCase().trim();
  return STANDARD_TAX_CODES.filter((item) => {
    const matchesCat = !category || category === 'all' || item.category === category;
    if (!matchesCat) return false;
    if (!q) return true;
    return item.code.includes(q) || item.label.toLowerCase().includes(q);
  });
}
