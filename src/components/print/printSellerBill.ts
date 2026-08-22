import { DailyEntry, Grade } from '@/models/types';
import { formatDate, formatNum } from '@/lib/utils';
import dayjs from 'dayjs';

const FONT_URL = 'https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap';

export function printSellerBill(entry: DailyEntry, allGrades: Grade[] = []): void {
  const win = window.open('', '_blank', 'width=595,height=842');
  if (!win) return;

  // Generate a receipt number based on date and entry ID
  const dateStr = dayjs(entry.date).format('YYMMDD');
  const shortId = entry.id === 'preview' ? 'PREV' : (entry.id?.substring(0, 4).toUpperCase() || '001');
  const receiptNo = `#${dateStr}-${shortId}`;

  // Build full grade list — show all grades (with 0 for missing ones)
  const entryMap = new Map(entry.entries.map(e => [e.gradeId, e]));
  const displayRows: Array<{ gradeName: string; weight: number; price: number; subtotal: number }> =
    allGrades.length > 0
      ? allGrades.map(g => {
          const e = entryMap.get(g.id);
          return e
            ? { gradeName: e.gradeName, weight: e.weight, price: e.price, subtotal: e.subtotal }
            : { gradeName: g.name, weight: 0, price: g.price, subtotal: 0 };
        })
      : entry.entries;

  const rows = displayRows
    .map(e => `
      <tr>
        <td class="text-center">${e.weight.toFixed(2)}</td>
        <td class="text-center">${e.gradeName}</td>
        <td class="text-center">${e.price.toFixed(2)}</td>
        <td class="text-right pr-4">${formatNum(e.subtotal)}</td>
      </tr>`)
    .join('');


  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>ใบรับซื้อ - ${entry.sellerName}</title>
<link rel="stylesheet" href="${FONT_URL}"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Sarabun', sans-serif; }
  html, body { width: 148mm; min-height: 210mm; }
  @page { size: A5 portrait; margin: 8mm; }
  body { font-size: 12px; color: #333; line-height: 1.4; padding: 4px 16px 12px; }
  
  /* Print Controls (Hidden when printing) */
  .no-print { display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 14px; }
  .btn { padding: 6px 14px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; color: white; font-size: 12px; }
  .btn-print { background-color: #1b7339; }
  .btn-close { background-color: #d32f2f; }
  @media print {
    .no-print { display: none; }
    body { padding: 0; }
  }

  /* Header */
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
  .header-left { display: flex; align-items: center; gap: 6px; }
  .title { color: #2e7d32; font-size: 18px; font-weight: 700; letter-spacing: 0.5px; }
  
  /* Info Grid */
  .info-grid { display: flex; justify-content: space-between; margin-bottom: 14px; font-size: 12px; }
  .info-col { display: flex; flex-direction: column; gap: 4px; }
  .info-label { color: #757575; }
  .info-value { color: #212121; font-weight: 600; }
  
  /* Table */
  .table-wrapper { border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; margin-bottom: 18px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 7px 6px; border-bottom: 1px solid #f0f0f0; }
  th { background: #fafafa; color: #757575; font-size: 10px; font-weight: 600; text-align: center; }
  .th-en { display: block; font-size: 8px; font-weight: 400; margin-top: 1px; }
  
  tr:last-child td { border-bottom: none; }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .pr-4 { padding-right: 12px; }
  
  /* Total Row */
  .total-row td { background: #fafafa; font-weight: 700; font-size: 13px; border-top: 1px solid #e0e0e0; }
  .total-qty { text-align: center; color: #212121; }
  .total-label { text-align: right; color: #212121; padding-right: 12px; }
  .total-amount { text-align: right; color: #2e7d32; padding-right: 12px; }

  /* Signatures */
  .signatures { display: flex; justify-content: space-around; margin-top: 24px; margin-bottom: 20px; }
  .sig-box { text-align: center; width: 40%; }
  .sig-line { border-bottom: 1px solid #bdbdbd; margin-bottom: 6px; height: 24px; }
  .sig-label { color: #757575; font-size: 11px; }
  
  /* Footer */
  .footer { text-align: center; color: #9e9e9e; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .footer .sub { font-weight: 400; text-transform: none; margin-top: 2px; font-size: 8px; }
</style>
</head>
<body>
  
  <div class="no-print">
    <button class="btn btn-print" onclick="window.print()">🖨 พิมพ์</button>
    <button class="btn btn-close" onclick="window.close()">ปิด</button>
  </div>

  <div class="header">
    <div class="header-left">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM11 19.93C7.05 19.43 4 16.05 4 12C4 7.95 7.05 4.57 11 4.07V19.93ZM13 4.07C16.95 4.57 20 7.95 20 12C20 16.05 16.95 19.43 13 19.93V4.07Z" fill="#2e7d32"/>
      </svg>
      <div class="title" style="margin-left: 8px;">ใบรับซื้อ</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-col">
      <div><span class="info-label">ชื่อผู้ขาย / SELLER:</span> <span class="info-value">นาย ${entry.sellerName}</span></div>
      <div><span class="info-label">รหัสสมาชิก:</span> <span class="info-value">${entry.sellerId ? ('AP-' + entry.sellerId.substring(0, 5).toUpperCase()) : '-'}</span></div>
    </div>
    <div class="info-col" style="text-align: right;">
      <div><span class="info-label">วันที่ / DATE:</span> <span class="info-value">${formatDate(entry.date)}</span></div>
      <div><span class="info-label">เลขที่ใบเสร็จ:</span> <span class="info-value">${receiptNo}</span></div>
    </div>
  </div>

  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>จำนวน (กก.)<span class="th-en">QUANTITY (KG)</span></th>
          <th>รายการ<span class="th-en">GRADE</span></th>
          <th>หน่วยละ<span class="th-en">PRICE/UNIT</span></th>
          <th class="text-right pr-4">จำนวนเงิน<span class="th-en">TOTAL AMOUNT</span></th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr class="total-row">
          <td class="total-qty">${entry.totalWeight.toFixed(2)}</td>
          <td></td>
          <td class="total-label">รวม (Total)</td>
          <td class="total-amount">${formatNum(entry.grandTotal)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="signatures">
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-label">ผู้รับเงิน (Receiver)</div>
    </div>
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-label">เจ้าของจุด (Point Owner)</div>
    </div>
  </div>

  <div class="footer">
    <div>AGRI-POINT MANAGEMENT SYSTEM</div>
    <div class="sub">Generated by Agri-Point Digital Billing</div>
  </div>

</body>
</html>`;

  win.document.write(html);
  win.document.close();
  // Auto-print is removed to allow the user to see the UI buttons like in the mockup
  // They can click the print button manually.
}
