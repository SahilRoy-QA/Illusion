/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppError } from '../types/errors.ts';

export function getPlainErrorMessage(err: AppError): string {
  switch (err.code) {
    case 'UNAUTHORIZED':
      return 'Please sign in to access your business.';
    case 'FORBIDDEN':
      return 'You do not have permission to view or edit this part of the business.';
    case 'NOT_FOUND':
      return 'We could not find the item you were looking for.';
    case 'CONFLICT':
      return 'Someone else just saved changes to this item. Please refresh to see their latest updates.';
    case 'VALIDATION_FAILED':
      return `Please check what you entered: ${err.message}`;
    case 'DELETE_RESTRICTED':
      return `This cannot be removed right now: ${err.reason}`;
    case 'LIMIT_EXCEEDED':
      return `You have reached the limit for your current plan (${err.limitName}). Upgrade your plan to add more.`;
    case 'INTERNAL_ERROR':
    default:
      return 'Something unexpected happened. Your information is safe. Please try again.';
  }
}
