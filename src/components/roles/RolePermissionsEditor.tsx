/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  Check,
  Mail,
  MoreVertical,
  UserCheck,
  UserX,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { TenantConfig } from '../../types/config.ts';
import { RequestContext, UserAccount } from '../../types/context.ts';
import { plainPermissions, rolesCopy } from '../../copy/roles.ts';
import { commonCopy } from '../../copy/common.ts';
import { defaultPorts } from '../../data/index.ts';
import { AddTeamMemberModal } from '../team/AddTeamMemberModal.tsx';

interface RolePermissionsEditorProps {
  config: TenantConfig;
  ctx: RequestContext;
  onConfigSaved: (updated: TenantConfig) => void;
}

export const RolePermissionsEditor: React.FC<RolePermissionsEditorProps> = ({
  config,
  ctx,
  onConfigSaved,
}) => {
  const [subView, setSubView] = useState<'members' | 'permissions'>('members');
  const [members, setMembers] = useState<UserAccount[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Permission editor state
  const defaultRoleTitle = config.entities[0]?.singular
    ? `${config.entities[0].singular} Coordinator`
    : 'Team Member';

  const [activeRole, setActiveRole] = useState<'business_admin' | 'staff'>('staff');
  const [roleCustomName, setRoleCustomName] = useState<string>(
    config.roleLabels?.staff || defaultRoleTitle
  );
  const [staffPermissions, setStaffPermissions] = useState<Set<string>>(
    new Set(['records.view', 'records.create', 'records.edit', 'billing.create'])
  );
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const list = await defaultPorts.users.listByTenant(ctx);
      setMembers(list);
    } catch (err) {
      console.error('Failed to load team members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [config.id, ctx.tenantId]);

  const togglePermission = (key: string) => {
    const next = new Set(staffPermissions);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setStaffPermissions(next);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedConfig: TenantConfig = {
        ...config,
        roleLabels: {
          ...config.roleLabels,
          staff: roleCustomName,
        },
      };

      await defaultPorts.tenants.save(ctx, updatedConfig);
      await defaultPorts.snapshots.recordSnapshot(
        ctx,
        `Updated permissions and title for ${roleCustomName}`,
        'roles.update',
        updatedConfig
      );

      onConfigSaved(updatedConfig);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch {
      // Fallback
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (member: UserAccount) => {
    try {
      const updated = await defaultPorts.users.save(ctx, {
        id: member.id,
        active: !member.active,
      });

      await defaultPorts.audit.record(ctx, {
        actorId: ctx.userId,
        actorName: ctx.role === 'super_admin' ? 'Platform Administrator' : 'Business Owner',
        action: 'update',
        entityKey: 'team_member',
        entityId: member.id,
        diff: {
          changes: [
            `${member.fullName} access ${updated.active ? 'reactivated' : 'temporarily suspended'}`,
          ],
        },
      });

      setMembers((prev) => prev.map((m) => (m.id === member.id ? updated : m)));
    } catch (err) {
      console.error('Failed to update member status:', err);
    }
  };

  const categories = ['records', 'billing', 'team', 'settings'] as const;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Sub-views */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Users className="w-5 h-5 text-sky-600" />
            <span>Team Staff & Access Permissions</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage organization members, custom job titles, and plain-sentence security permissions.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setSubView('members')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                subView === 'members'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Team Directory ({members.length})
            </button>
            <button
              type="button"
              onClick={() => setSubView('permissions')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                subView === 'permissions'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Role Matrix
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 transition shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite Member</span>
          </button>
        </div>
      </div>

      {/* Subview 1: Team Directory List */}
      {subView === 'members' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Current Organization Members</h3>
            <span className="text-xs text-slate-500">
              {members.filter((m) => m.active).length} Active · {members.filter((m) => !m.active).length} Suspended
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {members.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                No team members registered. Click &quot;Invite Member&quot; to add staff.
              </div>
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50 transition gap-4"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm shrink-0">
                      {member.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {member.fullName}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            member.role === 'super_admin'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : member.role === 'business_admin'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {member.customRoleLabel || member.role}
                        </span>
                        {!member.active && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            Suspended
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 flex items-center space-x-1.5 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{member.email}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {member.role !== 'super_admin' && (
                      <button
                        type="button"
                        onClick={() => handleToggleActive(member)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition border ${
                          member.active
                            ? 'border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-600'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {member.active ? 'Suspend' : 'Reactivate'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Subview 2: Plain-Sentence Permission Matrix */}
      {subView === 'permissions' && (
        <div className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200 sm:p-8 space-y-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-base font-semibold text-slate-900">{rolesCopy.title}</h3>
              <p className="mt-1 text-xs text-slate-500">{rolesCopy.subtitle}</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setActiveRole('staff')}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
                  activeRole === 'staff'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Staff & Assistants
              </button>
              <button
                type="button"
                onClick={() => setActiveRole('business_admin')}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
                  activeRole === 'business_admin'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Business Owner
              </button>
            </div>
          </div>

          {activeRole === 'business_admin' ? (
            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-blue-900">Owner Full Access</h3>
                  <p className="mt-1 text-sm text-blue-800 leading-relaxed">
                    {rolesCopy.adminRoleNotice}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-100/80 px-3 py-1.5 text-xs font-medium text-blue-900">
                    <Check className="h-3.5 w-3.5 text-blue-700" />
                    All customer records, billing, team settings, and confidential notes are fully accessible.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  {rolesCopy.roleNameLabel}
                </label>
                <div className="mt-1.5 flex max-w-md items-center gap-2">
                  <input
                    type="text"
                    value={roleCustomName}
                    onChange={(e) => setRoleCustomName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-500">{rolesCopy.roleNameHelp}</p>
              </div>

              <div className="space-y-6">
                {categories.map((catKey) => {
                  const perms = plainPermissions.filter((p) => p.category === catKey);
                  const catLabel = perms[0]?.categoryLabel || catKey;
                  return (
                    <div key={catKey} className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {catLabel}
                      </h4>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {perms.map((perm) => {
                          const isEnabled = staffPermissions.has(perm.key);
                          return (
                            <div
                              key={perm.key}
                              className={`flex items-start justify-between rounded-xl border p-4 transition ${
                                isEnabled
                                  ? 'border-indigo-200 bg-indigo-50/30'
                                  : 'border-slate-200 bg-white opacity-85'
                              }`}
                            >
                              <div className="pr-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-slate-900">
                                    {perm.sentence}
                                  </span>
                                  {perm.sensitive && (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-800">
                                      <ShieldAlert className="h-3 w-3 text-rose-600" />
                                      Confidential
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                                  {perm.description}
                                </p>
                              </div>

                              <label className="relative inline-flex cursor-pointer items-center shrink-0">
                                <input
                                  type="checkbox"
                                  checked={isEnabled}
                                  onChange={() => togglePermission(perm.key)}
                                  className="peer sr-only"
                                />
                                <div className="h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-indigo-600 peer-focus:outline-hidden peer-focus:ring-2 peer-focus:ring-indigo-300 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 pt-5">
                <div>
                  {saveSuccess && (
                    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                      <Check className="h-4 w-4" />
                      Role settings saved and versioned.
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-slate-800 disabled:opacity-50"
                >
                  {isSaving ? commonCopy.loading : rolesCopy.saveRoleChanges}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Team Member Modal */}
      <AddTeamMemberModal
        isOpen={isAddModalOpen}
        config={config}
        ctx={ctx}
        onClose={() => setIsAddModalOpen(false)}
        onMemberAdded={(newMember) => {
          setMembers((prev) => [...prev, newMember]);
        }}
      />
    </div>
  );
};
