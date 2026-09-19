/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  RotateCcw,
  HardDrive,
  FileJson,
  FileSpreadsheet,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  FolderArchive,
  UserCheck,
} from 'lucide-react';
import { TenantConfig } from '../../types/config.ts';
import { RequestContext } from '../../types/context.ts';
import { BackupBundle } from '../../types/ports.ts';
import { defaultPorts } from '../../data/index.ts';
import { can } from '../../utils/permissions.ts';

interface DataPortabilitySectionProps {
  config: TenantConfig;
  ctx: RequestContext;
  onConfigSaved: (updated: TenantConfig) => void;
}

export function DataPortabilitySection({
  config,
  ctx,
  onConfigSaved,
}: DataPortabilitySectionProps) {
  const [downloading, setDownloading] = useState(false);
  const [redactSensitive, setRedactSensitive] = useState(true);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Restore flow state
  const [pendingBundle, setPendingBundle] = useState<BackupBundle | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canExportSensitive = can(ctx, 'records.export_sensitive');
  const canManageBackups =
    ctx.role === 'business_admin' || ctx.role === 'super_admin' || can(ctx, 'tenant.export');

  // Handle Full JSON Backup Generation
  const handleDownloadBackup = async () => {
    if (!canManageBackups) return;
    setDownloading(true);
    setErrorNotice(null);
    setSuccessNotice(null);

    try {
      const bundle = await defaultPorts.backup.generateBackup(ctx, {
        redactSensitive: !canExportSensitive ? true : redactSensitive,
      });

      const jsonStr = JSON.stringify(bundle, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateTag = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `illusion-${config.slug}-backup-${dateTag}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccessNotice(
        `Backup archive downloaded successfully (${bundle.stats.recordCount} records, ${bundle.stats.teamCount} team members). Event recorded in activity log.`
      );
      setTimeout(() => setSuccessNotice(null), 6000);
    } catch (err: unknown) {
      setErrorNotice(err instanceof Error ? err.message : 'Failed to generate backup archive');
    } finally {
      setDownloading(false);
    }
  };

  // Handle Backup File Selected
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text) as BackupBundle;

        if (!parsed.tenant || !Array.isArray(parsed.records)) {
          throw new Error('The selected file is not a valid illusion workspace backup package.');
        }

        setPendingBundle(parsed);
        setRestoreModalOpen(true);
        setErrorNotice(null);
      } catch (err: unknown) {
        setErrorNotice(
          err instanceof Error
            ? err.message
            : 'Could not read backup file. Please ensure it is a valid JSON file.'
        );
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  // Execute Workspace Restore
  const handleConfirmRestore = async () => {
    if (!pendingBundle) return;
    setIsRestoring(true);
    setErrorNotice(null);

    try {
      const result = await defaultPorts.backup.restoreBackup(ctx, pendingBundle);
      onConfigSaved(result.restoredTenant);
      setRestoreModalOpen(false);
      setPendingBundle(null);
      setSuccessNotice(
        `${result.message} A safety checkpoint of your previous setup was saved.`
      );
      setTimeout(() => setSuccessNotice(null), 8000);
    } catch (err: unknown) {
      setErrorNotice(err instanceof Error ? err.message : 'Restore operation failed');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <FolderArchive className="w-5 h-5 text-sky-600" />
            <span>Data Portability & Workspace Backup</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Download self-contained backup copies of your business, export customer records, or restore your workspace from a saved backup file.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            Invariants 7 & 8 Guarded
          </span>
        </div>
      </div>

      {/* Notices */}
      {successNotice && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs flex items-center space-x-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {errorNotice && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-center space-x-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Backup and Restore Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Download Workspace Backup */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <FileJson className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Download Backup Package</h4>
                <p className="text-xs text-slate-500">Self-contained portable JSON archive</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Packages your entire business into a standard portable file: contact profile, custom record designs, operating schedules, public website draft, all client records, team roles, and setup history snapshots.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-2 mb-4">
              <div className="flex items-center justify-between text-slate-700">
                <span className="flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Sensitive Information Protection</span>
                </span>
                {canExportSensitive ? (
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={redactSensitive}
                      onChange={(e) => setRedactSensitive(e.target.checked)}
                      className="w-3.5 h-3.5 text-sky-600 rounded border-slate-300"
                    />
                    <span className="text-[11px] font-medium text-slate-600">
                      Sanitize private fields
                    </span>
                  </label>
                ) : (
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    Always Redacted
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {redactSensitive || !canExportSensitive
                  ? 'Sensitive fields (e.g. private patient notes, private client comments) will be replaced with [PROTECTED: SENSITIVE].'
                  : 'Full unredacted sensitive details will be included in the export (logged to audit trail).'}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={downloading || !canManageBackups}
            onClick={handleDownloadBackup}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 transition shadow-xs flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {downloading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating Backup Package...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Backup Archive (.json)</span>
              </>
            )}
          </button>
        </div>

        {/* Card 2: Restore from Backup File */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Restore from Backup Copy</h4>
                <p className="text-xs text-slate-500">Disaster recovery & data restoration</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Restore your workspace configuration, records, and team assignments from a previous backup file. A safety checkpoint will be saved automatically prior to restoration.
            </p>

            <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/70 text-xs text-amber-900 space-y-1 mb-4">
              <div className="flex items-center space-x-1.5 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>Zero Data Loss Safety Guarantee</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-normal">
                Before any existing data is overwritten, illusion creates a full automatic safety checkpoint in your Version History, so you can reverse the restore anytime.
              </p>
            </div>
          </div>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              disabled={!canManageBackups}
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition shadow-xs flex items-center justify-center space-x-2 disabled:opacity-50 border border-slate-200"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              <span>Select Backup File to Restore...</span>
            </button>
          </div>
        </div>
      </div>

      {/* Compliance & Privacy Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Privacy & Compliance Portability Standards</h4>
            <p className="text-xs text-slate-500">
              Meeting GDPR, CCPA, and healthcare privacy data retrieval obligations
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs font-semibold text-slate-800">Right to Portability</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Data packages are exported in standard open format (JSON & CSV) without proprietary lock-in.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs font-semibold text-slate-800">Sensitive Field Scrubbing</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Fields classified as sensitive are automatically masked unless privileged credentials are confirmed.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs font-semibold text-slate-800">Full Audit Logging</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Every download, spreadsheet export, and restoration is immutably timestamped with actor ID in the Activity Log.
            </p>
          </div>
        </div>
      </div>

      {/* Restore Verification Modal */}
      {restoreModalOpen && pendingBundle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Verify Backup Package</h3>
                  <p className="text-[11px] text-slate-500">Confirm restoration into {config.name}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Origin Business Name:</span>
                  <span className="font-semibold text-slate-800">{pendingBundle.tenant?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Backup Created:</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(pendingBundle.exportedAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Created By:</span>
                  <span className="font-semibold text-slate-800">
                    {pendingBundle.exportedBy?.name} ({pendingBundle.exportedBy?.role})
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2">
                  <span className="text-slate-500">Records to Restore:</span>
                  <span className="font-bold text-indigo-600">
                    {pendingBundle.stats?.recordCount ?? pendingBundle.records?.length ?? 0} records
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Entities Defined:</span>
                  <span className="font-semibold text-slate-800">
                    {pendingBundle.tenant?.entities?.map((e) => e.singular).join(', ')}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <p className="font-semibold flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>Pre-Restore Safety Checkpoint</span>
                </p>
                <p className="text-[11px] text-amber-800">
                  A snapshot of your current workspace will be captured before the restore executes. You can revert this action in Version History at any time.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2.5 p-4 border-t border-slate-100 bg-slate-50/50">
              <button
                type="button"
                disabled={isRestoring}
                onClick={() => {
                  setRestoreModalOpen(false);
                  setPendingBundle(null);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRestoring}
                onClick={handleConfirmRestore}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Restoring Workspace...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm & Restore Workspace</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
