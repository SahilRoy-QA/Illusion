/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const schemaCopy = {
  title: 'Custom Fields & Record Design',
  subtitle: 'Customize what information your team tracks for this business.',
  addFieldButton: 'Add New Field',
  editFieldTitle: 'Edit Field',
  newFieldTitle: 'Create a New Field',
  fieldLabelLabel: 'Field Label (What staff see)',
  fieldLabelPlaceholder: 'e.g. Blood Group, Loyalty Card Number, Preferred Stylist',
  fieldTypeLabel: 'Type of Information',
  typeText: 'Short Text (Single line)',
  typeTextarea: 'Long Notes (Paragraph)',
  typeNumber: 'Whole Number',
  typeCurrency: 'Price or Cost (Currency)',
  typeEmail: 'Email Address',
  typePhone: 'Phone Number',
  typeDate: 'Calendar Date',
  typeSelect: 'Dropdown Choice (Pick one)',
  typeCheckbox: 'Yes / No Checkbox',
  optionsLabel: 'Dropdown Choices (one per line)',
  optionsPlaceholder: 'Option 1\nOption 2\nOption 3',
  requiredLabel: 'Required (Staff must fill this before saving)',
  sensitiveLabel: 'Confidential / Sensitive (Restricted to authorized team members)',
  showInListLabel: 'Display as column in records table',
  saveFieldButton: 'Save Field to Business',
  cancelButton: 'Cancel',
  archiveFieldButton: 'Archive Field',
  archiveFieldWarning: 'Archived fields will be hidden from new records without erasing historical entries.',
  noCustomFields: 'No custom fields added yet. Add custom fields to tailor your business records.',
  savedSuccess: 'Field saved and recorded in business version history.',
  archivedSuccess: 'Field archived successfully.',
  autoIdHelp: 'System identifier generated automatically.',
  inUseNotice: 'System field required for basic records.',
} as const;
