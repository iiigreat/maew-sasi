'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  DatePicker, Button, Popconfirm, message, Empty,
  InputNumber, Modal, Spin,
} from 'antd';
import {
  PrinterOutlined, EyeOutlined, EditOutlined, DeleteOutlined,
  InfoCircleOutlined, SendOutlined, CalendarOutlined,
  EnvironmentOutlined, DollarOutlined, CalculatorOutlined, InboxOutlined,
  FilterOutlined, SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import { useApp } from '@/lib/store';
import { today, formatDate, formatNum, formatInt } from '@/lib/utils';
import { SORT_FEE_PER_KG } from '@/lib/constants';
import { printBossBill } from '@/components/print/printBossBill';
import { printSellerBill } from '@/components/print/printSellerBill';
import { DailyEntry, WeightEntry } from '@/models/types';

dayjs.extend(buddhistEra);
dayjs.locale('th');

const AVATAR_COLORS = ['#2d6a4f', '#0891b2', '#fb8c00', '#7c3aed', '#db2777'];

export default function BossBillPage() {
  const { state, getEntriesByDate, updateEntry, deleteEntry, fetchEntriesByDate } = useApp();
  const [selectedDate, setSelectedDate] = useState(today());
  const [viewEntry, setViewEntry] = useState<DailyEntry | null>(null);
  const [editEntry, setEditEntry] = useState<DailyEntry | null>(null);
  const [editWeights, setEditWeights] = useState<Record<string, number>>({});
  const [msgApi, ctxHolder] = message.useMessage();
  const [editSaving, setEditSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [fetchingDate, setFetchingDate] = useState(false);

  // โหลด entries เมื่อเปลี่ยนวันที่
  const loadDate = useCallback(async (date: string) => {
    setFetchingDate(true);
    await fetchEntriesByDate(date);
    setFetchingDate(false);
  }, [fetchEntriesByDate]);

  useEffect(() => {
    if (!state.isLoading) {
      loadDate(selectedDate);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, state.isLoading]);

  const entries = getEntriesByDate(selectedDate);

  const totalWeight = entries.reduce((s, e) => s + e.totalWeight, 0);
  const totalAmount = entries.reduce((s, e) => s + e.grandTotal, 0);
  const sortFee = totalWeight * SORT_FEE_PER_KG;
  const netAmount = totalAmount + sortFee;

  function openEdit(entry: DailyEntry) {
    setEditEntry(entry);
    const wMap: Record<string, number> = {};
    entry.entries.forEach(e => { wMap[e.gradeId] = e.weight; });
    setEditWeights(wMap);
  }

  async function handleSaveEdit() {
    if (!editEntry) return;
    const newEntries: WeightEntry[] = state.grades.map(g => ({
      gradeId: g.id, gradeName: g.name, price: g.price,
      weight: editWeights[g.id] ?? 0,
      subtotal: (editWeights[g.id] ?? 0) * g.price,
    })).filter(e => e.weight > 0);
    if (newEntries.length === 0) { msgApi.warning('กรุณากรอกน้ำหนักอย่างน้อย 1 เกรด'); return; }
    setEditSaving(true);
    try {
      await updateEntry(editEntry.id, { entries: newEntries });
      msgApi.success('แก้ไขสำเร็จ');
      setEditEntry(null);
    } catch (err) {
      if (err instanceof Error) msgApi.error(err.message || 'แก้ไขไม่สำเร็จ');
    } finally {
      setEditSaving(false);
    }
  }

  const STAT_CARDS = useMemo(() => [
    { label: 'หน่อไม้ทั้งหมด', value: `${totalWeight.toFixed(1)} kg`, icon: <EnvironmentOutlined />, color: 'bg-green-100' },
    { label: 'เงินรวมลูกค้า', value: `${formatInt(totalAmount)} Baht`, icon: <DollarOutlined />, color: 'bg-blue-100' },
    { label: 'ค่าคัดจุ (5฿/กก)', value: `${formatInt(sortFee)} Baht`, icon: <CalculatorOutlined />, color: 'bg-orange-100' },
    { label: 'ยอดส่งเถ้าแก่', value: `${formatInt(netAmount)} Baht`, icon: <InboxOutlined />, color: 'bg-purple-100' },
  ], [totalWeight, totalAmount, sortFee, netAmount]);

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spin size="large"><span className="sr-only">กำลังโหลดข้อมูล...</span></Spin>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {ctxHolder}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-green-800 font-bold mb-4 text-sm">
          <EnvironmentOutlined /> <span>Agri-Point Management</span>
        </div>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xs text-[#2d6a4f] font-bold uppercase tracking-widest mb-1">Daily Overview</h2>
            <h1 className="text-xl font-bold text-gray-800">สรุปคัดรับซื้อรายวัน</h1>
            <p className="text-sm text-gray-500 mt-1">
              ตรวจสอบยอดรวมประจำวันที่ <strong>{formatDate(selectedDate)}</strong> และดำเนินการส่งข้อมูลให้เถ้าแก่หรือบันทึกยอดเข้าชั้นทักยอดประจำสัปดาห์
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              icon={<SendOutlined />}
              className="bg-[#9c6644] text-white border-none hover:bg-[#b07d5b] rounded-xl font-bold h-10 px-4"
              onClick={() => entries.length > 0 && printBossBill(selectedDate, entries, state.grades)}
              disabled={entries.length === 0}
            >
              ออกบิลส่งเถ้าแก่
            </Button>
            <Button
              type="primary"
              icon={<CalendarOutlined />}
              className="bg-[#1b4332] border-none rounded-xl font-bold h-10 px-4"
            >
              บันทึกยอดเข้าชั้น Week
            </Button>
          </div>
        </div>
      </div>

      {/* Date Selector */}
      <div className="flex items-center gap-3 mb-6">
        <DatePicker
          value={dayjs(selectedDate)}
          format="DD MMMM BBBB"
          onChange={d => d && setSelectedDate(d.format('YYYY-MM-DD'))}
          allowClear={false}
          className="w-48 rounded-xl"
          suffixIcon={<CalendarOutlined className="text-gray-500" />}
        />
        {fetchingDate && <Spin size="small" />}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STAT_CARDS.map(card => (
          <div key={card.label} className="bg-[#f1f5f9] rounded-2xl p-4 border border-gray-100 flex items-center gap-4">
            <div className={`w-10 h-10 ${card.color} rounded-full flex items-center justify-center text-lg shrink-0`}>
              {card.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide truncate">{card.label}</p>
              <p className="text-base font-bold text-gray-800 mt-0.5">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Row */}
      <div className="flex gap-5 flex-1 min-h-0">
        {/* Table */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
            {/* Table Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="w-1 h-5 bg-[#1b4332] rounded-full block" />
                <p className="font-bold text-gray-800">รายชื่อลูกค้าวันนี้</p>
                <span className="bg-[#1b4332] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {entries.length} รายการ
                </span>
              </div>
              <div className="flex gap-2">
                <Button type="text" icon={<FilterOutlined className="text-gray-400" />} size="small" />
                <Button type="text" icon={<SearchOutlined className="text-gray-400" />} size="small" />
              </div>
            </div>

            {/* Table Column Header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr] px-6 py-2 bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wide border-b border-gray-100">
              <span>ชื่อลูกค้า</span>
              <span className="text-right">น้ำหนัก (กก.)</span>
              <span className="text-right">จำนวนเงิน (บาท)</span>
              <span className="text-center">จัดการ</span>
            </div>

            {/* Rows */}
            <div className="overflow-y-auto flex-1">
              {fetchingDate ? (
                <div className="flex items-center justify-center py-16">
                  <Spin />
                </div>
              ) : entries.length === 0 ? (
                <Empty description={`ไม่มีรายการวันที่ ${formatDate(selectedDate)}`} className="py-16" />
              ) : (
                entries.map((entry, idx) => (
                  <div key={entry.id} className="grid grid-cols-[2fr_1fr_1fr_1fr] px-6 py-4 border-b border-gray-50 hover:bg-gray-50/50 items-center">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}
                      >
                        {entry.sellerName.slice(0, 1)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{entry.sellerName}</p>
                        <p className="text-[10px] text-gray-400">{entry.sellerId ? `ID: ${entry.sellerId.slice(0, 8)}` : ''}</p>
                      </div>
                    </div>
                    <p className="text-right font-semibold text-gray-700 text-sm">{entry.totalWeight.toFixed(1)}</p>
                    <p className="text-right font-bold text-[#1b4332] text-sm">{formatNum(entry.grandTotal)}</p>
                    <div className="flex flex-col gap-1 items-center">
                      <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => setViewEntry(entry)}
                        className="w-16 rounded-lg text-xs"
                      >
                        ดูบิล
                      </Button>
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => openEdit(entry)}
                        className="w-16 rounded-lg text-xs"
                      >
                        แก้ไข
                      </Button>
                      <Popconfirm
                        title="ยืนยันการลบ"
                        description={`ลบรายการของ ${entry.sellerName}?`}
                        onConfirm={async () => {
                          setDeletingId(entry.id);
                          try {
                            await deleteEntry(entry.id);
                            msgApi.success('ลบเรียบร้อย');
                          } catch (err) {
                            if (err instanceof Error) msgApi.error(err.message || 'ลบไม่สำเร็จ');
                          } finally {
                            setDeletingId(null);
                          }
                        }}
                        okText="ลบ" cancelText="ยกเลิก" okButtonProps={{ danger: true }}
                      >
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          loading={deletingId === entry.id}
                          className="w-16 rounded-lg text-xs"
                        />
                      </Popconfirm>
                    </div>
                  </div>
                ))
              )}
            </div>

            {entries.length > 0 && (
              <button className="py-3 text-xs font-bold text-gray-400 hover:text-[#1b4332] transition-colors border-t border-gray-100 tracking-wide uppercase">
                LOAD MORE SELLERS ▾
              </button>
            )}
          </div>
        </div>

        {/* Quick Guide */}
        <div className="w-56 shrink-0">
          <div className="bg-[#f0fdf4] border border-green-100 rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <InfoCircleOutlined className="text-green-700" />
              <p className="font-bold text-green-800 text-sm">Quick Guide</p>
            </div>
            <p className="text-[11px] text-gray-600 leading-relaxed mb-4">
              <strong>ยอดส่งเถ้าแก่ คำนวณจาก:</strong><br/>
              (เงินรวมลูกค้า + ค่าคัดจุด)<br/><br/>
              ตรวจดูตารางก่อนกดบิลหรือก่อนบันทึกส่งเข้าชั้นสัปดาห์
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-500">Status</span>
              <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">
                LIVE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* View Modal */}
      <Modal
        open={!!viewEntry}
        onCancel={() => setViewEntry(null)}
        footer={[
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => viewEntry && printSellerBill(viewEntry, state.grades)} className="bg-[#1b4332]">
            พิมพ์บิล
          </Button>,
          <Button key="close" onClick={() => setViewEntry(null)}>ปิด</Button>,
        ]}
        title={`รายละเอียด — ${viewEntry?.sellerName}`}
      >
        {viewEntry && (
          <div>
            <p className="text-sm text-gray-500 mb-3">วันที่: {formatDate(viewEntry.date)}</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1b4332] text-white">
                  <th className="py-2 px-3 text-left rounded-tl-lg">เกรด</th>
                  <th className="py-2 px-3 text-right">น้ำหนัก (กก.)</th>
                  <th className="py-2 px-3 text-right">ราคา/กก.</th>
                  <th className="py-2 px-3 text-right rounded-tr-lg">รวม (บาท)</th>
                </tr>
              </thead>
              <tbody>
                {viewEntry.entries.filter(e => e.weight > 0).map(e => (
                  <tr key={e.gradeId} className="border-b border-gray-100">
                    <td className="py-2 px-3">{e.gradeName}</td>
                    <td className="py-2 px-3 text-right">{e.weight.toFixed(1)}</td>
                    <td className="py-2 px-3 text-right">{e.price}</td>
                    <td className="py-2 px-3 text-right font-semibold">{formatNum(e.subtotal)}</td>
                  </tr>
                ))}
                <tr className="bg-[#e8f5e9] font-bold">
                  <td className="py-2 px-3">รวมทั้งหมด</td>
                  <td className="py-2 px-3 text-right">{viewEntry.totalWeight.toFixed(1)}</td>
                  <td></td>
                  <td className="py-2 px-3 text-right">{formatNum(viewEntry.grandTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!editEntry}
        onCancel={() => setEditEntry(null)}
        onOk={handleSaveEdit}
        title={`แก้ไข — ${editEntry?.sellerName}`}
        okText="บันทึก" cancelText="ยกเลิก"
        okButtonProps={{ className: 'bg-[#1b4332]', loading: editSaving }}
        cancelButtonProps={{ disabled: editSaving }}
      >
        {editEntry && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            {state.grades.map(g => (
              <div key={g.id}>
                <label className="block text-xs text-gray-600 mb-1">{g.name} ({g.price} บ./กก.)</label>
                <InputNumber
                  className="w-full" min={0} step={0.5} precision={1} placeholder="0.0"
                  value={editWeights[g.id] || null}
                  onChange={val => setEditWeights(prev => ({ ...prev, [g.id]: val ?? 0 }))}
                  suffix="กก."
                />
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
