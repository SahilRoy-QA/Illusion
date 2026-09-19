/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BANNED_TERMS, TERM_REPLACEMENTS } from '../copy/bannedTerms.ts';
import { TenantConfig } from '../types/config.ts';

export interface JargonMatch {
  id: string;
  term: string;
  replacement: string;
  location: string;
  fieldPath: string;
  originalText: string;
  suggestedText: string;
}

export interface TenantJargonReport {
  tenantId: string;
  tenantName: string;
  totalViolations: number;
  matches: JargonMatch[];
  scannedAt: string;
}

/**
 * Scan arbitrary string for banned technical terms
 */
export function scanText(text: string, location = 'Custom Text', fieldPath = ''): JargonMatch[] {
  if (!text || typeof text !== 'string') return [];

  const matches: JargonMatch[] = [];

  for (const term of BANNED_TERMS) {
    // Regex matching whole words case-insensitively
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const replacement = TERM_REPLACEMENTS[term.toLowerCase()] || 'plain language';
      
      // Calculate suggested replacement text preserving casing
      const matchedWord = match[0];
      let formattedReplacement = replacement;
      if (matchedWord[0] === matchedWord[0].toUpperCase() && matchedWord.slice(1) === matchedWord.slice(1).toLowerCase()) {
        // Title case
        formattedReplacement = replacement.charAt(0).toUpperCase() + replacement.slice(1);
      } else if (matchedWord === matchedWord.toUpperCase()) {
        // Upper case
        formattedReplacement = replacement.toUpperCase();
      }

      const suggestedText = text.replace(new RegExp(`\\b${matchedWord}\\b`, 'g'), formattedReplacement);

      matches.push({
        id: `${term}-${match.index}-${Math.random().toString(36).slice(2, 7)}`,
        term: matchedWord,
        replacement: formattedReplacement,
        location,
        fieldPath,
        originalText: text,
        suggestedText,
      });
    }
  }

  return matches;
}

/**
 * Replace all banned technical terms in a string with friendly plain-language alternatives
 */
export function remediateText(text: string): string {
  if (!text || typeof text !== 'string') return text;

  let result = text;
  for (const term of BANNED_TERMS) {
    const replacement = TERM_REPLACEMENTS[term.toLowerCase()] || 'friendly term';
    const regex = new RegExp(`\\b${term}\\b`, 'gi');

    result = result.replace(regex, (match) => {
      if (match[0] === match[0].toUpperCase() && match.slice(1) === match.slice(1).toLowerCase()) {
        return replacement.charAt(0).toUpperCase() + replacement.slice(1);
      }
      if (match === match.toUpperCase()) {
        return replacement.toUpperCase();
      }
      return replacement;
    });
  }

  return result;
}

/**
 * Scans an entire TenantConfig for any leaked or user-entered technical jargon
 */
