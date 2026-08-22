import { DailyEntry, Seller } from '@/models/types';
import { formatDate, formatNum, THAI_DAY_SHORT } from '@/lib/utils';
import { SORT_FEE_PER_KG } from '@/lib/constants';

const FONT_URL = 'https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap';
const PRIMARY = '#1b4332';

export function printWeeklyTable(weekDates: string[], entries: DailyEntry[], sellers: Seller[]): void {
  const win = window.open('', '_blank');
  if (!win) return;

  // Build cross-tab data
  const activeSellers = sellers.filter(s => s.status === 'active');
  const weekLabel = `${formatDate(weekDates[0])} — ${formatDate(weekDates[6])}`;

  const totalWeight = entries.reduce((s, e) => s + e.totalWeight, 0);
  const totalAmount = entries.reduce((s, e) => s + e.grandTotal, 0);
  const sortFee = totalWeight * SORT_FEE_PER_KG;
  const grandTotal = totalAmount + sortFee;

  const headerDays = weekDates.map((d, i) => {
    const [,, dd] = d.split('-');
    return `<th>${THAI_DAY_SHORT[i]}<br/><small>${dd}</small></th>`;
  }).join('');

  const sellerRows = activeSellers.map(seller => {
    const cells = weekDates.map(date => {
      const e = entries.find(en => en.sellerId === seller.id && en.date === date);
      return `<td class="num">${e ? formatNum(e.grandTotal) : '-'}</td>`;
    }).join('');
    const sellerTotal = entries.filter(e => e.sellerId === seller.id).reduce((s, e) => s + e.grandTotal, 0);
    return `<tr><td>${seller.name}</td>${cells}<td class="num total-col">${sellerTotal > 0 ? formatNum(sellerTotal) : '-'}</td></tr>`;
  }).join('');

  const totalPerDay = weekDates.map(date => {
    const dayEntries = entries.filter(e => e.date === date);
    const sum = dayEntries.reduce((s, e) => s + e.grandTotal, 0);
    return `<td class="num">${sum > 0 ? formatNum(sum) : '-'}</td>`;
  }).join('');

  const sortFeePerDay = weekDates.map(date => {
    const dayEntries = entries.filter(e => e.date === date);
    const w = dayEntries.reduce((s, e) => s + e.totalWeight, 0);
    const fee = w * SORT_FEE_PER_KG;
    return `<td class="num">${fee > 0 ? formatNum(fee) : '-'}</td>`;
  }).join('');

  win.document.write(`<!DOCTYPE html><html><head>
<meta charset="utf-8"/>
<title>ตารางสัปดาห์</title>
<link rel="stylesheet" href="${FONT_URL}"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Sarabun', sans-serif; }
  @page { size: A4 landscape; margin: 10mm; }
  body { font-size: 11px; color: #111; }
  h2 { color: ${PRIMARY}; font-size: 15px; text-align: center; margin-bottom: 4px; }
  .sub { text-align: center; font-size: 11px; color: #555; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { background: ${PRIMARY}; color: #fff; padding: 5px 6px; text-align: center; font-size: 11px; }
  th:first-child { text-align: left; }
  td { padding: 4px 6px; border-bottom: 1px solid #e0e0e0; font-size: 11px; }
  .num { text-align: right; }
  .total-col { font-weight: 700; background: #e8f5e9; }
  .total-row td { background: #e8f5e9; font-weight: 700; }
  .sort-row td { background: #fff3e0; font-weight: 600; }
  .net-row td { background: ${PRIMARY}; color: #fff; font-weight: 700; }
</style>
</head><body>
<h2>ตารางสรุปรายสัปดาห์</h2>
<div class="sub">${weekLabel}</div>
<table>
  <thead>
    <tr>
      <th>ผู้ขาย</th>
      ${headerDays}
      <th>รวม (บาท)</th>
    </tr>
  </thead>
  <tbody>
    ${sellerRows}
    <tr class="total-row">
      <td><strong>รวมทุกคน</strong></td>
      ${totalPerDay}
      <td class="num total-col">${formatNum(totalAmount)}</td>
    </tr>
    <tr class="sort-row">
      <td>ค่าคัด (×${SORT_FEE_PER_KG} บาท)</td>
      ${sortFeePerDay}
      <td class="num">${formatNum(sortFee)}</td>
    </tr>
    <tr class="net-row">
      <td><strong>ยอดสุทธิ</strong></td>
      ${weekDates.map(() => '<td></td>').join('')}
      <td class="num"><strong>${formatNum(grandTotal)}</strong></td>
    </tr>
  </tbody>
</table>
<script>window.onload=function(){window.print();window.close();}<\/script>
</body></html>`);
  win.document.close();
}
