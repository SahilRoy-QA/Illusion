/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { RequestContext } from '../../types/context.ts';
import { ConfigSnapshot } from '../../types/records.ts';
import { TenantConfig } from '../../types/config.ts';
import { defaultPorts } from '../../data/index.ts';
import { formatToTenantTime } from '../../utils/time.ts';
import {
  History,
  Check,
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
  Eye,
  Camera,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { SnapshotDetailModal } from './SnapshotDetailModal.tsx';

interface SnapshotHistoryListProps {
  ctx: RequestContext;
  config: TenantConfig;
  onRestore: (restoredConfig: TenantConfig) => void;
}

export const SnapshotHistoryList: React.FC<SnapshotHistoryListProps> = ({
  ctx,
  config,
  onRestore,
}) => {
  const [snapshots, setSnapshots] = useState<ConfigSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedSnapshot, setSelectedSnapshot] = useState<ConfigSnapshot | null>(null);
  const [manualNote, setManualNote] = useState('');
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    const history = await defaultPorts.snapshots.listHistory(ctx);
    setSnapshots(history);
    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, [ctx.tenantId]);

  const handleCreateManualSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualNote.trim()) return;

    setCreatingSnapshot(true);
    try {
      await defaultPorts.snapshots.recordSnapshot(
        ctx,
        manualNote.trim(),
        'manual.user_checkpoint',
        config
      );
      setManualNote('');
      setSuccessMessage('Manual configuration checkpoint safely recorded.');
      await loadHistory();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error(err);
      alert('Failed to record manual checkpoint.');
    } finally {
      setCreatingSnapshot(false);
    }
  };

  const handleRestore = async (snapshot: ConfigSnapshot) => {
    if (
      !confirm(
        `Are you sure you want to restore the configuration from "${snapshot.summary}"? Current settings will be replaced and a new safety snapshot will be recorded.`
      )
    ) {
      return;
    }

    setRestoringId(snapshot.id);
    try {
      // Invariant 1: Record snapshot before restoring (or snapshot of restoration action)
      await defaultPorts.snapshots.recordSnapshot(
        ctx,
        `Pre-restore safety checkpoint before rolling back to #${snapshot.id.slice(-6)}`,
        'system.restore_precheck',
        config
      );

      // Restore target config
      const targetConfig = snapshot.configState as TenantConfig;
      const restored = await defaultPorts.tenants.save(ctx, targetConfig);

      // Invariant 7: Audit log
      await defaultPorts.audit.record(ctx, {
        actorId: ctx.userId,
        actorName: ctx.role === 'business_admin' ? 'Business Owner' : 'Platform Administrator',
        action: 'restore',
        entityKey: 'tenant_configuration',
        entityId: snapshot.id,
        diff: {
          changes: [`Restored workspace configuration from snapshot "${snapshot.summary}"`],
        },
      });

      onRestore(restored);
      setSuccessMessage(`Configuration restored to snapshot: ${snapshot.summary}`);
      await loadHistory();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: unknown) {
      console.error(err);
      alert('Failed to restore snapshot.');
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Create Checkpoint Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <History className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">Workspace Version Snapshots</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Immutable configuration restore points. Every field modification, branding tweak, and schedule update is auto-captured.
          </p>
        </div>

        {/* Manual Checkpoint Input */}
        <form onSubmit={handleCreateManualSnapshot} className="flex items-center gap-2">
          <input
            type="text"
            value={manualNote}
            onChange={(e) => setManualNote(e.target.value)}
            placeholder="Name a manual checkpoint..."
            className="text-xs px-3 py-2 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none w-56"
          />
          <button
            type="submit"
            disabled={!manualNote.trim() || creatingSnapshot}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition shadow-xs"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Save Checkpoint</span>
          </button>
        </form>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3.5 text-xs text-emerald-900 ring-1 ring-emerald-200">
          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Snapshot Cards or Table */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading version history...</div>
      ) : snapshots.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">No version snapshots recorded yet.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 font-semibold text-slate-600 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Change Summary</th>
                <th className="px-5 py-3.5">Trigger Action</th>
                <th className="px-5 py-3.5">Recorded At</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {snapshots.map((snap, idx) => {
                const isLatest = idx === 0;
                return (
                  <tr
                    key={snap.id}
                    onClick={() => setSelectedSnapshot(snap)}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                  >
                    <td className="px-5 py-3.5 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{snap.summary}</span>
                        {isLatest && (
                          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            Current Active
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {snap.triggerAction}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-slate-500">
                      {formatToTenantTime(snap.createdAt, config.profile.timezone, true)}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedSnapshot(snap)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition"
                          title="Compare with live config"
                        >
                          <Eye className="h-3 w-3 text-slate-400" />
                          <span>Compare</span>
                        </button>

                        {!isLatest && (
                          <button
                            type="button"
                            onClick={() => handleRestore(snap)}
                            disabled={restoringId === snap.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-indigo-700 transition disabled:opacity-50"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>{restoringId === snap.id ? 'Restoring...' : 'Restore'}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Snapshot Comparison & Detail Modal */}
      <SnapshotDetailModal
        snapshot={selectedSnapshot}
        currentConfig={config}
        timezone={config.profile.timezone}
        onRestore={handleRestore}
        onClose={() => setSelectedSnapshot(null)}
      />
    </div>
  );
};
