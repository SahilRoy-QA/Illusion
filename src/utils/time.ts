/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Formats a UTC ISO-8601 string into the business's local time zone cleanly
export function formatToTenantTime(
  isoString: string,
  timeZone = 'Asia/Kolkata',
  includeTime = true,
  locale = 'en-IN'
): string {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat(locale, {
      timeZone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: includeTime ? 'numeric' : undefined,
      minute: includeTime ? '2-digit' : undefined,
      hour12: true,
    }).format(date);
  } catch {
    return isoString;
  }
}

// Generate daylight-saving-safe appointment time slots for a business day
export function generateDaySlots(
  dateYmd: string,
  openTime = '09:00',
  closeTime = '18:00',
  durationMinutes = 30
): { slotTime: string; label: string }[] {
  const slots: { slotTime: string; label: string }[] = [];
  const [openHour, openMin] = openTime.split(':').map(Number);
  const [closeHour, closeMin] = closeTime.split(':').map(Number);

  let currentMin = openHour * 60 + openMin;
  const endMin = closeHour * 60 + closeMin;

  while (currentMin + durationMinutes <= endMin) {
    const hours = Math.floor(currentMin / 60);
    const mins = currentMin % 60;
    const hourStr = String(hours).padStart(2, '0');
    const minStr = String(mins).padStart(2, '0');
    const slotTime = `${dateYmd}T${hourStr}:${minStr}:00.000Z`;

    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    const label = `${displayHour}:${String(mins).padStart(2, '0')} ${ampm}`;

    slots.push({ slotTime, label });
    currentMin += durationMinutes;
  }

  return slots;
}
