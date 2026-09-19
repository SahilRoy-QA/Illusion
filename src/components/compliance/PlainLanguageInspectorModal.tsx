/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  X,
  Sparkles,
  Wand2,
  RefreshCw,
  Search,
  BookOpen,
  ArrowRight,
  FileCheck,
  Sliders,
  Building2,
} from 'lucide-react';
import { RequestContext } from '../../types/context.ts';
import { TenantConfig } from '../../types/config.ts';
import { defaultPorts } from '../../data/index.ts';
import {
  scanText,
  scanTenantConfig,
  remediateTenantConfig,
  JargonMatch,
  TenantJargonReport,
} from '../../utils/jargonScanner.ts';
import { BANNED_TERMS, TERM_REPLACEMENTS } from '../../copy/bannedTerms.ts';

interface PlainLanguageInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTenant: TenantConfig;
  ctx: RequestContext;
  onTenantUpdated?: (updated: TenantConfig) => void;
}

export function PlainLanguageInspectorModal({
  isOpen,
  onClose,
  activeTenant,
  ctx,
  onTenantUpdated,
}: PlainLanguageInspectorModalProps) {
  const [activeTab, setActiveTab] = useState<'scan' | 'interactive' | 'dictionary'>('scan');
  const [testText, setTestText] = useState('Add new patient entity with regex format and store in database');
  const [testMatches, setTestMatches] = useState<JargonMatch[]>([]);
  const [activeReport, setActiveReport] = useState<TenantJargonReport | null>(null);
  const [fleetReports, setFleetReports] = useState<TenantJargonReport[]>([]);
  const [isScanningFleet, setIsScanningFleet] = useState(false);
  const [isApplyingFixes, setIsApplyingFixes] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Scan active tenant on open or update
  useEffect(() => {
    if (activeTenant) {
      const report = scanTenantConfig(activeTenant);
      setActiveReport(report);
    }
  }, [activeTenant]);

  // Scan live tester text
  useEffect(() => {
    setTestMatches(scanText(testText, 'Interactive Text Area'));
  }, [testText]);

  // Scan Fleet if super admin
  const handleScanFleet = async () => {
    setIsScanningFleet(true);
    try {
      const allTenants = await defaultPorts.tenants.listAll(ctx);
      const reports = allTenants.map((t: TenantConfig) => scanTenantConfig(t));
      setFleetReports(reports);
    } catch (err) {
      console.error('Failed to scan fleet', err);
    } finally {
      setIsScanningFleet(false);
    }
  };

  useEffect(() => {
    if (isOpen && ctx.role === 'super_admin') {
      handleScanFleet();
    }
  }, [isOpen, ctx.role]);

  // 1-Click Auto Remediation for active tenant
  const handleApplyRemediation = async () => {
    if (!activeTenant) return;
    setIsApplyingFixes(true);
    try {
      const { remediated, changesCount, remediatedFields } = remediateTenantConfig(activeTenant);
      if (changesCount === 0) {
        setSuccessMessage('Workspace is already 100% compliant with Plain-Language standards.');
        setTimeout(() => setSuccessMessage(null), 4000);
        return;
      }

      await defaultPorts.tenants.save(ctx, remediated);
      const updatedReport = scanTenantConfig(remediated);
      setActiveReport(updatedReport);
      if (onTenantUpdated) {
        onTenantUpdated(remediated);
      }

      setSuccessMessage(
        `Successfully cleaned ${changesCount} technical term${changesCount === 1 ? '' : 's'} across: ${remediatedFields.slice(0, 3).join(', ')}${remediatedFields.length > 3 ? ' and more' : ''}.`
      );
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      console.error('Failed to apply remediation', err);
    } finally {
      setIsApplyingFixes(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold">Plain-Language Compliance Inspector</h3>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  ADR 002
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Zero Technical Jargon Guarantee for Non-Technical Business Owners
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 space-x-6 text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('scan')}
            className={`pb-3 border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'scan'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Workspace Audit</span>
            {activeReport && activeReport.totalViolations > 0 && (
              <span className="bg-amber-100 text-amber-800 text-xs px-1.5 py-0.5 rounded-full font-bold">
                {activeReport.totalViolations}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('interactive')}
            className={`pb-3 border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'interactive'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            <span>Interactive Copy Tester</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dictionary')}
            className={`pb-3 border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'dictionary'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Banned Terms Dictionary ({BANNED_TERMS.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center space-x-2 text-sm font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: WORKSPACE AUDIT */}
          {activeTab === 'scan' && (
            <div className="space-y-6">
              {/* Scorecard */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl ${
                      activeReport && activeReport.totalViolations === 0
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-100 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {activeReport && activeReport.totalViolations === 0 ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      {activeTenant.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {activeReport && activeReport.totalViolations === 0
                        ? '100% Plain-Language Compliant. Zero technical jargon detected.'
                        : `${activeReport?.totalViolations} technical jargon occurrences detected in customizable labels.`}
                    </p>
                  </div>
                </div>

                {activeReport && activeReport.totalViolations > 0 && (
                  <button
                    type="button"
                    onClick={handleApplyRemediation}
                    disabled={isApplyingFixes}
                    className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-xs transition"
                  >
                    {isApplyingFixes ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>Apply 1-Click Plain English Fixes</span>
                  </button>
                )}
              </div>

              {/* Detected Violations List */}
              {activeReport && activeReport.matches.length > 0 ? (
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Detected Jargon & Suggested Plain-Language Substitutes
                  </h5>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {activeReport.matches.map((m) => (
                      <div key={m.id} className="p-3.5 bg-white hover:bg-slate-50/60 transition">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {m.location}
                          </span>
                          <div className="flex items-center space-x-1.5 text-xs font-medium">
                            <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded-full border border-red-200 font-mono">
                              "{m.term}"
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                            <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
                              "{m.replacement}"
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-slate-600">
                          <span className="text-slate-400">Current: </span>
                          <span className="font-mono text-slate-800">{m.originalText}</span>
                        </div>
                        <div className="text-xs text-emerald-700 mt-1">
                          <span className="text-slate-400">Proposed: </span>
                          <span className="font-medium">{m.suggestedText}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                  <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                  <h5 className="text-base font-bold text-slate-900">
                    Pristine Non-Technical Copy
                  </h5>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Every custom record field, list name, website heading, and role title in this business uses warm, human-friendly words. No engineer-speak leaks through.
                  </p>
                </div>
              )}

              {/* Cross-Fleet Summary (For Super Admin) */}
              {ctx.role === 'super_admin' && (
                <div className="border-t border-slate-200 pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Fleet-Wide Plain Language Status
                    </h5>
                    <button
                      type="button"
                      onClick={handleScanFleet}
                      disabled={isScanningFleet}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-1"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isScanningFleet ? 'animate-spin' : ''}`} />
                      <span>Re-scan Fleet</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {fleetReports.map((fr) => (
                      <div
                        key={fr.tenantId}
                        className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {fr.tenantName}
                          </span>
                          {fr.totalViolations === 0 ? (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                              Compliant
                            </span>
                          ) : (
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                              {fr.totalViolations} Issues
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INTERACTIVE TESTER */}
          {activeTab === 'interactive' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Type or Paste Business Copy to Test
                </label>
                <textarea
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  rows={4}
                  className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g. Add custom patient entity with boolean flags..."
                />
              </div>

              {testMatches.length > 0 ? (
                <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl space-y-3">
                  <div className="flex items-center space-x-2 text-amber-900 font-semibold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>{testMatches.length} Banned Technical Term{testMatches.length === 1 ? '' : 's'} Found</span>
                  </div>

                  <div className="space-y-2">
                    {testMatches.map((m, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-amber-200 text-xs"
                      >
                        <div>
                          <span className="font-mono text-red-600 font-bold">"{m.term}"</span>
                          <span className="text-slate-500 mx-2">should be replaced with</span>
                          <span className="font-bold text-emerald-700">"{m.replacement}"</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setTestText(testText.replace(new RegExp(`\\b${m.term}\\b`, 'g'), m.replacement));
                          }}
                          className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium px-2 py-1 rounded text-xs transition"
                        >
                          Replace
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-amber-200 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        let replaced = testText;
                        for (const m of testMatches) {
                          replaced = replaced.replace(new RegExp(`\\b${m.term}\\b`, 'gi'), m.replacement);
                        }
                        setTestText(replaced);
                      }}
                      className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Replace All with Plain English</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-800 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>No banned technical jargon in this text! It is completely friendly for Priya and Dr. Amit.</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BANNED TERMS DICTIONARY */}
          {activeTab === 'dictionary' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                <p className="font-bold text-slate-800 mb-1">Architectural Decision ADR 002 Policy:</p>
                Non-technical small business owners must never be confronted with raw engineering vocabulary. All software concepts are mapped to natural business metaphors.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BANNED_TERMS.map((term) => (
                  <div
                    key={term}
                    className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-mono font-bold text-red-600 line-through">
                        {term}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">Banned jargon</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-700">
                        "{TERM_REPLACEMENTS[term] || 'plain phrase'}"
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">Friendly substitute</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Enforces Invariant 3 (No-Code Guarantee) & ADR 002
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
