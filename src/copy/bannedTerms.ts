/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Banned technical terms dictionary.
// Non-technical business owners must never see these words.
export const BANNED_TERMS = [
  'tenant',
  'entity',
  'schema',
  'widget',
  'endpoint',
  'api',
  'config',
  'boolean',
  'null',
  'crud',
  'slug',
  'regex',
  'pattern',
  'database',
] as const;

export const TERM_REPLACEMENTS: Record<string, string> = {
  tenant: 'your business',
  entity: 'list',
  schema: 'setup',
  widget: 'card',
  endpoint: 'link',
  api: 'connection',
  config: 'settings',
  boolean: 'yes/no choice',
  null: 'not set yet',
  crud: 'add, edit, and remove',
  slug: 'web address',
  regex: 'format',
  pattern: 'example format',
  database: 'storage',
};
