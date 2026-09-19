/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const commonCopy = {
  appName: 'illusion',
  actions: {
    add: 'Add',
    edit: 'Edit',
    save: 'Save Changes',
    cancel: 'Cancel',
    remove: 'Remove',
    back: 'Back',
    continue: 'Continue',
    close: 'Close',
    search: 'Search...',
    filter: 'Filter',
    refresh: 'Refresh',
    publish: 'Publish',
    preview: 'Preview',
    restore: 'Restore This Version',
  },
  status: {
    active: 'Active',
    trial: 'Trial Period',
    suspended: 'Suspended',
    paid: 'Paid',
    unpaid: 'Unpaid',
    draft: 'Draft',
    published: 'Live on the Web',
  },
  empty: {
    noRecords: 'Nothing added here yet.',
    getStarted: 'Click below to add your first entry.',
  },
  loading: 'Loading...',
} as const;
