/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Lock,
  Download,
  Filter,
  Trash2,
  Edit2,
  RotateCcw,
  CheckCircle,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowUpDown,
  Archive,
} from 'lucide-react';
import { RequestContext, UserAccount } from '../../types/context.ts';
import { TenantConfig, EntityDef } from '../../types/config.ts';
import { DynamicRecord } from '../../types/records.ts';
import { defaultPorts } from '../../data/index.ts';
import { can } from '../../utils/permissions.ts';
import { formatToTenantTime } from '../../utils/time.ts';
import { RecordCreateModal } from './RecordCreateModal.tsx';
import { RecordEditModal } from './RecordEditModal.tsx';
import { RecordDeleteModal } from './RecordDeleteModal.tsx';

interface RecordManagerProps {
  config: TenantConfig;
  ctx: RequestContext;
  currentUser: UserAccount | null;
}

export function RecordManager({ config, ctx, currentUser }: RecordManagerProps) {
  const [selectedEntityKey, setSelectedEntityKey] = useState<string>(
    config.entities[0]?.key || ''
  );
  const [records, setRecords] = useState<DynamicRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DynamicRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<DynamicRecord | null>(null);

  const currentEntity = config.entities.find((e) => e.key === selectedEntityKey) || config.entities[0];

  const canCreate = can(ctx, 'records.create');
  const canEdit = can(ctx, 'records.edit');
  const canDelete = can(ctx, 'records.remove');
  const canExportSensitive = can(ctx, 'records.export_sensitive');

  // Load records
  const loadRecords = async () => {
    if (!currentEntity) return;
    setLoading(true);
    try {
      const data = await defaultPorts.records.query(ctx, currentEntity.key, {
        search: searchQuery,
        includeDeleted: showArchived,
        sort: { field: sortField, dir: sortDir },
      });
      setRecords(data);
    } catch (err) {
      console.error('Failed to load records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [currentEntity?.key, searchQuery, showArchived, sortField, sortDir, ctx.tenantId]);

  const handleRestore = async (rec: DynamicRecord) => {
    try {
      const ok = await defaultPorts.records.restore(ctx, currentEntity.key, rec.id);
      if (ok) {
        setActionNotice(`Restored record #${rec.id.slice(0, 8)}`);
        setTimeout(() => setActionNotice(null), 3000);
        loadRecords();
      }
    } catch (err: unknown) {
      setActionNotice(err instanceof Error ? err.message : 'Failed to restore record');
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  const handleExportCsv = () => {
    if (!currentEntity || records.length === 0) return;

    const exportableFields = currentEntity.fields.filter(
      (f) => !f.archived && (!f.sensitive || canExportSensitive)
    );

    const headers = exportableFields.map((f) => `"${f.label.replace(/"/g, '""')}"`).join(',');
    const rows = records.map((rec) => {
      return exportableFields
        .map((f) => {
          const val = rec.data[f.key] ?? '';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `${config.slug}-${currentEntity.key}-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setActionNotice(
      `Exported ${records.length} ${currentEntity.plural} to CSV. Recorded in activity audit.`
    );
    setTimeout(() => setActionNotice(null), 4000);

    // Invariant 7: privileged record export audited
    defaultPorts.audit
      .record(ctx, {
        actorId: ctx.userId,
        actorName: ctx.role === 'business_admin' ? 'Business Administrator' : 'Staff Member',
        action: 'create',
        entityKey: currentEntity.key,
        entityId: `csv-export-${new Date().toISOString().slice(0, 10)}`,
        diff: {
          changes: [
            `Exported ${records.length} ${currentEntity.plural} records to CSV spreadsheet (sensitive fields ${canExportSensitive ? 'included' : 'masked'})`,
          ],
        },
      })
      .catch(() => {});
  };

  const toggleSort = (fieldKey: string) => {
    if (sortField === fieldKey) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(fieldKey);
      setSortDir('asc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Entity Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-slate-900">
              {currentEntity ? currentEntity.plural : 'Business Records'}
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {records.length} {showArchived ? 'Total (Inc. Archived)' : 'Active'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {canExportSensitive
              ? 'Showing all details including confidential fields.'
              : 'Confidential fields are automatically masked for privacy.'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={records.length === 0}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition disabled:opacity-40"
            title="Download records as CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {canCreate ? (
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Add {currentEntity?.singular || 'Record'}</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
              <Lock className="h-3.5 w-3.5" />
              <span>Create Restricted</span>
            </div>
          )}
        </div>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Filter and Search Controls Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Entity Selector Pills if multiple entities exist */}
        {config.entities.length > 1 && (
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0">
            {config.entities.map((ent) => (
              <button
                key={ent.key}
                type="button"
                onClick={() => setSelectedEntityKey(ent.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition shrink-0 ${
                  currentEntity?.key === ent.key
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {ent.plural}
              </button>
            ))}
          </div>
        )}

        {/* Search & Archived Toggle */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${currentEntity?.plural.toLowerCase()}...`}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowArchived((prev) => !prev)}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition shrink-0 border ${
              showArchived
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{showArchived ? 'Showing Archived' : 'Show Archived'}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase border-b border-slate-200">
              <tr>
                {currentEntity?.fields
                  .filter((f) => f.showInList && !f.archived)
                  .map((f) => (
                    <th
                      key={f.key}
                      onClick={() => toggleSort(f.key)}
                      className="px-6 py-3 cursor-pointer hover:bg-slate-100 transition select-none"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>{f.label}</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                  ))}
                <th
                  onClick={() => toggleSort('createdAt')}
                  className="px-6 py-3 cursor-pointer hover:bg-slate-100 transition select-none"
                >
                  <div className="flex items-center space-x-1.5">
                    <span>Created</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {records.length === 0 ? (
                <tr>
                  <td
                    colSpan={(currentEntity?.fields.filter((f) => f.showInList).length || 1) + 2}
                    className="px-6 py-12 text-center text-xs text-slate-500"
                  >
                    {searchQuery
                      ? `No ${currentEntity?.plural.toLowerCase()} matching "${searchQuery}".`
                      : `No ${currentEntity?.plural.toLowerCase()} recorded yet.`}
                  </td>
                </tr>
              ) : (
                records.map((rec) => {
                  const isDeleted = !!rec.deletedAt;
                  return (
                    <tr
                      key={rec.id}
                      className={`hover:bg-slate-50 transition ${
                        isDeleted ? 'bg-slate-50/70 opacity-60' : ''
                      }`}
                    >
                      {currentEntity?.fields
                        .filter((f) => f.showInList && !f.archived)
                        .map((f) => {
                          const val = String(rec.data[f.key] ?? '—');
                          const isMasked = val.includes('Confidential');
                          return (
                            <td key={f.key} className="px-6 py-4 font-medium text-slate-900">
                              {isMasked ? (
                                <span className="text-xs italic text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md font-normal border border-rose-100">
                                  {val}
                                </span>
                              ) : (
                                val
                              )}
                            </td>
                          );
                        })}

                      <td className="px-6 py-4 text-xs text-slate-500">
                        {formatToTenantTime(rec.createdAt, config.profile.timezone, false)}
                        {isDeleted && (
                          <span className="block text-[10px] text-amber-600 font-semibold mt-0.5">
                            Archived
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center space-x-1">
                          {isDeleted ? (
                            canEdit && (
                              <button
                                type="button"
                                onClick={() => handleRestore(rec)}
                                className="p-1.5 text-xs text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                                title="Restore archived record"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )
                          ) : (
                            <>
                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={() => setEditingRecord(rec)}
                                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                                  title="Edit record"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => setDeletingRecord(rec)}
                                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                                  title="Archive record"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {isCreateOpen && currentEntity && (
        <RecordCreateModal
          isOpen={isCreateOpen}
          entity={currentEntity}
          config={config}
          ctx={ctx}
          onClose={() => setIsCreateOpen(false)}
          onRecordCreated={(newRec) => {
            setRecords((prev) => [newRec, ...prev]);
            setActionNotice(`Added new ${currentEntity.singular}`);
            setTimeout(() => setActionNotice(null), 3000);
          }}
        />
      )}

      {editingRecord && currentEntity && (
        <RecordEditModal
          isOpen={!!editingRecord}
          record={editingRecord}
          entity={currentEntity}
          config={config}
          ctx={ctx}
          onClose={() => setEditingRecord(null)}
          onRecordUpdated={(updated) => {
            setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
            setActionNotice(`Saved updates to ${currentEntity.singular}`);
            setTimeout(() => setActionNotice(null), 3000);
          }}
        />
      )}

      {deletingRecord && currentEntity && (
        <RecordDeleteModal
          isOpen={!!deletingRecord}
          record={deletingRecord}
          entity={currentEntity}
          ctx={ctx}
          onClose={() => setDeletingRecord(null)}
          onRecordDeleted={(deletedId) => {
            if (showArchived) {
              loadRecords();
            } else {
              setRecords((prev) => prev.filter((r) => r.id !== deletedId));
            }
            setActionNotice(`Archived ${currentEntity.singular}`);
            setTimeout(() => setActionNotice(null), 3000);
          }}
        />
      )}
    </div>
  );
}
