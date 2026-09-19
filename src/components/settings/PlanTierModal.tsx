/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Check,
  Shield,
  Zap,
  Building,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { TenantConfig } from '../../types/config.ts';
import { RequestContext } from '../../types/context.ts';
import { defaultPorts } from '../../data/index.ts';

interface PlanTierModalProps {
  isOpen: boolean;
  currentConfig: TenantConfig;
  ctx: RequestContext;
  onPlanUpdated: (updated: TenantConfig) => void;
  onClose: () => void;
}

interface PlanDefinition {
  id: string;
  name: string;
  priceMonthly: number;
  description: string;
  badge?: string;
  limits: {
    records: number;
    users: number;
    storageMb: number;
  };
  features: string[];
}

const AVAILABLE_PLANS: PlanDefinition[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceMonthly: 0,
    description: 'Essential tools for solo practices, boutique studios, and new ventures.',
    limits: {
      records: 250,
      users: 3,
      storageMb: 25,
    },
    features: [
      'Up to 250 customer records',
      '3 team member seats',
      'Public appointment booking site',
      'Full audit trail tracking',
      'Automatic configuration snapshots',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    priceMonthly: 49,
    description: 'Designed for thriving clinics, busy salons, and expanding retail businesses.',
    badge: 'Most Popular',
    limits: {
      records: 1500,
      users: 15,
      storageMb: 100,
    },
    features: [
      'Up to 1,500 customer records',
      '15 team member seats',
      'Custom branding & button styling',
      'Weekly operating schedule engine',
      'Sensitive medical/client data masking',
      'Priority export in JSON & CSV',
    ],
  },
  {
    id: 'scale',
    name: 'Scale & Enterprise',
    priceMonthly: 129,
    description: 'Maximum capacity, multi-department staff, and advanced compliance governance.',
    badge: 'Full Power',
    limits: {
      records: 10000,
      users: 50,
      storageMb: 500,
    },
    features: [
      'Up to 10,000 customer records',
      '50 team member seats',
      'Custom domain & verified SSL',
      'Unlimited manual version checkpoints',
      'Full compliance audit exports',
      'Multi-role custom job labels',
    ],
  },
];

export function PlanTierModal({
  isOpen,
  currentConfig,
  ctx,
  onPlanUpdated,
  onClose,
}: PlanTierModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState(
    currentConfig.subscription?.plan?.toLowerCase() || 'growth'
  );
  const [updating, setUpdating] = useState(false);

  if (!isOpen) return null;

  const currentPlan =
    AVAILABLE_PLANS.find((p) => p.id === selectedPlanId) || AVAILABLE_PLANS[1];

  const handleSelectPlan = async (plan: PlanDefinition) => {
    setSelectedPlanId(plan.id);
    setUpdating(true);

    try {
      const updatedConfig: TenantConfig = {
        ...currentConfig,
        subscription: {
          ...currentConfig.subscription,
          plan: plan.name,
          limits: {
            ...plan.limits,
            modules: ['all'],
          },
        },
      };

      // Save via port
      const saved = await defaultPorts.tenants.save(ctx, updatedConfig);

      // Record snapshot
      await defaultPorts.snapshots.recordSnapshot(
        ctx,
        `Subscription tier upgraded to ${plan.name} (${plan.limits.records} records, ${plan.limits.users} seats)`,
        'subscription.tier_change',
        saved
      );

      // Record audit log
      await defaultPorts.audit.record(ctx, {
        actorId: ctx.userId,
        actorName: ctx.role === 'business_admin' ? 'Business Owner' : 'Platform Administrator',
        action: 'update',
        entityKey: 'subscription',
        entityId: saved.id,
        diff: {
          changes: [
            `Subscription tier modified from '${currentConfig.subscription?.plan}' to '${plan.name}'`,
          ],
        },
      });

      onPlanUpdated(saved);
      onClose();
    } catch (err) {
      console.error('Failed to update plan tier:', err);
      alert('Failed to update subscription tier.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/70">
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-slate-900">Subscription Plans & Quota Capacity</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose the right tier for {currentConfig.name}. Changes take effect immediately.
            </p>
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
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Plan Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {AVAILABLE_PLANS.map((plan) => {
              const isCurrent =
                currentConfig.subscription?.plan?.toLowerCase().includes(plan.id) ||
                (plan.id === 'growth' && !currentConfig.subscription?.plan);

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl border p-5 flex flex-col justify-between transition relative ${
                    isCurrent
                      ? 'border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-3 right-4 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                      {plan.badge}
                    </span>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-base font-bold text-slate-900">{plan.name}</h4>
                      {isCurrent && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          Current Tier
                        </span>
                      )}
                    </div>

                    <div className="mb-3">
                      <span className="text-2xl font-black text-slate-900">
                        ${plan.priceMonthly}
                      </span>
                      <span className="text-xs text-slate-500"> / month</span>
                    </div>

                    <p className="text-xs text-slate-600 mb-4 min-h-[36px]">
                      {plan.description}
                    </p>

                    {/* Capacity Summary */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs mb-4">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Records Limit:</span>
                        <span className="font-bold text-slate-900">
                          {plan.limits.records.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Staff Seats:</span>
                        <span className="font-bold text-slate-900">{plan.limits.users} seats</span>
                      </div>
                    </div>

                    {/* Feature list */}
                    <ul className="space-y-2 text-xs text-slate-600 mb-6">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    disabled={updating || isCurrent}
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-1.5 ${
                      isCurrent
                        ? 'bg-slate-100 text-slate-500 cursor-default'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                    }`}
                  >
                    {isCurrent ? (
                      <span>Active Tier</span>
                    ) : updating ? (
                      <span>Switching...</span>
                    ) : (
                      <>
                        <span>Select {plan.name}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Guarantee Note */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start space-x-3 text-xs text-slate-600">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800">Fair Capacity Guarantee</span>
              <p className="mt-0.5 text-slate-500">
                You can adjust tiers anytime. When upgrading, higher record limits and additional staff seats are provisioned instantly without downtime.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
