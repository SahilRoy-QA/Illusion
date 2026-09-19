/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RequestContext } from '../../types/context.ts';
import { TenantConfig, EntityDef, FieldDef, FieldType } from '../../types/config.ts';
import { defaultPorts } from '../../data/index.ts';
import { schemaCopy } from '../../copy/schema.ts';
import { commonCopy } from '../../copy/common.ts';
import {
  Plus,
  Lock,
  Eye,
  CheckCircle2,
  Trash2,
  Edit2,
  AlertCircle,
  Archive,
  Layers,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface SchemaDesignerProps {
  config: TenantConfig;
  ctx: RequestContext;
  onConfigSaved: (updated: TenantConfig) => void;
}

export const SchemaDesigner: React.FC<SchemaDesignerProps> = ({
  config,
  ctx,
  onConfigSaved,
}) => {
  const [selectedEntityKey, setSelectedEntityKey] = useState<string>(
    config.entities[0]?.key || ''
  );
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<FieldDef | null>(null);

  // Form states for new/edited field
  const [label, setLabel] = useState('');
  const [type, setType] = useState<FieldType>('text');
  const [required, setRequired] = useState(false);
  const [sensitive, setSensitive] = useState(false);
  const [showInList, setShowInList] = useState(true);
  const [optionsText, setOptionsText] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const activeEntity = config.entities.find((e) => e.key === selectedEntityKey) || config.entities[0];

  const handleOpenNewField = () => {
    setEditingField(null);
    setLabel('');
    setType('text');
    setRequired(false);
    setSensitive(false);
    setShowInList(true);
    setOptionsText('');
    setStatusMessage('');
    setIsEditingModalOpen(true);
  };

  const handleOpenEditField = (f: FieldDef) => {
    setEditingField(f);
    setLabel(f.label);
    setType(f.type);
    setRequired(!!f.required);
    setSensitive(!!f.sensitive);
    setShowInList(!!f.showInList);
    setOptionsText(f.options ? f.options.map((o) => o.label).join('\n') : '');
    setStatusMessage('');
    setIsEditingModalOpen(true);
  };

  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    setIsSaving(true);
    try {
      // Invariant 2: Create a deep copy of config
      const updatedConfig: TenantConfig = JSON.parse(JSON.stringify(config));
      const targetEntity = updatedConfig.entities.find((ent) => ent.key === activeEntity.key);
      if (!targetEntity) return;

      const parsedOptions =
        type === 'select' || type === 'multiselect'
          ? optionsText
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean)
              .map((val) => ({
                value: val.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                label: val,
              }))
          : undefined;

      if (editingField) {
        // Editing existing field
        targetEntity.fields = targetEntity.fields.map((f) => {
          if (f.key === editingField.key) {
            return {
              ...f,
              label: label.trim(),
              type,
              required,
              sensitive,
              showInList,
              options: parsedOptions,
            };
          }
          return f;
        });
      } else {
        // Adding new field
        const generatedKey = `fld_${label
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .slice(0, 24)}_${Date.now().toString().slice(-4)}`;

        const newField: FieldDef = {
          key: generatedKey,
          label: label.trim(),
          type,
          required,
          sensitive,
          showInList,
          options: parsedOptions,
          order: targetEntity.fields.length + 1,
          width: 'half',
        };

        targetEntity.fields.push(newField);
        if (showInList && !targetEntity.listColumns.includes(generatedKey)) {
          targetEntity.listColumns.push(generatedKey);
        }
      }

      // Save to database
      await defaultPorts.tenants.save(ctx, updatedConfig);

      // Invariant 1: Record version history snapshot
      await defaultPorts.snapshots.recordSnapshot(
        ctx,
        editingField
          ? `Updated field "${label.trim()}" in ${activeEntity.singular}`
          : `Added custom field "${label.trim()}" to ${activeEntity.singular}`,
        'schema.field_change',
        updatedConfig
      );

      // Invariant 7: Audit log
      await defaultPorts.audit.record(ctx, {
        actorId: ctx.userId,
        actorName: 'Business Owner',
        action: editingField ? 'update' : 'create',
        entityKey: 'field_definition',
        entityId: editingField ? editingField.key : label,
        diff: {
          changes: [
            editingField
              ? `Modified schema field ${editingField.label}`
              : `Added new field "${label.trim()}" (${type})`,
          ],
        },
      });

      onConfigSaved(updatedConfig);
      setIsEditingModalOpen(false);
      setStatusMessage(schemaCopy.savedSuccess);
    } catch (err: unknown) {
      console.error(err);
      setStatusMessage('Could not save field settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchiveField = async (fieldKey: string) => {
    if (!confirm(schemaCopy.archiveFieldWarning)) return;

    try {
      const updatedConfig: TenantConfig = JSON.parse(JSON.stringify(config));
      const targetEntity = updatedConfig.entities.find((ent) => ent.key === activeEntity.key);
      if (!targetEntity) return;

      targetEntity.fields = targetEntity.fields.map((f) =>
        f.key === fieldKey ? { ...f, archived: true, showInList: false } : f
      );

      await defaultPorts.tenants.save(ctx, updatedConfig);

      // Record snapshot
      await defaultPorts.snapshots.recordSnapshot(
        ctx,
        `Archived field ${fieldKey} in ${activeEntity.singular}`,
        'schema.archive_field',
        updatedConfig
      );

      onConfigSaved(updatedConfig);
      setStatusMessage(schemaCopy.archivedSuccess);
    } catch (err: unknown) {
      console.error(err);
      setStatusMessage('Could not archive field.');
    }
  };

  if (!activeEntity) return null;

  return (
    <div className="space-y-6">
      {/* Entity Selector Header if business has multiple entities */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{schemaCopy.title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Managing information fields for{' '}
            <span className="font-semibold text-slate-800">{activeEntity.singular}</span> records.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNewField}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
        >
          <Plus className="h-4 w-4" />
          <span>{schemaCopy.addFieldButton}</span>
        </button>
      </div>

      {statusMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-900 ring-1 ring-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Fields List */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
          <thead className="bg-slate-50 font-semibold text-slate-600">
            <tr>
              <th className="px-5 py-3.5">Field Label</th>
              <th className="px-5 py-3.5">Type</th>
              <th className="px-5 py-3.5">Requirement</th>
              <th className="px-5 py-3.5">Confidentiality</th>
              <th className="px-5 py-3.5">Table Column</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {activeEntity.fields
              .filter((f) => !f.archived)
              .map((field) => {
                const isSystem = field.type === 'autoId';
                return (
                  <tr key={field.key} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{field.label}</span>
                        {isSystem && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 font-normal">
                            System
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-slate-600 capitalize">
                      {field.type}
                    </td>

                    <td className="px-5 py-3.5">
                      {field.required ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                          Mandatory
                        </span>
                      ) : (
                        <span className="text-slate-400">Optional</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      {field.sensitive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700">
                          <Lock className="h-3 w-3" />
                          <span>Confidential</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">Standard</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      {field.showInList ? (
                        <span className="text-emerald-700 font-medium">Visible</span>
                      ) : (
                        <span className="text-slate-400">Hidden</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditField(field)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        title="Edit Field"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      {!isSystem && (
                        <button
                          type="button"
                          onClick={() => handleArchiveField(field.key)}
                          className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                          title="Archive Field"
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Field Editor Modal */}
      {isEditingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingField ? schemaCopy.editFieldTitle : schemaCopy.newFieldTitle}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveField} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  {schemaCopy.fieldLabelLabel} *
                </label>
                <input
                  type="text"
                  required
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={schemaCopy.fieldLabelPlaceholder}
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  {schemaCopy.fieldTypeLabel}
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as FieldType)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="text">{schemaCopy.typeText}</option>
                  <option value="textarea">{schemaCopy.typeTextarea}</option>
                  <option value="number">{schemaCopy.typeNumber}</option>
                  <option value="currency">{schemaCopy.typeCurrency}</option>
                  <option value="email">{schemaCopy.typeEmail}</option>
                  <option value="phone">{schemaCopy.typePhone}</option>
                  <option value="date">{schemaCopy.typeDate}</option>
                  <option value="select">{schemaCopy.typeSelect}</option>
                  <option value="checkbox">{schemaCopy.typeCheckbox}</option>
                </select>
              </div>

              {type === 'select' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    {schemaCopy.optionsLabel}
                  </label>
                  <textarea
                    rows={3}
                    value={optionsText}
                    onChange={(e) => setOptionsText(e.target.value)}
                    placeholder={schemaCopy.optionsPlaceholder}
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              )}

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={required}
                    onChange={(e) => setRequired(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-medium text-slate-800">
                    {schemaCopy.requiredLabel}
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sensitive}
                    onChange={(e) => setSensitive(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-medium text-slate-800">
                    {schemaCopy.sensitiveLabel}
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showInList}
                    onChange={(e) => setShowInList(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-medium text-slate-800">
                    {schemaCopy.showInListLabel}
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingModalOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  {schemaCopy.cancelButton}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                >
                  {schemaCopy.saveFieldButton}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
