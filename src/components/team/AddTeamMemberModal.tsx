/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, UserPlus, Mail, User, Shield, Briefcase, Check } from 'lucide-react';
import { TenantConfig } from '../../types/config.ts';
import { RequestContext, UserAccount } from '../../types/context.ts';
import { defaultPorts } from '../../data/index.ts';

interface AddTeamMemberModalProps {
  isOpen: boolean;
  config: TenantConfig;
  ctx: RequestContext;
  onClose: () => void;
  onMemberAdded: (user: UserAccount) => void;
}

export function AddTeamMemberModal({
  isOpen,
  config,
  ctx,
  onClose,
  onMemberAdded,
}: AddTeamMemberModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'business_admin' | 'staff'>('staff');
  const [customRoleLabel, setCustomRoleLabel] = useState(
    config.entities[0]?.singular ? `${config.entities[0].singular} Specialist` : 'Staff Member'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setError('Please provide both full name and a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newUser = await defaultPorts.users.save(ctx, {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        role,
        customRoleLabel: customRoleLabel.trim() || undefined,
        tenantId: config.id,
        active: true,
      });

      // Immutable audit log
      await defaultPorts.audit.record(ctx, {
        actorId: ctx.userId,
        actorName: ctx.role === 'super_admin' ? 'Platform Administrator' : 'Business Owner',
        action: 'create',
        entityKey: 'team_member',
        entityId: newUser.id,
        diff: {
          changes: [
            `Invited new team member: ${newUser.fullName} (${newUser.email}) as ${newUser.customRoleLabel || newUser.role}`,
          ],
        },
      });

      onMemberAdded(newUser);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to provision team member');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Add Team Member</h3>
              <p className="text-[11px] text-slate-500">Invite staff to {config.name}</p>
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Full Name *</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Dr. Kavita Roy or Sarah Jenkins"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Email Address *</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah@business.com"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>Access Level & Role</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('staff')}
                className={`p-3 rounded-xl border text-left transition ${
                  role === 'staff'
                    ? 'border-sky-600 bg-sky-50/50 text-sky-900 ring-1 ring-sky-600'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>Staff Member</span>
                  {role === 'staff' && <Check className="w-3.5 h-3.5 text-sky-600" />}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Granular plain permissions</p>
              </button>

              <button
                type="button"
                onClick={() => setRole('business_admin')}
                className={`p-3 rounded-xl border text-left transition ${
                  role === 'business_admin'
                    ? 'border-sky-600 bg-sky-50/50 text-sky-900 ring-1 ring-sky-600'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>Co-Owner / Admin</span>
                  {role === 'business_admin' && <Check className="w-3.5 h-3.5 text-sky-600" />}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Full operational authority</p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              <span>Display Job Title</span>
            </label>
            <input
              type="text"
              value={customRoleLabel}
              onChange={(e) => setCustomRoleLabel(e.target.value)}
              placeholder="e.g. Lead Physiotherapist or Hair Stylist"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Inviting...' : 'Confirm & Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