export function scanTenantConfig(config: TenantConfig): TenantJargonReport {
  const matches: JargonMatch[] = [];

  // 1. Business Name & Branding
  matches.push(...scanText(config.name, 'Business Name', 'name'));
  if (config.branding?.loginHeadline) {
    matches.push(...scanText(config.branding.loginHeadline, 'Login Headline', 'branding.loginHeadline'));
  }

  // 2. Custom Role Labels
  for (const [roleKey, label] of Object.entries(config.roleLabels || {})) {
    matches.push(...scanText(label, `Custom Role Name (${roleKey})`, `roleLabels.${roleKey}`));
  }

  // 3. Dynamic Entities & Record Design
  for (let eIdx = 0; eIdx < config.entities.length; eIdx++) {
    const entity = config.entities[eIdx];
    matches.push(...scanText(entity.singular, `List Name Singular (${entity.singular})`, `entities[${eIdx}].singular`));
    matches.push(...scanText(entity.plural, `List Name Plural (${entity.plural})`, `entities[${eIdx}].plural`));
    if (entity.emptyStateText) {
      matches.push(...scanText(entity.emptyStateText, `Empty State (${entity.singular})`, `entities[${eIdx}].emptyStateText`));
    }

    for (let fIdx = 0; fIdx < entity.fields.length; fIdx++) {
      const field = entity.fields[fIdx];
      matches.push(...scanText(field.label, `Field Label (${entity.singular} > ${field.label})`, `entities[${eIdx}].fields[${fIdx}].label`));
      if (field.helpText) {
        matches.push(...scanText(field.helpText, `Field Help Text (${entity.singular} > ${field.label})`, `entities[${eIdx}].fields[${fIdx}].helpText`));
      }
      if (field.options) {
        for (let oIdx = 0; oIdx < field.options.length; oIdx++) {
          matches.push(...scanText(field.options[oIdx].label, `Dropdown Option Label (${entity.singular} > ${field.label})`, `entities[${eIdx}].fields[${fIdx}].options[${oIdx}].label`));
        }
      }
    }
  }

  // 4. Public Website Settings
  if (config.website?.draft) {
    matches.push(...scanText(config.website.draft.headline, 'Website Headline', 'website.draft.headline'));
    matches.push(...scanText(config.website.draft.tagline, 'Website Tagline', 'website.draft.tagline'));

    for (let sIdx = 0; sIdx < config.website.draft.sections.length; sIdx++) {
      const sec = config.website.draft.sections[sIdx];
      matches.push(...scanText(sec.title, `Website Section Title (${sec.type})`, `website.draft.sections[${sIdx}].title`));
      if (sec.subtitle) {
        matches.push(...scanText(sec.subtitle, `Website Section Subtitle (${sec.type})`, `website.draft.sections[${sIdx}].subtitle`));
      }
    }
  }

  return {
    tenantId: config.id,
    tenantName: config.name,
    totalViolations: matches.length,
    matches,
    scannedAt: new Date().toISOString(),
  };
}

/**
 * Automatically cleans all banned terms across a TenantConfig
 */
export function remediateTenantConfig(config: TenantConfig): {
  remediated: TenantConfig;
  changesCount: number;
  remediatedFields: string[];
} {
  const cloned: TenantConfig = JSON.parse(JSON.stringify(config));
  const remediatedFields: string[] = [];
  let changesCount = 0;

  const clean = (val: string, label: string): string => {
    const fixed = remediateText(val);
    if (fixed !== val) {
      changesCount++;
      remediatedFields.push(label);
      return fixed;
    }
    return val;
  };

  cloned.name = clean(cloned.name, 'Business Name');
  if (cloned.branding?.loginHeadline) {
    cloned.branding.loginHeadline = clean(cloned.branding.loginHeadline, 'Login Headline');
  }

  if (cloned.roleLabels) {
    for (const [k, v] of Object.entries(cloned.roleLabels)) {
      cloned.roleLabels[k] = clean(v, `Role Label (${k})`);
    }
  }

  for (const entity of cloned.entities) {
    entity.singular = clean(entity.singular, `List Name Singular (${entity.singular})`);
    entity.plural = clean(entity.plural, `List Name Plural (${entity.plural})`);
    if (entity.emptyStateText) {
      entity.emptyStateText = clean(entity.emptyStateText, `Empty State (${entity.singular})`);
    }

    for (const field of entity.fields) {
      field.label = clean(field.label, `Field Label (${field.label})`);
      if (field.helpText) {
        field.helpText = clean(field.helpText, `Field Help Text (${field.label})`);
      }
      if (field.options) {
        field.options = field.options.map((opt, i) => ({
          ...opt,
          label: clean(opt.label, `Dropdown Option #${i + 1} (${opt.label})`),
        }));
      }
    }
  }

  if (cloned.website?.draft) {
    cloned.website.draft.headline = clean(cloned.website.draft.headline, 'Website Headline');
    cloned.website.draft.tagline = clean(cloned.website.draft.tagline, 'Website Tagline');

    for (const sec of cloned.website.draft.sections) {
      sec.title = clean(sec.title, `Website Section Title (${sec.type})`);
      if (sec.subtitle) {
        sec.subtitle = clean(sec.subtitle, `Website Section Subtitle (${sec.type})`);
      }
    }
  }

  return {
    remediated: cloned,
    changesCount,
    remediatedFields,
  };
}
