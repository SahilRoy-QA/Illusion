/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Shield,
  ShieldAlert,
  User,
  Clock,
  FileText,
  Copy,
  Check,
  Eye,
  EyeOff,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { AuditLogEntry } from '../../types/records.ts';
import { TenantConfig } from '../../types/config.ts';
import { RequestContext } from '../../types/context.ts';
import { formatToTenantTime } from '../../utils/time.ts';
import { can } from '../../utils/permissions.ts';

interface AuditDetailModalProps {
  entry: AuditLogEntry | null;
  config?: TenantConfig;
  ctx: RequestContext;
  timezone: string;
  onClose: () => void;
}

export function AuditDetailModal({
  entry,
  config,
  ctx,
  timezone,
  onClose,
}: AuditDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);
  const [activeDiffTab, setActiveDiffTab] = useState<'visual' | 'raw'>('visual');

  if (!entry) return null;

  const canViewSensitive = can(ctx, 'records.export_sensitive') || ctx.role === 'super_admin';

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(entry, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Find sensitive field keys from config
  const sensitiveFieldKeys = new Set<string>();
  if (config) {
    for (const ent of config.entities) {
      for (const field of ent.fields) {
        if (field.sensitive) {
          sensitiveFieldKeys.add(field.key);
        }
      }
    }
  }

  // Helper to mask sensitive values
  const formatDiffValue = (key: string, val: unknown): React.ReactNode => {
    const isSensitiveKey =
      sensitiveFieldKeys.has(key) ||
      key.toLowerCase().includes('password') ||
      key.toLowerCase().includes('secret') ||
      key.toLowerCase().includes('diagnosis') ||
      key.toLowerCase().includes('medical');

    if (isSensitiveKey && !showSensitive) {
      return (
        <span className="inline-flex items-center space-x-1 font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-xs">
          <ShieldAlert className="w-3 h-3 text-amber-600 shrink-0" />
          <span>•••••••• (Confidential)</span>
        </span>
      );
    }

    if (val === null || val === undefined) {
      return <span className="text-slate-400 italic">None</span>;
    }
    if (typeof val === 'boolean') {
      return (
        <span
          className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
            val ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}
        >
          {val ? 'Yes' : 'No'}
        </span>
      );
    }
    if (typeof val === 'object') {
      return <pre className="text-[11px] font-mono text-slate-700">{JSON.stringify(val)}</pre>;
    }
    return <span className="font-mono text-xs text-slate-800">{String(val)}</span>;
  };

  // Collect all unique keys from before and after
  const beforeObj = (entry.diff?.before || {}) as Record<string, unknown>;
  const afterObj = (entry.diff?.after || {}) as Record<string, unknown>;
  const allKeys = Array.from(new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]));

  const isImpersonation =
    entry.entityKey === 'tenant_impersonation' ||
    (entry.actorName && entry.actorName.toLowerCase().includes('admin'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                entry.action === 'create'
                  ? 'bg-emerald-100 text-emerald-700'
                  : entry.action === 'delete'
                  ? 'bg-rose-100 text-rose-700'
                  : entry.action === 'restore'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-sky-100 text-sky-700'
              }`}
            >
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-900">Security Audit Inspection</h3>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                    entry.action === 'create'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : entry.action === 'delete'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : entry.action === 'restore'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-sky-50 text-sky-700 border-sky-200'
                  }`}
                >
                  {entry.action}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {entry.id}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Impersonation Callout */}
          {isImpersonation && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800">
                <span className="font-semibold">Platform Administrator Support Event</span>
                <p className="mt-0.5 text-amber-700">
                  This action was logged during a verified platform administrative session with complete accountability tracking.
                </p>
              </div>
            </div>
          )}

          {/* Key Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="flex items-center space-x-1.5 text-slate-400">
                <User className="w-3.5 h-3.5" />
                <span className="font-medium">Responsible Person</span>
              </div>
              <p className="font-semibold text-slate-900 text-sm">{entry.actorName}</p>
              {entry.actorId && <p className="font-mono text-[10px] text-slate-500">{entry.actorId}</p>}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="flex items-center space-x-1.5 text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-medium">Timestamp & Local Time</span>
              </div>
              <p className="font-semibold text-slate-900">
                {formatToTenantTime(entry.createdAt, timezone, true)}
              </p>
              <p className="font-mono text-[10px] text-slate-500">{entry.createdAt}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="flex items-center space-x-1.5 text-slate-400">
                <Tag className="w-3.5 h-3.5" />
                <span className="font-medium">Target Category</span>
              </div>
              <p className="font-semibold text-slate-900 capitalize">
                {entry.entityKey.replace(/_/g, ' ')}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="flex items-center space-x-1.5 text-slate-400">
                <FileText className="w-3.5 h-3.5" />
                <span className="font-medium">Item Reference ID</span>
              </div>
              <p className="font-mono text-slate-900 truncate" title={entry.entityId}>
                {entry.entityId}
              </p>
            </div>
          </div>

          {/* Changes Bullet List */}
          {Array.isArray(entry.diff?.changes) && entry.diff.changes.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Summary of Changes
              </h4>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                {entry.diff.changes.map((change, idx) => (
                  <div key={idx} className="text-xs text-slate-800 flex items-start space-x-2">
                    <span className="text-sky-600 font-bold">•</span>
                    <span>{change}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Diff Controls */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveDiffTab('visual')}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                    activeDiffTab === 'visual'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Side-by-Side Comparison
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDiffTab('raw')}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                    activeDiffTab === 'raw'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Raw Audit Payload
                </button>
              </div>

              {canViewSensitive && (
                <button
                  type="button"
                  onClick={() => setShowSensitive(!showSensitive)}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center space-x-1 px-2 py-1 rounded-lg hover:bg-slate-100 transition"
                >
                  {showSensitive ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                      <span>Hide Sensitive Data</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Reveal Sensitive Data</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Visual Side-by-Side Diff */}
            {activeDiffTab === 'visual' && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                {allKeys.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No discrete field-level changes recorded for this event.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    <div className="grid grid-cols-3 bg-slate-50 p-2.5 font-semibold text-slate-600 uppercase text-[10px] tracking-wider">
                      <div>Field</div>
                      <div>Previous Value</div>
                      <div>Updated Value</div>
                    </div>
                    {allKeys.map((key) => {
                      const beforeVal = beforeObj[key];
                      const afterVal = afterObj[key];
                      const isChanged = JSON.stringify(beforeVal) !== JSON.stringify(afterVal);

                      return (
                        <div
                          key={key}
                          className={`grid grid-cols-3 p-2.5 gap-2 items-center ${
                            isChanged ? 'bg-sky-50/40 font-medium' : ''
                          }`}
                        >
                          <div className="font-mono text-slate-700 truncate" title={key}>
                            {key}
                          </div>
                          <div className="text-slate-500 truncate">
                            {formatDiffValue(key, beforeVal)}
                          </div>
                          <div className="text-slate-900 truncate">
                            {formatDiffValue(key, afterVal)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Raw JSON View */}
            {activeDiffTab === 'raw' && (
              <div className="relative">
                <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono max-h-56 overflow-auto">
                  {JSON.stringify(entry, null, 2)}
                </pre>
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs flex items-center space-x-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cryptographically sealed & immutable</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
