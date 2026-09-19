/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  History,
  RotateCcw,
  Clock,
  Shield,
  Tag,
  CheckCircle2,
  FileCode,
  Sliders,
  Palette,
  Columns,
  Layers,
} from 'lucide-react';
import { ConfigSnapshot } from '../../types/records.ts';
import { TenantConfig } from '../../types/config.ts';
import { formatToTenantTime } from '../../utils/time.ts';

interface SnapshotDetailModalProps {
  snapshot: ConfigSnapshot | null;
  currentConfig: TenantConfig;
  timezone: string;
  onRestore: (snapshot: ConfigSnapshot) => void;
  onClose: () => void;
}

export function SnapshotDetailModal({
  snapshot,
  currentConfig,
  timezone,
  onRestore,
  onClose,
}: SnapshotDetailModalProps) {
  const [activeView, setActiveView] = useState<'visual' | 'raw'>('visual');

  if (!snapshot) return null;

  const snapConfig = snapshot.configState as TenantConfig;

  // Compute differences between currentConfig and snapConfig
  const diffs: { category: string; description: string; current: string; snapshot: string }[] = [];

  // Business Name / Slug
  if (currentConfig.name !== snapConfig.name) {
    diffs.push({
      category: 'Profile',
      description: 'Business Name',
      current: currentConfig.name,
      snapshot: snapConfig.name,
    });
  }

  // Operating schedule / hours
  const currentHours = JSON.stringify(currentConfig.profile?.hours || {});
  const snapHours = JSON.stringify(snapConfig.profile?.hours || {});
  if (currentHours !== snapHours) {
    diffs.push({
      category: 'Operating Schedule',
      description: 'Weekly Hours Configuration',
      current: 'Active schedule in effect',
      snapshot: 'Snapshot schedule state',
    });
  }

  // Branding Primary Color
  if (currentConfig.branding?.primary !== snapConfig.branding?.primary) {
    diffs.push({
      category: 'Branding',
      description: 'Primary Accent Color',
      current: currentConfig.branding?.primary || 'Default',
      snapshot: snapConfig.branding?.primary || 'Default',
    });
  }

  // Branding Radius
  if (currentConfig.branding?.radius !== snapConfig.branding?.radius) {
    diffs.push({
      category: 'Branding',
      description: 'Corner Radius Softness',
      current: currentConfig.branding?.radius || 'Default',
      snapshot: snapConfig.branding?.radius || 'Default',
    });
  }

  // Button Style
  if (currentConfig.branding?.buttonStyle !== snapConfig.branding?.buttonStyle) {
    diffs.push({
      category: 'Branding',
      description: 'Button Style',
      current: currentConfig.branding?.buttonStyle || 'Default',
      snapshot: snapConfig.branding?.buttonStyle || 'Default',
    });
  }

  // Tax Rate
  if (currentConfig.profile?.taxRate !== snapConfig.profile?.taxRate) {
    diffs.push({
      category: 'Regional Settings',
      description: 'Tax Percentage',
      current: `${currentConfig.profile?.taxRate ?? 0}%`,
      snapshot: `${snapConfig.profile?.taxRate ?? 0}%`,
    });
  }

  // Entities comparison
  const currentEntityKeys = currentConfig.entities.map((e) => e.key).sort().join(',');
  const snapEntityKeys = (snapConfig.entities || []).map((e) => e.key).sort().join(',');
  if (currentEntityKeys !== snapEntityKeys) {
    diffs.push({
      category: 'Entities & Schema',
      description: 'Entity Definitions',
      current: currentConfig.entities.map((e) => e.singular).join(', '),
      snapshot: (snapConfig.entities || []).map((e) => e.singular).join(', '),
    });
  }

  // Entities field count diff
  const currentFieldCount = currentConfig.entities.reduce((acc, e) => acc + e.fields.length, 0);
  const snapFieldCount = (snapConfig.entities || []).reduce((acc, e) => acc + (e.fields?.length || 0), 0);
  if (currentFieldCount !== snapFieldCount) {
    diffs.push({
      category: 'Entities & Schema',
      description: 'Total Custom Fields Defined',
      current: `${currentFieldCount} fields`,
      snapshot: `${snapFieldCount} fields`,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Version Snapshot Inspection</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Snapshot ID: {snapshot.id}
              </p>
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
          {/* Summary Box */}
          <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                Snapshot Summary
              </span>
              <span className="text-[11px] font-mono text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">
                {snapshot.triggerAction}
              </span>
            </div>
            <p className="text-sm font-semibold text-indigo-950">{snapshot.summary}</p>
            <div className="flex items-center space-x-4 text-xs text-indigo-700 pt-1">
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatToTenantTime(snapshot.createdAt, timezone, true)}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Tag className="w-3.5 h-3.5" />
                <span>Version {snapConfig.schemaVersion || 1}</span>
              </span>
            </div>
          </div>

          {/* Toggle View Mode */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setActiveView('visual')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeView === 'visual'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Side-by-Side Differences ({diffs.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveView('raw')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeView === 'raw'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Configuration State JSON
              </button>
            </div>
          </div>

          {/* Side-by-Side Diff */}
          {activeView === 'visual' && (
            <div className="space-y-3">
              {diffs.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
                  <p className="font-semibold text-slate-800">Identical to Current Setup</p>
                  <p className="mt-0.5 text-slate-500">
                    This snapshot's configuration matches your currently active workspace state.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-12 bg-slate-50 p-2.5 font-semibold text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-100">
                    <div className="col-span-4">Setting / Area</div>
                    <div className="col-span-4">In This Snapshot</div>
                    <div className="col-span-4">Currently Live</div>
                  </div>
                  <div className="divide-y divide-slate-100 text-xs">
                    {diffs.map((d, i) => (
                      <div key={i} className="grid grid-cols-12 p-3 gap-2 items-center hover:bg-slate-50/60">
                        <div className="col-span-4">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            {d.category}
                          </span>
                          <span className="font-medium text-slate-800">{d.description}</span>
                        </div>
                        <div className="col-span-4 font-mono text-indigo-700 bg-indigo-50/50 p-1.5 rounded truncate">
                          {d.snapshot}
                        </div>
                        <div className="col-span-4 font-mono text-slate-700 bg-slate-100 p-1.5 rounded truncate">
                          {d.current}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Raw JSON View */}
          {activeView === 'raw' && (
            <div className="space-y-2">
              <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono max-h-64 overflow-auto">
                {JSON.stringify(snapConfig, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Immutable configuration backup point</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onRestore(snapshot);
                onClose();
              }}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore This Version</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
