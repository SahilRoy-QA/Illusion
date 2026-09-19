/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Curated notification template library for WhatsApp and SMS reminders
 */

export interface NotificationTemplateDef {
  key: string;
  name: string;
  channel: 'whatsapp' | 'sms' | 'both';
  category: 'appointments' | 'inventory' | 'billing' | 'orders' | 'memberships' | 'prescriptions';
  template: string;
  placeholders: { key: string; label: string; example: string }[];
  description: string;
}

export const NOTIFICATION_TEMPLATES: NotificationTemplateDef[] = [
  {
    key: 'appointment_reminder',
    name: 'Appointment Reminder',
    channel: 'both',
    category: 'appointments',
    template: 'Namaste {{customerName}}, this is a reminder for your appointment at {{businessName}} on {{date}} at {{time}}. Reply YES to confirm or call {{businessPhone}}.',
    placeholders: [
      { key: 'customerName', label: 'Patient / Client Name', example: 'Ramesh Sharma' },
      { key: 'businessName', label: 'Business Name', example: 'Dr. Amit Orthopedic Clinic' },
      { key: 'date', label: 'Appointment Date', example: '20 Sep 2026' },
      { key: 'time', label: 'Appointment Time', example: '10:30 AM' },
      { key: 'businessPhone', label: 'Contact Phone', example: '+91 98200 12345' },
    ],
    description: 'Sent 24 hours before a booked consultation or salon session.',
  },
  {
    key: 'low_stock_alert',
    name: 'Low Stock Alert',
    channel: 'sms',
    category: 'inventory',
    template: 'Stock Alert: {{itemName}} (Batch: {{batchNumber}}) has dropped to {{currentStock}} units, below minimum reorder level of {{reorderLevel}}.',
    placeholders: [
      { key: 'itemName', label: 'Item Name', example: 'Paracetamol 650mg' },
      { key: 'batchNumber', label: 'Batch Number', example: 'BT-2026-08A' },
      { key: 'currentStock', label: 'Current Quantity', example: '15' },
      { key: 'reorderLevel', label: 'Reorder Level', example: '50' },
    ],
    description: 'Dispatched to staff / inventory manager when perishables or stock breach threshold.',
  },
  {
    key: 'invoice_due',
    name: 'Invoice Payment Due',
    channel: 'both',
    category: 'billing',
    template: 'Hello {{customerName}}, your invoice #{{invoiceId}} for {{amount}} from {{businessName}} is pending. Pay conveniently via UPI or visit our front desk. Thank you!',
    placeholders: [
      { key: 'customerName', label: 'Customer Name', example: 'Ananya Deshmukh' },
      { key: 'invoiceId', label: 'Invoice Number', example: 'INV-2026-0042' },
      { key: 'amount', label: 'Due Amount', example: '₹1,500' },
      { key: 'businessName', label: 'Business Name', example: 'Craft & Clay Goods' },
    ],
    description: 'Sent to customers with unpaid invoices.',
  },
  {
    key: 'order_ready',
    name: 'Order Ready for Pickup',
    channel: 'whatsapp',
    category: 'orders',
    template: 'Hello {{customerName}}, your order #{{orderId}} from {{businessName}} is freshly prepared and ready for pickup! We look forward to seeing you.',
    placeholders: [
      { key: 'customerName', label: 'Customer Name', example: 'Vikram Mehta' },
      { key: 'orderId', label: 'Order Number', example: 'ORD-2026-108' },
      { key: 'businessName', label: 'Business Name', example: 'Spice & Savor Café' },
    ],
    description: 'Notifies customers when takeaway or retail order is packaged.',
  },
  {
    key: 'prescription_ready',
    name: 'Prescription Ready',
    channel: 'whatsapp',
    category: 'prescriptions',
    template: 'Namaste {{customerName}}, your prescription from Dr. Amit is ready at our clinic pharmacy counter. You can pick it up or reply to request door delivery.',
    placeholders: [
      { key: 'customerName', label: 'Patient Name', example: 'Sunita Patil' },
    ],
    description: 'Shared with clinic patient right after doctor writes consultation prescription.',
  },
  {
    key: 'expiry_approaching',
    name: 'Expiry Approaching Warning',
    channel: 'sms',
    category: 'inventory',
    template: 'Warning: Perishable item {{itemName}} (Batch {{batchNumber}}) expires on {{expiryDate}} ({{daysLeft}} days remaining). Please rotate stock.',
    placeholders: [
      { key: 'itemName', label: 'Item Name', example: 'Amoxicillin Syrup 60ml' },
      { key: 'batchNumber', label: 'Batch Number', example: 'BT-2026-03F' },
      { key: 'expiryDate', label: 'Expiry Date', example: '15 Oct 2026' },
      { key: 'daysLeft', label: 'Days Remaining', example: '26' },
    ],
    description: 'Triggered 30 days before medicine, cosmetic, or food batch expiry.',
  },
  {
    key: 'membership_expiring',
    name: 'Membership Renewal Reminder',
    channel: 'whatsapp',
    category: 'memberships',
    template: 'Hi {{customerName}}, your {{planName}} membership at {{businessName}} will expire in {{daysLeft}} days. Renew today to maintain your routine and keep your loyalty bonuses active!',
    placeholders: [
      { key: 'customerName', label: 'Member Name', example: 'Karan Joshi' },
      { key: 'planName', label: 'Membership Name', example: 'Quarterly Strength & Cardio' },
      { key: 'businessName', label: 'Business Name', example: 'Pulse Fitness Studio' },
      { key: 'daysLeft', label: 'Days Left', example: '7' },
    ],
    description: 'Proactively reminds gym and salon package subscribers before validity expires.',
  },
  {
    key: 'walkin_called',
    name: 'Walk-in Queue Token Call',
    channel: 'whatsapp',
    category: 'appointments',
    template: 'Token {{tokenNumber}}: {{customerName}}, your turn is now up at {{businessName}}. Please proceed to Consultation Room / Styling Chair #{{counterNumber}}.',
    placeholders: [
      { key: 'tokenNumber', label: 'Token Number', example: 'A-05' },
      { key: 'customerName', label: 'Name', example: 'Meera Iyer' },
      { key: 'businessName', label: 'Business Name', example: 'Dr. Amit Orthopedic Clinic' },
      { key: 'counterNumber', label: 'Room or Chair', example: '1' },
    ],
    description: 'Sent when the front desk advances the queue caller.',
  },
];

/**
 * Merges variables into template string
 */
export function renderNotificationTemplate(
  templateKey: string,
  variables: Record<string, string | number>
): string {
  const def = NOTIFICATION_TEMPLATES.find((t) => t.key === templateKey);
  let text = def ? def.template : '';

  for (const [key, val] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    text = text.replace(regex, String(val ?? ''));
  }

  return text;
}

/**
 * Builds direct WhatsApp click-to-chat URL
 */
export function generateWhatsAppUrl(phoneNumber: string, messageText: string): string {
  // Normalize Indian and international numbers: strip spaces, dashes, parentheses
  let cleaned = phoneNumber.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  } else if (cleaned.length === 10) {
    // Default to Indian country code 91 if 10 digits
    cleaned = '91' + cleaned;
  }
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(messageText)}`;
}
