/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Save,
  Check,
  AlertCircle,
  Clock,
  Coins,
  Shield,
  Palette,
  CheckCircle2,
  Calendar,
  Sliders,
  Percent,
  Sparkles,
  HardDrive,
  FolderArchive,
} from 'lucide-react';
import { TenantConfig, BusinessHours } from '../../types/config.ts';
import { RequestContext } from '../../types/context.ts';
import { defaultPorts } from '../../data/index.ts';
import { can } from '../../utils/permissions.ts';
import { PlanTierModal } from './PlanTierModal.tsx';
import { DataPortabilitySection } from './DataPortabilitySection.tsx';

interface BusinessSettingsEditorProps {
  config: TenantConfig;
  ctx: RequestContext;
  onConfigSaved: (updated: TenantConfig) => void;
}

const PRESET_COLORS = [
  { name: 'Sky Blue', hex: '#0284c7' },
  { name: 'Rose Pink', hex: '#db2777' },
  { name: 'Warm Amber', hex: '#d97706' },
  { name: 'Emerald Green', hex: '#059669' },
  { name: 'Indigo Violet', hex: '#4f46e5' },
  { name: 'Slate Gray', hex: '#475569' },
];

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const;

export function BusinessSettingsEditor({
  config,
  ctx,
  onConfigSaved,
}: BusinessSettingsEditorProps) {
  // General Profile
  const [name, setName] = useState(config.name);
  const [phone, setPhone] = useState(config.profile.phone || '');
  const [email, setEmail] = useState(config.profile.email || '');
  const [address, setAddress] = useState(config.profile.address || '');
  const [taxRate, setTaxRate] = useState<number>(config.profile.taxRate ?? 0);

  // Branding
  const [primaryColor, setPrimaryColor] = useState(config.branding?.primary || '#0284c7');
  const [buttonStyle, setButtonStyle] = useState<'solid' | 'soft' | 'outline'>(
    config.branding?.buttonStyle || 'solid'
  );
  const [radius, setRadius] = useState<'none' | 'sm' | 'md' | 'lg' | 'xl'>(
    config.branding?.radius || 'md'
  );
  const [loginHeadline, setLoginHeadline] = useState(
    config.branding?.loginHeadline || `Welcome to ${config.name}`
  );

  // Business Operating Hours
  const [hours, setHours] = useState<BusinessHours>(
    config.profile.hours || {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '10:00', close: '16:00', closed: false },
      sunday: { open: '10:00', close: '14:00', closed: true },
    }
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'profile' | 'portability'>('profile');

  const canEdit =
    can(ctx, 'tenant.edit_branding') ||
    ctx.role === 'business_admin' ||
    ctx.role === 'super_admin';

  const handleHourChange = (
    day: keyof BusinessHours,
    field: 'open' | 'close' | 'closed',
    value: string | boolean
  ) => {
    setHours((prev) => {
      const currentDay = prev[day] || { open: '09:00', close: '18:00', closed: false };
      return {
        ...prev,
        [day]: {
          ...currentDay,
          [field]: value,
        },
      };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Business name cannot be blank.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      // Invariant 13 & Invariant 3: snapshot before structural change
      await defaultPorts.snapshots.recordSnapshot(
        ctx,
        'Updated business contact details, branding & operating hours',
        'settings_update',
        config
      );

      const updated: TenantConfig = {
        ...config,
        name: name.trim(),
        profile: {
          ...config.profile,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          taxRate: isNaN(taxRate) ? 0 : Number(taxRate),
          hours,
        },
        branding: {
          ...config.branding,
          primary: primaryColor,
          buttonStyle,
          radius,
          loginHeadline: loginHeadline.trim() || undefined,
        },
      };

      const saved = await defaultPorts.tenants.save(ctx, updated);
      onConfigSaved(saved);
      setMessage({ type: 'success', text: 'Business settings and operating preferences updated.' });
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to save settings.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-sky-600" />
            <span>Business Profile & Operations</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure contact details, branding design, operating schedule, and taxation parameters.
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 transition shadow-xs disabled:opacity-50 shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        )}
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center space-x-2.5 ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Sub-navigation Tabs */}
      <div className="flex items-center space-x-3 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSection('profile')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition ${
            activeSection === 'profile'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Profile, Branding & Operations</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('portability')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition ${
            activeSection === 'portability'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FolderArchive className="w-3.5 h-3.5" />
          <span>Data Portability & Backup Archive</span>
        </button>
      </div>

      {activeSection === 'portability' ? (
        <DataPortabilitySection
          config={config}
          ctx={ctx}
          onConfigSaved={onConfigSaved}
        />
      ) : (
        /* Settings Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-slate-500" />
              <span>General Information</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Business Name *
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Contact Phone</span>
                </label>
                <input
                  type="tel"
                  disabled={!canEdit}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Public Contact Email</span>
                </label>
                <input
                  type="email"
                  disabled={!canEdit}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@business.com"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Physical Address & Location</span>
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Suite 402, Sunshine Plaza, Bandra West, Mumbai"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1.5">
                  <Percent className="w-3.5 h-3.5 text-slate-400" />
                  <span>Default Tax Rate (%)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  disabled={!canEdit}
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  placeholder="5"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Brand Design Customization */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Palette className="w-4 h-4 text-slate-500" />
                <span>Visual Branding & Theme</span>
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Primary Accent Color
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => setPrimaryColor(c.hex)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition border-2 ${
                        primaryColor.toLowerCase() === c.hex.toLowerCase()
                          ? 'border-slate-900 scale-105 shadow-xs'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {primaryColor.toLowerCase() === c.hex.toLowerCase() && (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Interface Corner Softness
                  </label>
                  <select
                    disabled={!canEdit}
                    value={radius}
                    onChange={(e) => setRadius(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="none">Square (none)</option>
                    <option value="sm">Subtle (small)</option>
                    <option value="md">Rounded (medium)</option>
                    <option value="lg">Soft (large)</option>
                    <option value="xl">Pill (extra-large)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Button Styling
                  </label>
                  <select
                    disabled={!canEdit}
                    value={buttonStyle}
                    onChange={(e) => setButtonStyle(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="solid">Solid Fill</option>
                    <option value="soft">Soft Pastel</option>
                    <option value="outline">Outlined</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Portal Login Headline
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={loginHeadline}
                  onChange={(e) => setLoginHeadline(e.target.value)}
                  placeholder="Welcome to our business portal"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Operating Hours Configuration */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span>Business Operating Schedule</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Used by the public booking scheduler and client consultation portal.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                {DAYS_OF_WEEK.map(({ key, label }) => {
                  const schedule = hours[key] || { open: '09:00', close: '18:00', closed: false };
                  const isClosed = schedule.closed ?? false;

                  return (
                    <div
                      key={key}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition gap-2 sm:gap-4"
                    >
                      <div className="flex items-center space-x-3 w-32">
                        <input
                          type="checkbox"
                          id={`closed-${key}`}
                          disabled={!canEdit}
                          checked={!isClosed}
                          onChange={(e) => handleHourChange(key, 'closed', !e.target.checked)}
                          className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                        />
                        <label
                          htmlFor={`closed-${key}`}
                          className={`text-xs font-semibold cursor-pointer ${
                            isClosed ? 'text-slate-400 line-through' : 'text-slate-800'
                          }`}
                        >
                          {label}
                        </label>
                      </div>

                      {isClosed ? (
                        <span className="text-xs font-medium text-slate-400 py-1 sm:text-right">
                          Closed / Off
                        </span>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <input
                            type="time"
                            disabled={!canEdit}
                            value={schedule.open || '09:00'}
                            onChange={(e) => handleHourChange(key, 'open', e.target.value)}
                            className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                          />
                          <span className="text-xs text-slate-400">to</span>
                          <input
                            type="time"
                            disabled={!canEdit}
                            value={schedule.close || '18:00'}
                            onChange={(e) => handleHourChange(key, 'close', e.target.value)}
                            className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </form>
        </div>

        {/* Right 1 Col: Fixed Regional & Subscription Info */}
        <div className="space-y-6">
          {/* Regional Settings Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-sky-600" />
              <span>Regional Preferences</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Web Address</span>
                <span className="font-mono font-semibold text-slate-800">/{config.slug}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Currency</span>
                <span className="font-semibold text-slate-800 flex items-center space-x-1">
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    {config.profile.currency} ({config.profile.locale})
                  </span>
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Local Timezone</span>
                <span className="font-semibold text-slate-800">{config.profile.timezone}</span>
              </div>
            </div>
          </div>

          {/* Subscription & Limits Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Subscription Plan</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {config.subscription?.status === 'active' ? 'Active' : config.subscription?.status}
              </span>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Current Plan</span>
                <span className="font-bold text-slate-900">
                  {config.subscription?.plan || 'Growth Tier'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Record Capacity</span>
                <span className="font-bold text-slate-900">
                  {config.subscription?.usage.records} / {config.subscription?.limits.records}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Team Seats</span>
                <span className="font-bold text-slate-900">
                  {config.subscription?.usage.users} / {config.subscription?.limits.users}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPlanModalOpen(true)}
              className="w-full mt-2 py-2 px-3 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/70 text-indigo-700 text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Change Subscription Tier</span>
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Subscription Plans Modal */}
      <PlanTierModal
        isOpen={isPlanModalOpen}
        currentConfig={config}
        ctx={ctx}
        onPlanUpdated={onConfigSaved}
        onClose={() => setIsPlanModalOpen(false)}
      />
    </div>
  );
}
