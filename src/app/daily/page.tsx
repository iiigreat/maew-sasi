'use client';

import { useState, useMemo } from 'react';
import {
  DatePicker, AutoComplete, InputNumber, Button, message, Spin,
} from 'antd';
import {
  PrinterOutlined, SaveOutlined, UserOutlined, EditOutlined, EnvironmentOutlined,
  SearchOutlined, CalendarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import { useApp } from '@/lib/store';
import { today, formatNum } from '@/lib/utils';
import { printSellerBill } from '@/components/print/printSellerBill';
import { WeightEntry } from '@/models/types';

dayjs.extend(buddhistEra);
dayjs.locale('th');

// Badge color config per grade color key
const BADGE_COLOR: Record<string, { bg: string; text: string; border: string; labelColor: string }> = {
  orange: { bg: 'bg-[#fff3e0]', text: 'text-[#e65100]', border: 'border-[#fb8c00]', labelColor: 'text-[#e65100]' },
  green:  { bg: 'bg-[#e8f5e9]', text: 'text-[#2e7d32]', border: 'border-[#43a047]', labelColor: 'text-[#2e7d32]' },
  cyan:   { bg: 'bg-[#e0f7fa]', text: 'text-[#00838f]', border: 'border-[#00acc1]', labelColor: 'text-[#00838f]' },
  red:    { bg: 'bg-[#fce4ec]', text: 'text-[#c62828]', border: 'border-[#e53935]', labelColor: 'text-[#c62828]' },
};

// Grade border-left accent
const GRADE_BORDER: Record<string, string> = {
  orange: 'border-l-[#fb8c00]',
  green:  'border-l-[#43a047]',
  cyan:   'border-l-[#00acc1]',
  red:    'border-l-[#e53935]',
};

// Gray badge for C grades (no color set or gray)
const DEFAULT_BADGE = { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-300', labelColor: 'text-gray-500' };

export default function DailyPage() {
  const { state, addEntry } = useApp();
  const [selectedDate, setSelectedDate] = useState(today());
  const [sellerId, setSellerId] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [msgApi, ctxHolder] = message.useMessage();

  const activeSellers = useMemo(
    () => state.sellers.filter(s => s.status === 'active'),
    [state.sellers]
  );

  const sellerOptions = activeSellers.map(s => ({
    value: s.id,
    label: `${s.name}${s.code ? ` (${s.code})` : ''}`,
  }));

  const weightEntries: WeightEntry[] = state.grades.map(g => ({
    gradeId: g.id,
    gradeName: g.name,
    price: g.price,
    weight: weights[g.id] ?? 0,
    subtotal: (weights[g.id] ?? 0) * g.price,
  }));

  const filledEntries = weightEntries.filter(e => e.weight > 0);
  const totalWeight = filledEntries.reduce((s, e) => s + e.weight, 0);
  const grandTotal = filledEntries.reduce((s, e) => s + e.subtotal, 0);

  function handleSelectSeller(val: string) {
    const seller = activeSellers.find(s => s.id === val);
    setSellerId(val);
    setSellerName(seller?.name ?? '');
  }

  function clearForm() {
    setSellerId('');
    setSellerName('');
    setWeights({});
    setNote('');
  }

  function validate(): boolean {
    if (!sellerId) { msgApi.warning('กรุณาเลือกผู้ขาย'); return false; }
    if (filledEntries.length === 0) { msgApi.warning('กรุณากรอกน้ำหนักอย่างน้อย 1 เกรด'); return false; }
    return true;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      await addEntry({ date: selectedDate, sellerId, sellerName, entries: filledEntries, note });
      msgApi.success('บันทึกสำเร็จ');
      clearForm();
    } catch {
      msgApi.error('บันทึกไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAndPrint() {
    if (!validate()) return;
    setSaving(true);
    try {
      const entry = await addEntry({ date: selectedDate, sellerId, sellerName, entries: filledEntries, note });
      printSellerBill(entry, state.grades);
      msgApi.success('บันทึกและสั่งพิมพ์แล้ว');
      clearForm();
    } catch {
      msgApi.error('บันทึกไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  }

  const selectedSeller = activeSellers.find(s => s.id === sellerId);

  // Loading state ขณะโหลด sellers/grades จาก API
  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spin size="large"><span className="sr-only">กำลังโหลดข้อมูล...</span></Spin>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      {ctxHolder}

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
        {/* Left: title */}
        <div>
          <p className="text-xs font-bold text-[#2d6a4f] uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <EnvironmentOutlined /> TRANSACTION ENTRY
          </p>
          <h1 className="text-2xl font-bold text-gray-800 leading-tight">รับซื้อรายวัน</h1>
        </div>

        {/* Right: search + date */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
              <SearchOutlined />
            </span>
            <AutoComplete
              options={sellerOptions}
              value={sellerName}
              onChange={val => setSellerName(val)}
              onSelect={handleSelectSeller}
              filterOption={(input, opt) =>
                (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              placeholder="ค้นหาชื่อ หรือ รหัสสมาชิก..."
              allowClear
              onClear={() => { setSellerId(''); setSellerName(''); }}
              className="w-64"
              style={{ paddingLeft: 0 }}
            >
              <input
                className="w-full h-10 pl-9 pr-4 rounded-xl border-2 border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 shadow-sm focus:border-[#1b4332] focus:ring-2 focus:ring-[#1b4332]/10 focus:outline-none transition-all"
                placeholder="ค้นหาชื่อ หรือ รหัสสมาชิก..."
              />
            </AutoComplete>
          </div>
          <DatePicker
            value={dayjs(selectedDate)}
            format="DD/MM/BBBB"
            onChange={d => d && setSelectedDate(d.format('YYYY-MM-DD'))}
            allowClear={false}
            className="w-36 h-10 rounded-xl border-2 border-gray-200 shadow-sm"
            suffixIcon={<CalendarOutlined />}
          />
        </div>
      </div>


      {/* ── SELLER BANNER ── */}
      {selectedSeller ? (
        <div className="bg-[#f0fdf4] border border-green-200 rounded-2xl px-5 py-3 mb-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#1b4332] flex items-center justify-center text-white shrink-0">
            <UserOutlined />
          </div>
          <div>
            <p className="text-xs text-gray-500 leading-none mb-0.5">กำลังทำรายการให้</p>
            <p className="font-bold text-[#1b4332] text-base leading-tight">
              {selectedSeller.name}{selectedSeller.code ? ` (${selectedSeller.code})` : ''}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl px-5 py-3 mb-5 flex items-center gap-3 text-gray-400">
          <SearchOutlined />
          <p className="text-sm">เลือกผู้ขายด้านบนเพื่อเริ่มบันทึกรายการ</p>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div className="flex gap-5 flex-1 min-h-0">

        {/* Grade table */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">

            {/* Table column headers */}
            <div className="grid grid-cols-[1fr_160px_160px] px-6 py-3 border-b border-gray-100 bg-gray-50/70">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">เกรดหน่อไม้ฝรั่ง</p>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wide text-center">ราคาต่อหน่วย (฿)</p>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wide text-center">น้ำหนัก (กก.)</p>
            </div>

            {/* Grade rows */}
            <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
              {state.grades.map(g => {
                const colorKey = g.color ?? '';
                const badge = BADGE_COLOR[colorKey] ?? DEFAULT_BADGE;
                const borderL = GRADE_BORDER[colorKey] ?? 'border-l-gray-200';
                const w = weights[g.id] ?? 0;

                return (
                  <div
                    key={g.id}
                    className={`grid grid-cols-[1fr_160px_160px] items-center px-6 py-4 border-l-4 transition-colors ${
                      w > 0 ? borderL + ' bg-green-50/20' : 'border-l-gray-100'
                    }`}
                  >
                    {/* Grade name + badge */}
                    <div className="flex items-center gap-4">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                        {g.badge}
                      </div>
                      <span className="font-semibold text-gray-800 text-sm">{g.name}</span>
                    </div>

                    {/* Price */}
                    <div className="text-center">
                      <span className="font-semibold text-gray-600 text-sm">฿{g.price.toFixed(2)}</span>
                    </div>

                    {/* Weight input */}
                    <div className="flex justify-center">
                      <InputNumber
                        className="w-28 rounded-xl bg-gray-50 border-gray-200 text-center font-bold"
                        min={0}
                        step={0.5}
                        precision={2}
                        placeholder="0.00"
                        value={w || null}
                        onChange={val => setWeights(prev => ({ ...prev, [g.id]: val ?? 0 }))}
                        controls={false}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── FOOTER BAR ── */}
          <div className="mt-4 bg-white border border-gray-100 rounded-2xl shadow-sm px-6 py-4 flex items-center gap-6">
            {/* Weight */}
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-0.5">น้ำหนักรวมทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-700">
                {totalWeight.toFixed(2)} <span className="text-sm font-normal text-gray-400">กก.</span>
              </p>
            </div>

            {/* Amount */}
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-0.5">ยอดรวมจ่ายเงิน</p>
              <p className="text-2xl font-bold text-[#1b4332]">
                <span className="text-base font-semibold text-[#2d6a4f] mr-0.5">฿</span>
                {formatNum(grandTotal)}
              </p>
            </div>

            {/* Actions */}
            <div className="ml-auto flex items-center gap-3">
              <Button
                size="large"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={saving}
                disabled={saving}
                className="rounded-xl border-gray-200 text-gray-600 font-semibold px-5"
              >
                บันทึก<br />ร่าง
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<PrinterOutlined />}
                onClick={handleSaveAndPrint}
                loading={saving}
                disabled={saving}
                className="bg-[#1b4332] hover:bg-[#2d6a4f] border-none rounded-xl font-bold px-6"
              >
                ยืนยัน &amp; พิมพ์บิลคน<br />ขาย
              </Button>
            </div>
          </div>
        </div>

        {/* ── NOTES PANEL ── */}
        <div className="w-52 shrink-0 flex flex-col">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 flex flex-col flex-1">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs font-bold text-gray-600">หมายเหตุรายการ</p>
              <EditOutlined className="text-gray-400 text-xs" />
            </div>
            <textarea
              className="w-full flex-1 resize-none bg-gray-50 rounded-xl p-3 text-sm text-gray-600 placeholder-gray-300 border border-gray-100 focus:outline-none focus:border-green-400 transition-colors"
              placeholder="ระบุรายละเอียดเพิ่มเติม (ถ้ามี)..."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
