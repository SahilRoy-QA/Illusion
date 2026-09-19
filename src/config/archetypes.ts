/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TenantConfig } from '../types/config.ts';
import { clinicTemplate } from './templates/clinic.ts';
import { salonTemplate } from './templates/salon.ts';
import { retailTemplate } from './templates/retail.ts';
import { gymTemplate } from './templates/gym.ts';
import { restaurantTemplate } from './templates/restaurant.ts';
import { blankTemplate } from './templates/blank.ts';

export interface BusinessArchetype {
  key: string;
  name: string;
  tagline: string;
  description: string;
  defaultCurrency: string;
  primaryColor: string;
  template: TenantConfig;
}

export const businessArchetypes: BusinessArchetype[] = [
  {
    key: 'clinic',
    name: 'Doctor & Healthcare Clinic',
    tagline: 'Patients, appointments, visit records, and confidential notes',
    description: 'Designed for doctors, dentists, physiotherapists, and medical practices.',
    defaultCurrency: 'INR',
    primaryColor: '#0284c7',
    template: clinicTemplate,
  },
  {
    key: 'retail',
    name: 'Retail Store, Pharmacy & Goods',
    tagline: 'Products, inventory tracking, prices, and stock management',
    description: 'Perfect for boutique retailers, pharmacies, artisan studios, and general stores.',
    defaultCurrency: 'INR',
    primaryColor: '#d97706',
    template: retailTemplate,
  },
  {
    key: 'salon',
    name: 'Salon, Spa & Personal Care',
    tagline: 'Clients, beauty services, stylist schedules, and packages',
    description: 'Tailored for hair salons, nail studios, barbershops, and wellness spas.',
    defaultCurrency: 'INR',
    primaryColor: '#db2777',
    template: salonTemplate,
  },
  {
    key: 'gym',
    name: 'Gym & Fitness Studio',
    tagline: 'Members, class capacity, recurring plans, and PT coaching',
    description: 'Tailored for gyms, CrossFit boxes, yoga studios, and strength training centers.',
    defaultCurrency: 'INR',
    primaryColor: '#16a34a',
    template: gymTemplate,
  },
  {
    key: 'restaurant',
    name: 'Restaurant & Specialty Café',
    tagline: 'Dine-in tables, kitchen orders (KOT), reservations, and pantry stock',
    description: 'Designed for cafés, bistros, bakeries, and casual dining restaurants.',
    defaultCurrency: 'INR',
    primaryColor: '#ea580c',
    template: restaurantTemplate,
  },
  {
    key: 'blank',
    name: 'Custom / Other Business',
    tagline: 'Clean slate to customize your records, fields, and workflow',
    description: 'Start with a flexible foundation and create custom records from scratch.',
    defaultCurrency: 'INR',
    primaryColor: '#4f46e5',
    template: blankTemplate,
  },
];
