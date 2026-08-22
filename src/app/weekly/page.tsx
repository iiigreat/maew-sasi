'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Spin } from 'antd';
import { LeftOutlined, RightOutlined, PrinterOutlined, CalendarOutlined, InfoCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useApp } from '@/lib/store';
import { today, getMondayOfWeek, getWeekDates, formatInt, THAI_DAY_SHORT } from '@/lib/utils';
import { SORT_FEE_PER_KG } from '@/lib/constants';
import { printWeeklyTable } from '@/components/print/printWeeklyTable';

export default function WeeklyPage() {
  const { state, getEntriesInWeek, fetchEntriesInWeek } = useApp();
  const [monday, setMonday] = useState(() => getMondayOfWeek(new Date()));
  const [fetchingWeek, setFetchingWeek] = useState(false);

  const weekDates = getWeekDates(monday);
  const entries = getEntriesInWeek(weekDates);
  const todayStr = today();

  const activeSellers = state.sellers.filter(s => s.status === 'active');

  // โหลด entries ของสัปดาห์เมื่อเปลี่ยนสัปดาห์
  const loadWeek = useCallback(async (dates: string[]) => {
    setFetchingWeek(true);
    await fetchEntriesInWeek(dates);
    setFetchingWeek(false);
  }, [fetchEntriesInWeek]);

  useEffect(() => {
    if (!state.isLoading) {
      loadWeek(weekDates);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monday, state.isLoading]);

  // Weekly totals per day
  const dayTotals = weekDates.map(d => entries.filter(e => e.date === d).reduce((s, e) => s + e.grandTotal, 0));
  const weekGrandTotal = entries.reduce((s, e) => s + e.grandTotal, 0);
  const totalWeight = entries.reduce((s, e) => s + e.totalWeight, 0);
  const sortFeeTotal = totalWeight * SORT_FEE_PER_KG;

  function prevWeek() {
    const d = new Date(monday);
    d.setDate(d.getDate() - 7);
    setMonday(d);
  }

  function nextWeek() {
    const d = new Date(monday);
    d.setDate(d.getDate() + 7);
    setMonday(d);
  }

  // Week label in BE
  const startDay = weekDates[0].split('-');
  const endDay = weekDates[6].split('-');
  const startBE = `${String(parseInt(startDay[2])).padStart(2, '0')}/${String(parseInt(startDay[1])).padStart(2, '0')}/${parseInt(startDay[0]) + 543}`;
  const endBE = `${String(parseInt(endDay[2])).padStart(2, '0')}/${String(parseInt(endDay[1])).padStart(2, '0')}/${parseInt(endDay[0]) + 543}`;

  // Day labels with date in BE
  const dayLabels = weekDates.map((d, i) => {
    const parts = d.split('-');
    const be = `${parseInt(parts[2])}/${parseInt(parts[1])}/${parseInt(parts[0]) + 543}`;
    return { day: THAI_DAY_SHORT[i], date: be };
  });

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spin size="large"><span className="sr-only">กำลังโหลดข้อมูล...</span></Spin>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-green-800 font-bold mb-4 text-sm">
          <EnvironmentOutlined /> <span>Agri-Point Management</span>
        </div>
        <h2 className="text-xs text-[#2d6a4f] font-bold uppercase tracking-widest mb-2">Financial Overview</h2>
        <h1 className="text-2xl font-bold text-gray-800">ประวัติและรอบการโอนเงินสัปดาห์</h1>
      </div>

      {/* Week Navigator */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          icon={<LeftOutlined />}
          onClick={prevWeek}
          type="text"
          className="text-gray-500 hover:text-[#1b4332]"
        />
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <CalendarOutlined className="text-gray-400" />
          <span className="font-semibold">รอบวันที่ {startBE} - {endBE}</span>
          {fetchingWeek && <Spin size="small" />}
        </div>
        <Button
          icon={<RightOutlined />}
          onClick={nextWeek}
          type="text"
          className="text-gray-500 hover:text-[#1b4332]"
        />
      </div>

      {/* Weekly Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-x-auto mb-5">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="py-3 px-5 text-left font-bold text-gray-700 bg-white w-40">รายชื่อคนขาย</th>
              {dayLabels.map((dl, i) => {
                const isToday = weekDates[i] === todayStr;
                return (
                  <th
                    key={i}
                    className={`py-3 px-3 text-center font-bold text-xs ${isToday ? 'text-[#1b4332]' : 'text-gray-600'}`}
                  >
                    <div className={`pb-1 ${isToday ? 'border-b-2 border-[#1b4332]' : ''}`}>
                      <p>{dl.day}</p>
                      <p className="text-[10px] font-normal text-gray-400 mt-0.5">{dl.date}</p>
                    </div>
                  </th>
                );
              })}
              <th className="py-3 px-5 text-right font-bold text-gray-700 bg-[#f0fdf4] w-28">ยอดรวม</th>
            </tr>
          </thead>
          <tbody>
            {/* Seller rows */}
            {activeSellers.map(seller => {
              const sellerTotal = entries
                .filter(e => e.sellerId === seller.id)
                .reduce((s, e) => s + e.grandTotal, 0);

              return (
                <tr key={seller.id} className="border-b border-gray-50 hover:bg-gray-50/40">
                  <td className="py-3 px-5 font-bold text-gray-800">{seller.name}</td>
                  {weekDates.map(d => {
                    const entry = entries.find(e => e.sellerId === seller.id && e.date === d);
                    const isToday = d === todayStr;
                    return (
                      <td
                        key={d}
                        className={`py-3 px-3 text-center text-sm ${isToday ? 'bg-green-50/50' : ''}`}
                      >
                        {entry ? (
                          <span className={`font-bold ${isToday ? 'text-[#1b4332]' : 'text-gray-700'}`}>
                            {formatInt(entry.grandTotal)}
                          </span>
                        ) : (
                          <span className="text-gray-300 font-medium">--</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-3 px-5 text-right font-bold text-[#1b4332] bg-[#f0fdf4]">
                    {sellerTotal > 0 ? formatInt(sellerTotal) : '--'}
                  </td>
                </tr>
              );
            })}

            {/* Sort Fee Row */}
            <tr className="border-b border-gray-100">
              <td className="py-3 px-5 text-gray-500 text-xs font-semibold">
                ค่าคอมมิชชั่น (เจ้าของจุด)
                <br />
                <span className="text-gray-400">{SORT_FEE_PER_KG} บาท / กก.</span>
              </td>
              {weekDates.map(d => {
                const dayW = entries.filter(e => e.date === d).reduce((s, e) => s + e.totalWeight, 0);
                const fee = dayW * SORT_FEE_PER_KG;
                const isToday = d === todayStr;
                return (
                  <td key={d} className={`py-3 px-3 text-center text-sm text-gray-500 ${isToday ? 'bg-green-50/30' : 'bg-gray-50'}`}>
                    {fee > 0 ? formatInt(fee) : '--'}
                  </td>
                );
              })}
              <td className="py-3 px-5 text-right font-bold text-gray-500 bg-gray-50">
                {sortFeeTotal > 0 ? formatInt(sortFeeTotal) : '--'}
              </td>
            </tr>

            {/* Grand Total Row */}
            <tr className="bg-[#1e2327]">
              <td className="py-4 px-5 font-bold text-white text-sm rounded-bl-3xl">
                ยอดรวม<br />ทั้งสิ้น
              </td>
              {dayTotals.map((t, i) => {
                const isToday = weekDates[i] === todayStr;
                return (
                  <td key={i} className={`py-4 px-3 text-center font-bold text-sm ${isToday ? 'text-green-300' : 'text-white'}`}>
                    {t > 0 ? formatInt(t) : '-'}
                  </td>
                );
              })}
              <td className="py-4 px-5 text-right font-bold text-green-300 text-base bg-[#2d6a4f] rounded-br-3xl">
                ฿{formatInt(weekGrandTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Info + Print */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 text-gray-500 text-xs">
          <InfoCircleOutlined />
          <span>ยอดเงินรวมไม่คิดค่าธรรมเนียมและค่าคอมนะเกรดหน่อไม้ยังไม่ถึงเงิน เรียบร้อยแล้ว</span>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PrinterOutlined />}
          onClick={() => printWeeklyTable(weekDates, entries, state.sellers)}
          className="bg-[#1b4332] border-none rounded-2xl font-bold px-6 h-12"
        >
          พิมพ์ตารางรอบสัปดาห์ (A4 แนวนอน)
        </Button>
      </div>
    </div>
  );
}
