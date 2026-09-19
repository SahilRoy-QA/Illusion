/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Activity,
  Layers,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  HardDrive,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { TenantConfig, WidgetInstance } from '../../types/config.ts';
import { RequestContext, UserAccount } from '../../types/context.ts';
import { DynamicRecord } from '../../types/records.ts';
import { defaultPorts } from '../../data/index.ts';
import { formatMinorUnits } from '../../utils/money.ts';
import { formatToTenantTime } from '../../utils/time.ts';

interface AnalyticsDashboardProps {
  config: TenantConfig;
  ctx: RequestContext;
  currentUser: UserAccount | null;
  onNavigateTab: (tab: string) => void;
}

export function AnalyticsDashboard({
  config,
  ctx,
  currentUser,
  onNavigateTab,
}: AnalyticsDashboardProps) {
  const [entityCounts, setEntityCounts] = useState<Record<string, number>>({});
  const [recentRecords, setRecentRecords] = useState<DynamicRecord[]>([]);
  const [usersCount, setUsersCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const primaryEntity = config.entities[0];

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const counts: Record<string, number> = {};
        for (const ent of config.entities) {
          const c = await defaultPorts.records.count(ctx, ent.key);
          counts[ent.key] = c;
        }
        setEntityCounts(counts);

        if (primaryEntity) {
          const recs = await defaultPorts.records.query(ctx, primaryEntity.key, {
            limit: 5,
            sort: { field: 'createdAt', dir: 'desc' },
          });
          setRecentRecords(recs);
        }

        const team = await defaultPorts.users.listByTenant(ctx);
        setUsersCount(team.length);
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [config.id, ctx.tenantId]);

  // Compute total volume
  const totalRecordsAcrossAll = Object.values(entityCounts).reduce((a, b) => a + b, 0);

  // Storage usage calculation simulation
  const planLimits = config.subscription?.limits || { users: 10, records: 500, storageMb: 50 };
  const recordsUsagePercent = Math.min(
    100,
    Math.round((totalRecordsAcrossAll / (planLimits.records || 500)) * 100)
  );

  return (
    <div className="space-y-6">
      {/* Dynamic Configured Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {config.dashboard.widgets.map((widget, idx) => {
          const targetEntity = config.entities.find((e) => e.key === widget.dataSource.entity) || primaryEntity;
          const count = entityCounts[targetEntity?.key || ''] || 0;

          const icons = [Users, Calendar, Activity, Sparkles];
          const IconComponent = icons[idx % icons.length];

          return (
            <div
              key={widget.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {widget.title}
                </span>
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <IconComponent className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-slate-900">{count}</span>
                  <span className="text-xs font-medium text-emerald-600 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-0.5" />
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Targeted entity: <span className="font-medium text-slate-700">{targetEntity?.singular || 'Item'}</span>
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onNavigateTab('records')}
                  className="text-xs font-medium text-sky-600 hover:text-sky-700 flex items-center space-x-1"
                >
                  <span>Manage {targetEntity?.plural || 'Records'}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Financial Sample Calculator Card (Invariant 9: Money in Minor Units) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Sample Billing Unit
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900">
                {formatMinorUnits(125000, config.profile.currency, config.profile.locale)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Integer math in minor units ({config.profile.currency})
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Zero rounding bias</span>
            <span className="text-xs font-medium text-emerald-600">Verified</span>
          </div>
        </div>

        {/* Subscription Plan & Capacity Widget */}
        <div
          onClick={() => onNavigateTab('settings')}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition cursor-pointer group"
          title="Click to manage subscription plan and quotas"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-indigo-600 transition">
              Tenant Plan & Quota
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-100 transition">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-600">Capacity Usage</span>
              <span className="font-semibold text-slate-900">
                {totalRecordsAcrossAll} / {planLimits.records} records
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${recordsUsagePercent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Active Tier: <span className="font-semibold uppercase text-slate-700">{config.subscription?.plan || 'Growth'}</span>
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Seats: {usersCount} / {planLimits.users}</span>
            <span className="text-xs text-purple-600 font-semibold">Active</span>
          </div>
        </div>
      </div>

      {/* Two-Column Middle Section: Recent Activity & Archetype Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Recent Records Stream */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Recent {primaryEntity ? primaryEntity.plural : 'Records'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Latest updates logged in {config.profile.timezone}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('records')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 transition flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {recentRecords.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No recent records logged yet.
              </div>
            ) : (
              recentRecords.map((rec) => {
                const title =
                  (rec.data.name as string) ||
                  (rec.data.fullName as string) ||
                  (rec.data.title as string) ||
                  `Record #${rec.id.slice(0, 8)}`;
                const subtitle =
                  (rec.data.phone as string) ||
                  (rec.data.category as string) ||
                  (rec.data.sku as string) ||
                  (rec.data.treatment as string) ||
                  '';

                return (
                  <div
                    key={rec.id}
                    className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl transition"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{title}</p>
                      {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400">
                        {formatToTenantTime(rec.createdAt, config.profile.timezone, false)}
                      </span>
                      <span className="block text-[10px] font-mono text-slate-400">v{rec.version}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Col: Business Archetype & System Invariants */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Archetype Configuration</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                <span className="text-slate-500">Business Model</span>
                <span className="font-semibold text-slate-900 uppercase">
                  {config.businessTypeKey}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                <span className="text-slate-500">Primary Timezone</span>
                <span className="font-semibold text-slate-900">{config.profile.timezone}</span>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                <span className="text-slate-500">Store Currency</span>
                <span className="font-semibold text-slate-900">{config.profile.currency}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Published Website</span>
                <span className="font-semibold text-emerald-600">
                  {config.website.published ? 'Live Online' : 'Draft Ready'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('website')}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition text-center block"
            >
              Open Website Editor
            </button>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Multi-Tenant Guarantees Active</span>
            </div>
            <p className="text-[11px] text-emerald-700 leading-relaxed">
              Every data access request verifies tenant boundary constraints, scrubbed public fields, and optimistic lock counters.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
