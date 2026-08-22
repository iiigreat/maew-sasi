import { DailyEntry, Grade } from '@/models/types';
import { formatDate, formatNum } from '@/lib/utils';
import { SORT_FEE_PER_KG } from '@/lib/constants';

const FONT_URL = 'https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap';

export function printBossBill(date: string, entries: DailyEntry[], allGrades: Grade[] = []): void {
  const win = window.open('', '_blank', 'width=595,height=842');
  if (!win) return;

  // ── Aggregate weight & subtotal per grade ──────────────────────────────────
  const gradeMap = new Map<string, { gradeName: string; weight: number; subtotal: number }>();

  // Initialize all grades with 0 (in order)
  allGrades.forEach(g => {
    gradeMap.set(g.id, { gradeName: g.name, weight: 0, subtotal: 0 });
  });

  // Sum across all entries
  entries.forEach(entry => {
    entry.entries.forEach(e => {
      if (gradeMap.has(e.gradeId)) {
        const cur = gradeMap.get(e.gradeId)!;
        gradeMap.set(e.gradeId, {
          gradeName: e.gradeName,
          weight: cur.weight + e.weight,
          subtotal: cur.subtotal + e.subtotal,
        });
      } else {
        // grade not in allGrades list — still include it
        const existing = gradeMap.get(e.gradeId);
        gradeMap.set(e.gradeId, {
          gradeName: e.gradeName,
          weight: (existing?.weight ?? 0) + e.weight,
          subtotal: (existing?.subtotal ?? 0) + e.subtotal,
        });
      }
    });
  });

  const gradeRows = Array.from(gradeMap.values());

  const totalWeight = entries.reduce((s, e) => s + e.totalWeight, 0);
  const totalAmount = entries.reduce((s, e) => s + e.grandTotal, 0);
  const sortFee = totalWeight * SORT_FEE_PER_KG;
  const netAmount = totalAmount + sortFee;

  const rows = gradeRows.map(g => `
    <tr>
      <td class="grade-name">${g.gradeName}</td>
      <td class="num">${g.weight.toFixed(1)}</td>
      <td class="num">${formatNum(g.subtotal)}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>บิลสรุปส่งเถ้าแก่ - ${formatDate(date)}</title>
<link rel="stylesheet" href="${FONT_URL}"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Sarabun', sans-serif; }
  html, body { width: 148mm; min-height: 210mm; }
  @page { size: A5 portrait; margin: 8mm; }
  body { font-size: 13px; color: #333; line-height: 1.5; padding: 4px 20px 16px; }

  /* Print Controls */
  .no-print { display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 16px; }
  .btn { padding: 6px 16px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; color: white; font-size: 12px; font-family: 'Sarabun', sans-serif; }
  .btn-print { background-color: #1b7339; }
  .btn-close { background-color: #d32f2f; }
  @media print {
    .no-print { display: none; }
    body { padding: 0; }
  }

  /* Title */
  .title-block { text-align: center; margin-bottom: 18px; padding-bottom: 12px; border-bottom: 1px solid #e0e0e0; }
  .title-main { font-size: 17px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; }
  .title-sub { font-size: 12px; color: #2e7d32; font-weight: 500; }

  /* Table */
  table { width: 100%; border-collapse: collapse; }
  thead th {
    padding: 8px 10px;
    font-size: 11px;
    font-weight: 600;
    color: #757575;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    border-bottom: 2px solid #e0e0e0;
  }
  .th-left { text-align: left; }
  .th-right { text-align: right; }

  tbody td {
    padding: 9px 10px;
    font-size: 13px;
    border-bottom: 1px solid #f0f0f0;
    color: #212121;
  }
  .grade-name { font-weight: 500; color: #1a1a1a; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }

  /* Summary rows */
  .divider-row td { border-top: 2px solid #e0e0e0; padding-top: 10px; }

  .total-row td {
    font-weight: 700;
    font-size: 13px;
    color: #1a1a1a;
    padding: 10px 10px 8px;
    border-bottom: 1px solid #e0e0e0;
  }
  .sort-row td {
    font-size: 12px;
    color: #555;
    padding: 7px 10px;
    border-bottom: 1px solid #f0f0f0;
  }
  .net-row td {
    font-size: 14px;
    font-weight: 700;
    color: #757575;
    padding: 8px 10px 4px;
  }
  .net-amount { color: #757575; font-size: 14px; font-weight: 700; }
</style>
</head>
<body>

  <div class="no-print">
    <button class="btn btn-print" onclick="window.print()">🖨 พิมพ์</button>
    <button class="btn btn-close" onclick="window.close()">ปิด</button>
  </div>

  <div class="title-block">
    <div class="title-main">บิลสรุปส่งเถ้าแก่</div>
    <div class="title-sub">วันที่: ${formatDate(date)}&nbsp;&nbsp;|&nbsp;&nbsp;จำนวน ${entries.length} ราย</div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="th-left">เกรด</th>
        <th class="th-right">น้ำหนักรวม (กก.)</th>
        <th class="th-right">ยอดเงิน (บาท)</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="total-row divider-row">
        <td>รวมทั้งหมด</td>
        <td class="num">${totalWeight.toFixed(1)}</td>
        <td class="num">${formatNum(totalAmount)}</td>
      </tr>
      <tr class="sort-row">
        <td>ค่าคัด (${totalWeight.toFixed(1)} × ${SORT_FEE_PER_KG} บาท)</td>
        <td class="num"></td>
        <td class="num">${formatNum(sortFee)}</td>
      </tr>
      <tr class="net-row">
        <td>ยอดสุทธิที่รับจากเถ้าแก่</td>
        <td></td>
        <td class="num net-amount">${formatNum(netAmount)}</td>
      </tr>
    </tbody>
  </table>

</body>
</html>`;

  win.document.write(html);
  win.document.close();
}
