/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Globe,
  CheckCircle2,
  AlertCircle,
  Eye,
  RotateCcw,
  Sparkles,
  Layers,
  Save,
  Check,
  ChevronRight,
  HelpCircle,
  ArrowUpRight,
} from 'lucide-react';
import { TenantConfig, WebsiteContent, WebsiteSection } from '../../types/config.ts';
import { RequestContext } from '../../types/context.ts';
import { defaultPorts } from '../../data/index.ts';
import { websiteCopy } from '../../copy/website.ts';
import { can } from '../../utils/permissions.ts';

interface WebsiteManagerProps {
  config: TenantConfig;
  ctx: RequestContext;
  onConfigSaved: (updated: TenantConfig) => void;
  onOpenPreview: () => void;
}

export function WebsiteManager({
  config,
  ctx,
  onConfigSaved,
  onOpenPreview,
}: WebsiteManagerProps) {
  const [draft, setDraft] = useState<WebsiteContent>(() => {
    return JSON.parse(JSON.stringify(config.website.draft || {
      headline: config.name,
      tagline: 'Professional services for you and your family.',
      themeName: 'clean-slate',
      sections: [],
    }));
  });

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canEdit = can(ctx, 'tenant.edit_branding') || ctx.role === 'business_admin' || ctx.role === 'super_admin';

  // Toggle a section's visibility
  const handleToggleSection = (sectionId: string) => {
    setDraft((prev) => {
      const nextSections = prev.sections.map((s) => {
        if (s.id === sectionId) {
          return { ...s, enabled: !s.enabled };
        }
        return s;
      });
      return { ...prev, sections: nextSections };
    });
  };

  // Update section title/subtitle
  const handleUpdateSection = (sectionId: string, updates: Partial<WebsiteSection>) => {
    setDraft((prev) => {
      const nextSections = prev.sections.map((s) => {
        if (s.id === sectionId) {
          return { ...s, ...updates };
        }
        return s;
      });
      return { ...prev, sections: nextSections };
    });
  };

  // Save changes to Draft
  const handleSaveDraft = async () => {
    if (!canEdit) return;
    setSaving(true);
    setStatusMessage(null);

    try {
      // Invariant 13 & 3: Snapshot pre-save
      await defaultPorts.snapshots.recordSnapshot(
        ctx,
        'Saved website draft updates',
        'website_draft_update',
        config
      );

      const updatedConfig: TenantConfig = {
        ...config,
        website: {
          ...config.website,
          draft: JSON.parse(JSON.stringify(draft)),
        },
      };

      const saved = await defaultPorts.tenants.save(ctx, updatedConfig);
      onConfigSaved(saved);
      setStatusMessage({ type: 'success', text: 'Website draft saved successfully.' });
    } catch (err: unknown) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to save draft changes.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Publish Draft to Live
  const handlePublishLive = async () => {
    if (!canEdit) return;
    setPublishing(true);
    setStatusMessage(null);

    try {
      // Invariant 13 & 3: Snapshot pre-publish
      await defaultPorts.snapshots.recordSnapshot(
        ctx,
        'Published website to live internet',
        'website_publish',
        config
      );

      const updatedConfig: TenantConfig = {
        ...config,
        website: {
          draft: JSON.parse(JSON.stringify(draft)),
          published: JSON.parse(JSON.stringify(draft)),
        },
      };

      const saved = await defaultPorts.tenants.save(ctx, updatedConfig);
      onConfigSaved(saved);
      setStatusMessage({ type: 'success', text: websiteCopy.publishedSuccess });
    } catch (err: unknown) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to publish website.',
      });
    } finally {
      setPublishing(false);
    }
  };

  // Discard Draft Changes & Revert to Published
  const handleRevertToPublished = () => {
    if (config.website.published) {
      setDraft(JSON.parse(JSON.stringify(config.website.published)));
      setStatusMessage({ type: 'success', text: 'Draft reverted to match currently published live website.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-slate-900">{websiteCopy.tabTitle}</h2>
              {config.website.published ? (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{websiteCopy.badgeLive}</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{websiteCopy.badgeDraft}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
              {websiteCopy.tabSubtitle}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenPreview}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition flex items-center space-x-1.5"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span>{websiteCopy.openSite}</span>
          </button>

          {canEdit && (
            <>
              <button
                type="button"
                disabled={saving || publishing}
                onClick={handleSaveDraft}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 transition shadow-2xs flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-slate-600" />
                <span>{saving ? 'Saving...' : 'Save Draft'}</span>
              </button>

              <button
                type="button"
                disabled={saving || publishing}
                onClick={handlePublishLive}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 transition shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Globe className="w-4 h-4" />
                <span>{publishing ? websiteCopy.publishing : websiteCopy.publishSite}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Notification Toast/Bar */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center space-x-2.5 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Website Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Content & Sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Copy Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>Main Introduction & Titles</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {websiteCopy.headlineLabel}
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={draft.headline}
                onChange={(e) => setDraft({ ...draft, headline: e.target.value })}
                placeholder={websiteCopy.headlinePlaceholder}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {websiteCopy.taglineLabel}
              </label>
              <textarea
                rows={2}
                disabled={!canEdit}
                value={draft.tagline}
                onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
                placeholder={websiteCopy.taglinePlaceholder}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Sections List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-sky-600" />
                  <span>{websiteCopy.sectionsTitle}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {websiteCopy.sectionSubtitle}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {draft.sections.map((sec) => (
                <div
                  key={sec.id}
                  className={`p-4 rounded-xl border transition ${
                    sec.enabled
                      ? 'bg-slate-50/70 border-slate-200'
                      : 'bg-slate-100/60 border-dashed border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center space-x-2.5">
                      <input
                        type="checkbox"
                        id={`toggle-${sec.id}`}
                        disabled={!canEdit}
                        checked={sec.enabled}
                        onChange={() => handleToggleSection(sec.id)}
                        className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                      />
                      <label htmlFor={`toggle-${sec.id}`} className="text-xs font-bold text-slate-900 cursor-pointer">
                        {sec.type.toUpperCase()}: {sec.title}
                      </label>
                    </div>

                    <span className="text-[11px] font-medium text-slate-500 px-2 py-0.5 rounded-md bg-white border border-slate-200">
                      {sec.enabled ? 'Shown on Web' : 'Hidden'}
                    </span>
                  </div>

                  {sec.enabled && canEdit && (
                    <div className="space-y-2.5 pt-1 pl-6">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Section Display Heading
                        </label>
                        <input
                          type="text"
                          value={sec.title}
                          onChange={(e) => handleUpdateSection(sec.id, { title: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Section Description / Sub-heading
                        </label>
                        <input
                          type="text"
                          value={sec.subtitle || ''}
                          onChange={(e) => handleUpdateSection(sec.id, { subtitle: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Settings & Links */}
        <div className="space-y-6">
          {/* Public Link Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Live Customer Address</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              This link is open to patients, clients, and guests. Anyone with this address can view your services and book visits.
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-sky-700 truncate mr-2">
                /{config.slug}
              </span>
              <button
                type="button"
                onClick={onOpenPreview}
                className="text-xs text-slate-600 hover:text-slate-900 flex items-center space-x-1 shrink-0 font-medium"
              >
                <span>Visit</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {config.website.published && (
              <button
                type="button"
                onClick={handleRevertToPublished}
                className="w-full text-left text-xs text-slate-500 hover:text-slate-700 flex items-center space-x-1.5 pt-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{websiteCopy.revertToPublished}</span>
              </button>
            )}
          </div>

          {/* Help & Guidance */}
          <div className="bg-sky-50/60 rounded-2xl border border-sky-100 p-6 text-xs text-slate-700 space-y-3">
            <div className="flex items-center space-x-2 font-bold text-sky-900">
              <HelpCircle className="w-4 h-4 text-sky-600" />
              <span>How Publishing Works</span>
            </div>
            <p className="leading-relaxed text-slate-600">
              Draft changes remain saved locally until you click <strong>Publish to Live Web</strong>.
              Your public visitors will only see sections you have verified and published.
            </p>
            <p className="leading-relaxed text-slate-600">
              Every appointment request submitted by visitors automatically creates a new record inside your business workspace with all notes and phone numbers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
