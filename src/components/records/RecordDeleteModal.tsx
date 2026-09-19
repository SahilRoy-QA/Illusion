/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RequestContext } from '../../types/context.ts';
import { EntityDef } from '../../types/config.ts';
import { DynamicRecord } from '../../types/records.ts';
import { defaultPorts } from '../../data/index.ts';
import { Trash2, AlertTriangle, X, ShieldAlert } from 'lucide-react';

interface RecordDeleteModalProps {
  isOpen: boolean;
  record: DynamicRecord | null;
  entity: EntityDef;
  ctx: RequestContext;
  onClose: () => void;
  onRecordDeleted: (deletedId: string) => void;
}

export const RecordDeleteModal: React.FC<RecordDeleteModalProps> = ({
  isOpen,
  record,
  entity,
  ctx,
  onClose,
  onRecordDeleted,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !record) return null;

  // Impact sentence (Invariant 11: Soft Deletes Default)
  const recordLabel =
    (record.data.fullName as string) ||
    (record.data.name as string) ||
    (record.data.title as string) ||
    `Record #${record.id.slice(0, 8)}`;

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMessage('');

    try {
      const success = await defaultPorts.records.softDelete(ctx, entity.key, record.id);
      if (success) {
        onRecordDeleted(record.id);
        onClose();
      } else {
        setErrorMessage('Unable to archive record. It may have already been removed.');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Deletion failed.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="text-base font-bold text-slate-900">Archive {entity.singular}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="py-4 space-y-3">
          <p className="text-xs text-slate-600">
            Are you sure you want to archive <strong className="text-slate-900 font-semibold">{recordLabel}</strong>?
          </p>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
            <div className="font-semibold flex items-center space-x-1.5 text-amber-800">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Safe Soft-Delete Guarantee</span>
            </div>
            <p>
              This item will be hidden from active lists and public inquiries. It can be restored at any time from the archived view.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {errorMessage}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center space-x-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Archiving...' : `Archive ${entity.singular}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
