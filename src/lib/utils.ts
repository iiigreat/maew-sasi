import { WeightEntry } from '@/models/types';

/** Generate a unique ID */
export function uid(): string {
  return crypto.randomUUID();
}

/** Today as "YYYY-MM-DD" */
export function today(): string {
  return new Date().toISOString().split('T')[0];
}

/** Format date string to Thai long date e.g. "14 สิงหาคม 2568" */
export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const thaiYear = year + 543;
  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
    'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
    'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ];
  return `${day} ${monthNames[month - 1]} ${thaiYear}`;
}

/** Format number with 2 decimal places + commas e.g. 1234.5 → "1,234.50" */
export function formatNum(n: number): string {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Format number with no decimal, with commas */
export function formatInt(n: number): string {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/** Calculate totals from WeightEntry[] */
export function calcEntryTotals(entries: WeightEntry[]): { totalWeight: number; grandTotal: number } {
  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);
  const grandTotal = entries.reduce((sum, e) => sum + e.subtotal, 0);
  return { totalWeight, grandTotal };
}

/** Get Monday of the week for a given date */
export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Get 7 date strings for a week starting from monday */
export function getWeekDates(monday: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

/** Short Thai day labels */
export const THAI_DAY_SHORT = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'];
