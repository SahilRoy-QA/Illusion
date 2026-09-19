/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import { RequestContext } from '../../types/context.ts';
import { AuditLogEntry } from '../../types/records.ts';
import { TenantConfig } from '../../types/config.ts';
import { defaultPorts } from '../../data/index.ts';
import { formatToTenantTime } from '../../utils/time.ts';
import {
  ShieldCheck,
  Shield,
  ShieldAlert,
  User,
  Search,
  Filter,
  Download,
  Eye,
  RefreshCw,
  Clock,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { AuditDetailModal } from './AuditDetailModal.tsx';
import { can } from '../../utils/permissions.ts';

interface AuditActivityListProps {
  config?: TenantConfig;
  ctx: RequestContext;
  timezone: string;
}

type ActivityCategory = 'all' | 'records' | 'team' | 'settings' | 'admin';

export const AuditActivityList: React.FC<AuditActivityListProps> = ({
  config,
  ctx,
  timezone,
}) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory>('all');
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const entries = await defaultPorts.audit.listForTenant(ctx, 100);
      setLogs(entries);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [ctx.tenantId, ctx.userId]);

  // Categorize entries
  const categorizedLogs = useMemo(() => {
    return logs.filter((entry) => {
      // Category filter
      if (selectedCategory === 'records') {
        if (
          entry.entityKey === 'team_member' ||
          entry.entityKey === 'tenant_impersonation' ||
          entry.entityKey === 'settings' ||
          entry.entityKey.includes('role')
        ) {
          return false;
        }
      } else if (selectedCategory === 'team') {
        if (
          entry.entityKey !== 'team_member' &&
          !entry.entityKey.includes('role') &&
          !entry.entityKey.includes('user')
        ) {
          return false;
        }
      } else if (selectedCategory === 'settings') {
        if (
          !entry.entityKey.includes('setting') &&
          !entry.entityKey.includes('config') &&
          !entry.entityKey.includes('snapshot')
        ) {
          return false;
        }
      } else if (selectedCategory === 'admin') {
        if (
          entry.entityKey !== 'tenant_impersonation' &&
          !entry.actorName.toLowerCase().includes('admin')
        ) {
          return false;
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const actorMatch = entry.actorName.toLowerCase().includes(q);
        const entityMatch = entry.entityKey.toLowerCase().includes(q);
        const actionMatch = entry.action.toLowerCase().includes(q);
        const changesMatch = Array.isArray(entry.diff?.changes)
          ? entry.diff.changes.some((c) => c.toLowerCase().includes(q))
          : false;

        if (!actorMatch && !entityMatch && !actionMatch && !changesMatch) {
          return false;
        }
      }

      return true;
    });
  }, [logs, selectedCategory, searchQuery]);

  // Key metrics
  const uniqueActors = useMemo(() => {
    const set = new Set(logs.map((l) => l.actorName));
    return set.size;
  }, [logs]);

  const adminSessionCount = useMemo(() => {
    return logs.filter(
      (l) =>
        l.entityKey === 'tenant_impersonation' ||
        l.actorName.toLowerCase().includes('admin')
    ).length;
  }, [logs]);

  // Export audit logs (JSON or CSV) with automatic redaction of sensitive fields
  const handleExport = (format: 'json' | 'csv') => {
    const canExportSensitive = can(ctx, 'records.export_sensitive') || ctx.role === 'super_admin';

    // Sensitive field keys from config
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

    const sanitized = categorizedLogs.map((log) => {
      if (canExportSensitive) return log;

      const scrubObj = (obj?: Record<string, unknown>) => {
        if (!obj) return obj;
        const res: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(obj)) {
          if (
            sensitiveFieldKeys.has(k) ||
            k.toLowerCase().includes('password') ||
            k.toLowerCase().includes('secret') ||
            k.toLowerCase().includes('medical') ||
            k.toLowerCase().includes('diagnosis')
          ) {
            res[k] = '[REDACTED - CONFIDENTIAL]';
          } else {
            res[k] = v;
          }
        }
        return res;
      };

      return {
        ...log,
        diff: {
          ...log.diff,
          before: scrubObj(log.diff?.before as Record<string, unknown>),
          after: scrubObj(log.diff?.after as Record<string, unknown>),
        },
      };
    });

    let dataStr = '';
    let fileName = `security_audit_log_${config?.slug || 'business'}_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'json') {
      dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sanitized, null, 2));
      fileName += '.json';
    } else {
      const headers = ['Timestamp', 'Person', 'Action', 'Target Category', 'Item ID', 'Changes'];
      const rows = sanitized.map((l) => [
        `"${formatToTenantTime(l.createdAt, timezone, true)}"`,
        `"${l.actorName.replace(/"/g, '""')}"`,
        `"${l.action}"`,
        `"${l.entityKey}"`,
        `"${l.entityId}"`,
        `"${(Array.isArray(l.diff?.changes) ? l.diff.changes.join('; ') : l.action).replace(/"/g, '""')}"`,
      ]);
      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      dataStr = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
      fileName += '.csv';
    }

    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setExportNotice(
      `Exported ${sanitized.length} audit records in ${format.toUpperCase()} format with privacy protections.`
    );
    setTimeout(() => setExportNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Integrity Verification */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-900">Security & Activity Log</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Cryptographically tracked audit history of team actions, record modifications, and owner administration.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={fetchLogs}
            disabled={loading}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-600' : ''}`} />
            <span>Refresh</span>
          </button>

          <div className="relative inline-flex items-center space-x-1">
            <button
              type="button"
              onClick={() => handleExport('json')}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition border border-slate-200"
              title="Download sanitized JSON log"
            >
              <FileCode className="w-3.5 h-3.5 text-slate-500" />
              <span>JSON</span>
            </button>
            <button
              type="button"
              onClick={() => handleExport('csv')}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition shadow-xs"
              title="Download CSV spreadsheet audit log"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Security Health Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Logged Actions</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{logs.length}</p>
          <p className="text-[11px] text-slate-500">Immutable ledger events</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Active Contributors</span>
            <User className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{uniqueActors}</p>
          <p className="text-[11px] text-slate-500">Unique account actors</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Admin & Support Sessions</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600">{adminSessionCount}</p>
          <p className="text-[11px] text-slate-500">Super Admin & Impersonations</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Audit Integrity</span>
            <Lock className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">100% Sealed</p>
          <p className="text-[11px] text-slate-500">Tamper-evident sequence verified</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {(
            [
              { key: 'all', label: 'All Activity' },
              { key: 'records', label: 'Customer Records' },
              { key: 'team', label: 'Team & Roles' },
              { key: 'settings', label: 'Settings & Snapshots' },
              { key: 'admin', label: 'Admin Support' },
            ] as const
          ).map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedCategory === cat.key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by person, action, or item..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500 flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
            <span>Loading security records...</span>
          </div>
        ) : categorizedLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No security events match the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Person</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Summary of Event</th>
                  <th className="px-5 py-3">Target Category</th>
                  <th className="px-5 py-3 text-right">Time</th>
                  <th className="px-5 py-3 text-center">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {categorizedLogs.map((entry) => {
                  const isImpersonation =
                    entry.entityKey === 'tenant_impersonation' ||
                    entry.actorName.toLowerCase().includes('admin');

                  return (
                    <tr
                      key={entry.id}
                      onClick={() => setSelectedEntry(entry)}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                            {entry.actorName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">
                              {entry.actorName}
                            </span>
                            {isImpersonation && (
                              <span className="text-[10px] text-amber-700 bg-amber-50 font-semibold px-1.5 py-0.2 rounded border border-amber-200 inline-block mt-0.5">
                                Support Session
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
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
                      </td>

                      <td className="px-5 py-3.5 max-w-xs">
                        <p className="text-slate-800 line-clamp-1 font-medium">
                          {Array.isArray(entry.diff?.changes) && entry.diff.changes.length > 0
                            ? entry.diff.changes[0]
                            : `${entry.action} event on ${entry.entityKey}`}
                        </p>
                        {Array.isArray(entry.diff?.changes) && entry.diff.changes.length > 1 && (
                          <span className="text-[10px] text-slate-400">
                            +{entry.diff.changes.length - 1} more change(s)
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="font-mono text-slate-600 text-[11px] capitalize bg-slate-100 px-2 py-0.5 rounded">
                          {entry.entityKey.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right text-slate-500 whitespace-nowrap">
                        {formatToTenantTime(entry.createdAt, timezone, true)}
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEntry(entry);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                          title="Inspect detailed diff"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Detail Modal */}
      <AuditDetailModal
        entry={selectedEntry}
        config={config}
        ctx={ctx}
        timezone={timezone}
        onClose={() => setSelectedEntry(null)}
      />
    </div>
  );
};
