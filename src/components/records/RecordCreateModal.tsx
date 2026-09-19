/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RequestContext } from '../../types/context.ts';
import { TenantConfig, EntityDef } from '../../types/config.ts';
import { DynamicRecord } from '../../types/records.ts';
import { defaultPorts } from '../../data/index.ts';
import { can } from '../../utils/permissions.ts';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

interface RecordCreateModalProps {
  isOpen: boolean;
  entity: EntityDef;
  config: TenantConfig;
  ctx: RequestContext;
  onClose: () => void;
  onRecordCreated: (newRecord: DynamicRecord) => void;
}

export const RecordCreateModal: React.FC<RecordCreateModalProps> = ({
  isOpen,
  entity,
  config,
  ctx,
  onClose,
  onRecordCreated,
}) => {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleChange = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Validate required fields
    for (const f of entity.fields) {
      if (f.required && !f.archived && f.type !== 'autoId') {
        const val = formData[f.key];
        if (val === undefined || val === null || val === '') {
          setErrorMessage(`Please provide a value for ${f.label}.`);
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      // Generate autoId if present
      const autoIdField = entity.fields.find((f) => f.type === 'autoId');
      const recordData = { ...formData };

      if (autoIdField) {
        const seq = await defaultPorts.sequences.getNextSequence(ctx, `${entity.key}_seq`);
        const year = new Date().getFullYear();
        const paddedSeq = String(seq).padStart(4, '0');
        recordData[autoIdField.key] = `${entity.singular.slice(0, 3).toUpperCase()}-${year}-${paddedSeq}`;
      }

      const newRec = await defaultPorts.records.save(ctx, entity.key, {
        data: recordData,
      });

      // Audit log
      await defaultPorts.audit.record(ctx, {
        actorId: ctx.userId,
        actorName: ctx.role === 'business_admin' ? 'Business Owner' : 'Staff Member',
        action: 'create',
        entityKey: entity.key,
        entityId: newRec.id,
        diff: {
          changes: [`Created new ${entity.singular} record`],
        },
      });

      onRecordCreated(newRec);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to save record.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Add New {entity.singular}</h3>
            <p className="text-xs text-slate-500">Fill in the fields configured for this business.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMessage && (
            <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-800 ring-1 ring-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {entity.fields
              .filter((f) => !f.archived && f.type !== 'autoId')
              .map((field) => {
                const isFull = field.type === 'textarea' || field.width === 'full';
                return (
                  <div key={field.key} className={isFull ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      {field.label} {field.required && <span className="text-rose-500">*</span>}
                    </label>

                    {field.type === 'textarea' ? (
                      <textarea
                        rows={3}
                        value={(formData[field.key] as string) || ''}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                      />
                    ) : field.type === 'select' ? (
                      <select
                        value={(formData[field.key] as string) || ''}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                      >
                        <option value="">Select an option...</option>
                        {field.options?.map((opt) => (
                          <option key={opt.value} value={opt.label}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'checkbox' ? (
                      <label className="flex items-center gap-2 mt-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!formData[field.key]}
                          onChange={(e) => handleChange(field.key, e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                        />
                        <span className="text-xs text-slate-800">Yes / Active</span>
                      </label>
                    ) : field.type === 'barcode' ? (
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          placeholder="Scan or enter barcode..."
                          value={(formData[field.key] as string) || ''}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2 pr-20 text-sm font-mono text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const generated = '890' + Math.floor(100000000 + Math.random() * 900000000);
                            handleChange(field.key, generated);
                          }}
                          className="absolute right-1.5 px-2 py-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200"
                          title="Generate standard EAN-13 barcode"
                        >
                          Generate
                        </button>
                      </div>
                    ) : (
                      <input
                        type={
                          field.type === 'number' || field.type === 'currency'
                            ? 'number'
                            : field.type === 'date'
                            ? 'date'
                            : field.type === 'email'
                            ? 'email'
                            : 'text'
                        }
                        value={(formData[field.key] as string) || ''}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                      />
                    )}

                    {field.helpText && (
                      <p className="mt-1 text-[11px] text-slate-500">{field.helpText}</p>
                    )}
                    {field.hsnOrSac && (
                      <p className="mt-1 text-[11px] text-emerald-700 font-medium">
                        Tax code: {field.hsnOrSac} {field.taxRate ? `(${field.taxRate}% GST)` : ''}
                      </p>
                    )}
                    {field.sensitive && (
                      <p className="mt-1 text-[11px] text-amber-700">
                        🔒 Confidential field. Masked for staff without special permissions.
                      </p>
                    )}
                  </div>
                );
              })}
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : `Save ${entity.singular}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
