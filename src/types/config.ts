/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'currency'
  | 'email'
  | 'phone'
  | 'date'
  | 'datetime'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'file'
  | 'image'
  | 'reference'
  | 'autoId'
  | 'barcode';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  unique?: boolean;
  sensitive?: boolean;
  archived?: boolean;
  batchTracked?: boolean;
  hsnOrSac?: string;
  taxRate?: number;
  capacity?: number;
  options?: { value: string; label: string; color?: string }[];
  refEntity?: string;
  refDisplayField?: string;
  onDelete?: 'restrict' | 'setNull' | 'cascade';
  autoIdPattern?: string;
  defaultValue?: unknown;
  helpText?: string;
  validation?: {
    formatPreset?: 'any' | 'numbersOnly' | 'email' | 'phone' | 'lettersOnly';
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    message?: string;
  };
  showInList?: boolean;
  showInFilters?: boolean;
  order: number;
  width?: 'full' | 'half' | 'third';
}

export interface EntityDef {
  key: string;
  singular: string;
  plural: string;
  icon: string;
  system: boolean;
  batchTracked?: boolean;
  isBookable?: boolean; // Generic Primitive: Bookable Resources (rooms, tables, equipment, rentals)
  fields: FieldDef[];
  listColumns: string[];
  defaultSort: { field: string; dir: 'asc' | 'desc' };
  searchableFields: string[];
  permissionKey: string;
  emptyStateText: string;
}

export interface WorkflowStageDef {
  key: string;
  label: string;
  color: string;
}

export interface WorkflowBoardDef {
  id: string;
  title: string;
  entityKey: string;
  statusFieldKey: string;
  stages: WorkflowStageDef[];
  cardDisplayFields?: string[];
}

export interface AutomationRuleDef {
  id: string;
  name: string;
  description: string;
  trigger: 'status_change' | 'record_create' | 'low_stock' | 'expiry_approaching' | 'scheduled_daily';
  entityKey: string;
  condition?: {
    field: string;
    operator: 'eq' | 'neq' | 'lte' | 'gte' | 'days_before';
    value: unknown;
  };
  action: {
    type: 'sendMessageTemplate' | 'addLoyaltyPoints' | 'alertStaff' | 'updateStatus';
    templateKey?: string;
    pointsPerUnit?: number;
    targetStatus?: string;
    messageText?: string;
  };
  enabled: boolean;
}

export interface ReportDef {
  id: string;
  title: string;
  description: string;
  category: 'sales' | 'inventory' | 'operations' | 'tax';
  entityKey: string;
  metricKey: string;
  timeframeDefault: 'today' | '7d' | '30d' | 'year';
}

export interface RecurringPlan {
  id: string;
  name: string;
  sessionsIncluded?: number;
  validityDays?: number;
  validityMonths?: number;
  priceMinor: number;
  autoRenew: boolean;
}

export type FilterExpr = {
  field: string;
  operator: 'eq' | 'neq' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'in';
  value: unknown;
};

export interface WidgetInstance {
  id: string;
  type: 'metric' | 'chart' | 'list' | 'calendar' | 'activity';
  presetKey?: string;
  dataSource: {
    entity: string;
    aggregate?: 'count' | 'sum' | 'avg';
    field?: string;
    filter?: FilterExpr;
    range?: 'today' | '7d' | '30d' | 'mtd' | 'ytd';
  };
  title: string;
  span: 1 | 2 | 3 | 4;
  order: number;
  chartType?: 'line' | 'bar' | 'donut';
}

export interface BusinessHours {
  monday?: { open: string; close: string; closed?: boolean };
  tuesday?: { open: string; close: string; closed?: boolean };
  wednesday?: { open: string; close: string; closed?: boolean };
  thursday?: { open: string; close: string; closed?: boolean };
  friday?: { open: string; close: string; closed?: boolean };
  saturday?: { open: string; close: string; closed?: boolean };
  sunday?: { open: string; close: string; closed?: boolean };
}

export interface WebsiteSection {
  id: string;
  type: 'hero' | 'services' | 'about' | 'booking' | 'contact' | 'reviews';
  title: string;
  subtitle?: string;
  enabled: boolean;
  content: Record<string, unknown>;
}

export interface WebsiteContent {
  headline: string;
  tagline: string;
  themeName: string;
  sections: WebsiteSection[];
}

export interface TenantConfig {
  id: string;
  slug: string;
  name: string;
  businessTypeKey: string;
  status: 'trial' | 'active' | 'suspended';
  schemaVersion: number;
  profile: {
    logoUrl?: string;
    phone?: string;
    email?: string;
    address?: string;
    socials?: Record<string, string>;
    hours?: BusinessHours;
    timezone: string;
    locale: string;
    currency: string;
    taxRate?: number;
    gstin?: string;
    stateCode?: string;
    stateName?: string;
  };
  branding: {
    primary: string;
    secondary: string;
    accent: string;
    font: string;
    radius: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    buttonStyle: 'solid' | 'soft' | 'outline';
    mode: 'light' | 'dark' | 'system';
    loginHeadline?: string;
  };
  modules: Record<string, { enabled: boolean; settings?: Record<string, unknown> }>;
  entities: EntityDef[];
  roleLabels: Record<string, string>;
  dashboard: { widgets: WidgetInstance[] };
  website: { draft: WebsiteContent; published: WebsiteContent | null };
  workflows?: WorkflowBoardDef[];
  automations?: AutomationRuleDef[];
  reports?: ReportDef[];
  recurringPlans?: RecurringPlan[];
  subscription: {
    plan: string;
    status: string;
    startedAt: string;
    renewsAt: string;
    limits: { users: number; records: number; storageMb: number; modules: string[] };
    usage: { users: number; records: number; storageMb: number };
  };
}
