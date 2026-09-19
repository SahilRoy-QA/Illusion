/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RequestContext } from '../../types/context.ts';
import { TenantConfig } from '../../types/config.ts';
import { defaultPorts } from '../../data/index.ts';
import { businessArchetypes } from '../../config/archetypes.ts';
import { generateSlug, provisionTenant } from '../../config/provisioning.ts';
import { wizardCopy } from '../../copy/wizard.ts';
import { commonCopy } from '../../copy/common.ts';
import {
  Sparkles,
  Building2,
  HeartPulse,
  ShoppingBag,
  Folder,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  X,
  AlertCircle,
  Palette,
  Clock,
  Coins,
} from 'lucide-react';

interface CreateBusinessWizardProps {
  isOpen: boolean;
  ctx: RequestContext;
  onClose: () => void;
  onBusinessCreated: (newConfig: TenantConfig) => void;
}

export const CreateBusinessWizard: React.FC<CreateBusinessWizardProps> = ({
  isOpen,
  ctx,
  onClose,
  onBusinessCreated,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedType, setSelectedType] = useState<string>('clinic');

  // Step 2 Form
  const [businessName, setBusinessName] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState<boolean>(false);
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [timezone, setTimezone] = useState<string>('Asia/Kolkata');
  const [currency, setCurrency] = useState<string>('INR');
  const [ownerFullName, setOwnerFullName] = useState<string>('');

  // Step 3 Form
  const [primaryColor, setPrimaryColor] = useState<string>('#0284c7');
  const [radius, setRadius] = useState<'none' | 'sm' | 'md' | 'lg' | 'xl'>('md');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleTypeSelect = (typeKey: string) => {
    setSelectedType(typeKey);
    const arch = businessArchetypes.find((a) => a.key === typeKey);
    if (arch) {
      setPrimaryColor(arch.primaryColor);
      setCurrency(arch.defaultCurrency);
    }
  };

  const handleNameChange = (name: string) => {
    setBusinessName(name);
    if (!slugManuallyEdited) {
      setSlug(generateSlug(name));
    }
  };

  const handleSlugChange = (val: string) => {
    setSlugManuallyEdited(true);
    setSlug(val.toLowerCase().replace(/[^a-z0-9-]/g, ''));
  };

  const handleNextStep = () => {
    setErrorMessage('');
    if (step === 2) {
      if (!businessName.trim()) {
        setErrorMessage('Please enter the name of your business.');
        return;
      }
      if (!slug.trim() || slug.length < 3) {
        setErrorMessage('Please provide a valid web address (at least 3 characters).');
        return;
      }
    }
    setStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
  };

  const handleCreate = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const newConfig = await provisionTenant(ctx, defaultPorts, {
        businessTypeKey: selectedType,
        name: businessName,
        slug,
        phone,
        email,
        currency,
        timezone,
        primaryColor,
        radius,
        ownerFullName: ownerFullName || `${businessName} Owner`,
        ownerEmail: email || `contact@${slug}.com`,
      });

      // Switch context to new tenant
      await defaultPorts.auth.switchTenant(newConfig.id, 'business_admin');
      onBusinessCreated(newConfig);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to create business workspace. Please check your details.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getArchetypeIcon = (key: string) => {
    switch (key) {
      case 'clinic':
        return <HeartPulse className="h-6 w-6 text-sky-600" />;
      case 'salon':
        return <Sparkles className="h-6 w-6 text-pink-600" />;
      case 'retail':
        return <ShoppingBag className="h-6 w-6 text-amber-600" />;
      default:
        return <Folder className="h-6 w-6 text-indigo-600" />;
    }
  };

  const chosenArchetype = businessArchetypes.find((a) => a.key === selectedType) || businessArchetypes[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Step {step} of 4
            </span>
            <h2 className="text-lg font-bold text-slate-900">{wizardCopy.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Progression Bar */}
        <div className="grid grid-cols-4 border-b border-slate-100 bg-slate-50/50 text-center text-xs font-medium">
          <div
            className={`py-2 border-b-2 ${
              step >= 1 ? 'border-indigo-600 text-indigo-700 font-semibold' : 'border-transparent text-slate-400'
            }`}
          >
            1. Template
          </div>
          <div
            className={`py-2 border-b-2 ${
              step >= 2 ? 'border-indigo-600 text-indigo-700 font-semibold' : 'border-transparent text-slate-400'
            }`}
          >
            2. Details
          </div>
          <div
            className={`py-2 border-b-2 ${
              step >= 3 ? 'border-indigo-600 text-indigo-700 font-semibold' : 'border-transparent text-slate-400'
            }`}
          >
            3. Branding
          </div>
          <div
            className={`py-2 border-b-2 ${
              step >= 4 ? 'border-indigo-600 text-indigo-700 font-semibold' : 'border-transparent text-slate-400'
            }`}
          >
            4. Review
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {errorMessage && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-rose-50 p-3.5 text-xs text-rose-800 ring-1 ring-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Archetype selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{wizardCopy.step1Title}</h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">{wizardCopy.step1Subtitle}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2">
                {businessArchetypes.map((arch) => {
                  const isSelected = selectedType === arch.key;
                  return (
                    <button
                      key={arch.key}
                      type="button"
                      onClick={() => handleTypeSelect(arch.key)}
                      className={`flex flex-col items-start rounded-xl border p-4 text-left transition ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <div className="rounded-lg bg-slate-100 p-2">{getArchetypeIcon(arch.key)}</div>
                        {isSelected && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      <h4 className="mt-3 text-sm font-semibold text-slate-900">{arch.name}</h4>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">{arch.tagline}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Business details */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{wizardCopy.step2Title}</h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">{wizardCopy.step2Subtitle}</p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    {wizardCopy.businessNameLabel} *
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder={wizardCopy.businessNamePlaceholder}
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    {wizardCopy.webAddressLabel} *
                  </label>
                  <div className="mt-1 flex rounded-xl border border-slate-300 shadow-2xs focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder="sunrise-dental"
                      className="w-full rounded-l-xl border-none px-3.5 py-2 text-sm text-slate-900 focus:outline-hidden"
                    />
                    <span className="flex items-center rounded-r-xl bg-slate-100 px-3 text-xs text-slate-500">
                      .illusion.app
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{wizardCopy.webAddressHelp}</p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      {wizardCopy.phoneLabel}
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={wizardCopy.phonePlaceholder}
                      className="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      {wizardCopy.emailLabel}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={wizardCopy.emailPlaceholder}
                      className="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Owner Full Name
                  </label>
                  <input
                    type="text"
                    value={ownerFullName}
                    onChange={(e) => setOwnerFullName(e.target.value)}
                    placeholder="Dr. Samantha Rao"
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    A business owner account with full access will be created for this person.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Branding & Theme */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{wizardCopy.step3Title}</h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">{wizardCopy.step3Subtitle}</p>
              </div>

              <div className="space-y-6 pt-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                    {wizardCopy.primaryColorLabel}
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    {[
                      { hex: '#0284c7', label: 'Sky Blue' },
                      { hex: '#db2777', label: 'Rose Pink' },
                      { hex: '#d97706', label: 'Amber Gold' },
                      { hex: '#4f46e5', label: 'Indigo' },
                      { hex: '#059669', label: 'Emerald' },
                      { hex: '#475569', label: 'Slate' },
                    ].map((col) => (
                      <button
                        key={col.hex}
                        type="button"
                        onClick={() => setPrimaryColor(col.hex)}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition ${
                          primaryColor === col.hex
                            ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className="h-4 w-4 rounded-full border border-black/10"
                          style={{ backgroundColor: col.hex }}
                        />
                        <span>{col.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                    {wizardCopy.cornerStyleLabel}
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setRadius('none')}
                      className={`rounded-none border p-3 text-center text-xs font-medium ${
                        radius === 'none'
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-600'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      {wizardCopy.cornerSharp}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRadius('md')}
                      className={`rounded-lg border p-3 text-center text-xs font-medium ${
                        radius === 'md'
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-600'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      {wizardCopy.cornerSoft}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRadius('xl')}
                      className={`rounded-2xl border p-3 text-center text-xs font-medium ${
                        radius === 'xl'
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-600'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      {wizardCopy.cornerRounded}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      {wizardCopy.currencyLabel}
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-hidden"
                    >
                      <option value="INR">INR (₹ - Indian Rupee)</option>
                      <option value="USD">USD ($ - US Dollar)</option>
                      <option value="EUR">EUR (€ - Euro)</option>
                      <option value="GBP">GBP (£ - British Pound)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      {wizardCopy.timezoneLabel}
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-hidden"
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Review & Launch */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{wizardCopy.step4Subtitle}</h3>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <span className="text-xs text-slate-500">Business Name</span>
                  <span className="text-sm font-semibold text-slate-900">{businessName}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <span className="text-xs text-slate-500">Industry / Template</span>
                  <span className="text-xs font-medium text-slate-800">{chosenArchetype.name}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <span className="text-xs text-slate-500">Private Web Address</span>
                  <span className="text-xs font-mono font-medium text-indigo-700">
                    https://{slug}.illusion.app
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <span className="text-xs text-slate-500">Initial Owner Account</span>
                  <span className="text-xs font-medium text-slate-800">
                    {ownerFullName || 'Owner'} ({email || `contact@${slug}.com`})
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Currency & Timezone</span>
                  <span className="text-xs font-medium text-slate-800">
                    {currency} · {timezone}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-emerald-50 p-4 text-xs text-emerald-900 ring-1 ring-emerald-200">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold">Ready to Launch</span>
                    <p className="mt-0.5 leading-relaxed text-emerald-800">
                      When you click create, illusion will provision an isolated business workspace,
                      initialize your primary records schema, assign business ownership, and record version 1 in
                      your audit history.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {wizardCopy.previousStep}
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
            >
              <span>{wizardCopy.nextStep}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreate}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-medium text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{isSubmitting ? wizardCopy.creatingMessage : wizardCopy.launchButton}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
