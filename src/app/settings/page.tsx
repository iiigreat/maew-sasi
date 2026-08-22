'use client';

import { useState } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, Popconfirm, message, InputNumber, Spin,
} from 'antd';
import {
  SearchOutlined, EditOutlined, DeleteOutlined, PlusOutlined, EnvironmentOutlined, UserOutlined, TagOutlined, NotificationOutlined, SaveOutlined
} from '@ant-design/icons';
import { useApp } from '@/lib/store';
import { Seller } from '@/models/types';

export default function SettingsPage() {
  const { state, addSeller, updateSeller, deleteSeller, updateGrades } = useApp();
  const [sellerModal, setSellerModal] = useState<{ open: boolean; editing: Seller | null }>({ open: false, editing: null });
  const [editingPrices, setEditingPrices] = useState(false);
  const [editPrices, setEditPrices] = useState<Record<string, number>>({});
  const [form] = Form.useForm();
  const [msgApi, ctxHolder] = message.useMessage();
  const [sellerSaving, setSellerSaving] = useState(false);
  const [pricesSaving, setPricesSaving] = useState(false);
  const [searchText, setSearchText] = useState('');

  // ── Seller handlers ──────────────────────────────────────────────────────
  function openAddSeller() {
    form.resetFields();
    setSellerModal({ open: true, editing: null });
  }

  function openEditSeller(seller: Seller) {
    form.setFieldsValue(seller);
    setSellerModal({ open: true, editing: seller });
  }

  async function handleSaveSeller() {
    try {
      const vals = await form.validateFields();
      setSellerSaving(true);
      if (sellerModal.editing) {
        await updateSeller({ ...sellerModal.editing, ...vals });
        msgApi.success('แก้ไขผู้ขายสำเร็จ');
      } else {
        await addSeller(vals);
        msgApi.success('เพิ่มผู้ขายสำเร็จ');
      }
      setSellerModal({ open: false, editing: null });
    } catch (err) {
      if (err instanceof Error) msgApi.error(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSellerSaving(false);
    }
  }

  // ── Grade price handlers ──────────────────────────────────────────────────
  function startEditPrices() {
    const map: Record<string, number> = {};
    state.grades.forEach(g => { map[g.id] = g.price; });
    setEditPrices(map);
    setEditingPrices(true);
  }

  async function handleSavePrices() {
    setPricesSaving(true);
    try {
      const updated = state.grades.map(g => ({ ...g, price: editPrices[g.id] ?? g.price }));
      await updateGrades(updated);
      setEditingPrices(false);
      msgApi.success('บันทึกราคาสำเร็จ');
    } catch (err) {
      if (err instanceof Error) msgApi.error(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setPricesSaving(false);
    }
  }

  const filteredSellers = state.sellers.filter(s =>
    s.name.toLowerCase().includes(searchText.toLowerCase()) ||
    (s.code?.toLowerCase() ?? '').includes(searchText.toLowerCase())
  );

  const sellerColumns = [
    {
      title: 'ชื่อเล่น', dataIndex: 'name', key: 'name',
      render: (v: string) => <span className="font-bold text-gray-800">{v}</span>,
    },
    { title: 'รหัสสมาชิก', dataIndex: 'code', key: 'code', render: (v?: string) => <span className="text-gray-500">{v || '-'}</span> },
    {
      title: 'สถานะ', dataIndex: 'status', key: 'status',
      render: (v: string) => (
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${v === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
          {v === 'active' ? 'กำลังส่ง' : 'หยุดส่งชั่วคราว'}
        </span>
      ),
    },
    {
      title: 'จัดการ', key: 'actions', align: 'center' as const,
      render: (_: unknown, record: Seller) => (
        <div className="flex gap-2 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Button type="text" size="small" icon={<EditOutlined className="text-gray-400 hover:text-green-600" />} onClick={() => openEditSeller(record)} />
          <Popconfirm
            title="ยืนยันการลบ"
            description={`ลบผู้ขาย "${record.name}"?`}
            onConfirm={async () => {
              try {
                await deleteSeller(record.id);
                msgApi.success('ลบเรียบร้อย');
              } catch (err) {
                if (err instanceof Error) msgApi.error(err.message || 'ลบไม่สำเร็จ');
              }
            }}
            okText="ลบ" cancelText="ยกเลิก" okButtonProps={{ danger: true }}
          >
            <Button type="text" size="small" icon={<DeleteOutlined className="text-gray-400 hover:text-red-500" />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

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
      
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-green-800 font-bold mb-4 text-sm">
          <EnvironmentOutlined /> <span>Agri-Point Management</span>
        </div>
        <h2 className="text-xs text-[#2d6a4f] font-bold uppercase tracking-widest mb-2">System Configuration</h2>
        <h1 className="text-xl font-bold text-gray-800 mb-2">ตั้งค่า &amp; จัดการระบบ</h1>
        <p className="text-[13px] text-gray-500 max-w-xl leading-relaxed">
          จัดการข้อมูลพื้นฐานของสมาชิกผู้ขายและกำหนดราคารับซื้อตามเกรดมาตรฐาน เพื่อความถูกต้องในการคำนวณรายได้
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Left Column */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Top Stats */}
          <div className="flex gap-4 mb-6">
            <div className="bg-[#f1f5f9] rounded-2xl p-4 flex items-center gap-4 w-48 border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-lg"><UserOutlined /></div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold mb-0.5">ผู้ขายทั้งหมด</p>
                  <p className="text-lg font-bold text-gray-800 leading-none">{state.sellers.length}</p>
                </div>
            </div>
            <div className="bg-[#f1f5f9] rounded-2xl p-4 flex items-center gap-4 w-48 border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-[#9c6644] text-lg"><TagOutlined /></div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold mb-0.5">เกรดราคา</p>
                  <p className="text-lg font-bold text-gray-800 leading-none">{state.grades.length}</p>
                </div>
            </div>
          </div>

          {/* Sellers Table */}
          <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-6">
              <Input 
                prefix={<SearchOutlined className="text-gray-400" />} 
                placeholder="ค้นหาชื่อเล่นผู้ขาย..." 
                className="max-w-[240px] rounded-full bg-gray-50 border-gray-200 hover:border-green-400 focus:border-green-500 py-1.5"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
              />
              <Button 
                type="primary" 
                className="bg-[#1b4332] hover:bg-[#2d6a4f] border-none rounded-full px-6 h-9" 
                icon={<PlusOutlined />} 
                onClick={openAddSeller}
              >
                เพิ่มคนขายใหม่
              </Button>
            </div>
            
            <div className="flex-1 overflow-auto custom-scrollbar">
              <Table
                dataSource={filteredSellers}
                columns={sellerColumns}
                rowKey="id"
                pagination={false}
                size="middle"
                rowClassName="group hover:bg-gray-50/50"
                locale={{ emptyText: 'ไม่พบผู้ขาย' }}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Prices */}
        <div className="w-full lg:w-[300px] flex flex-col gap-4 shrink-0">
           <div className="bg-[#e2e8f0] rounded-3xl p-5 flex flex-col flex-1 min-h-0 shadow-inner">
             <div className="flex justify-between items-start mb-6">
               <div>
                 <h3 className="font-bold text-gray-800 text-sm">ราคารับซื้อ</h3>
                 <p className="text-[10px] text-gray-500 mt-1">อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
               </div>
               {!editingPrices ? (
                 <Button type="primary" className="bg-[#9c6644] hover:bg-[#b07d5b] border-none rounded-xl h-10 px-4 font-bold" icon={<EditOutlined />} onClick={startEditPrices}>
                    แก้ไข<br/>ราคา
                 </Button>
               ) : (
                  <div className="flex flex-col gap-2">
                    <Button type="primary" icon={<SaveOutlined />} onClick={handleSavePrices} loading={pricesSaving} className="bg-[#1b4332] rounded-lg">บันทึก</Button>
                    <Button onClick={() => setEditingPrices(false)} size="small" type="text" disabled={pricesSaving}>ยกเลิก</Button>
                  </div>
               )}
             </div>

             <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1">
               {/* Grades List */}
               {state.grades.map(g => {
                 const isTopGrade = g.name.startsWith('A');
                 const borderColor = isTopGrade ? 'border-[#9c6644]' : (g.name.startsWith('B') ? 'border-green-500' : 'border-gray-300');
                 
                 return (
                 <div key={g.id} className={`bg-white rounded-xl p-3 flex justify-between items-center shadow-sm border-l-4 ${borderColor}`}>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{g.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{g.badge || 'พรีเมียม / มาตรฐาน'}</p>
                    </div>
                    {editingPrices ? (
                      <InputNumber
                        className="w-20"
                        min={0}
                        value={editPrices[g.id]}
                        onChange={val => setEditPrices(prev => ({ ...prev, [g.id]: val ?? 0 }))}
                        size="small"
                      />
                    ) : (
                       <p className="font-bold text-gray-800 text-lg">{g.price} <span className="text-xs font-normal text-gray-500 ml-1">B</span></p>
                    )}
                 </div>
                 );
               })}
             </div>
           </div>

           {/* Info Box */}
           <div className="bg-[#1b4332] rounded-3xl p-6 text-white shadow-lg">
             <NotificationOutlined className="text-2xl mb-3 text-green-300" />
             <h4 className="font-bold text-sm mb-2">ระบบราคาอัตโนมัติ</h4>
             <p className="text-[11px] text-white/80 leading-relaxed">
               คุณสามารถตั้งเวลาปรับราคาล่วงหน้าได้ในเมนู &apos;ตั้งค่าขั้นสูง&apos; เพื่อความสะดวกในการจัดการรอบสัปดาห์
             </p>
           </div>
        </div>
      </div>

      {/* Seller Modal */}
      <Modal
        open={sellerModal.open}
        onCancel={() => setSellerModal({ open: false, editing: null })}
        onOk={handleSaveSeller}
        title={sellerModal.editing ? 'แก้ไขผู้ขาย' : 'เพิ่มผู้ขายใหม่'}
        okText="บันทึก"
        cancelText="ยกเลิก"
        okButtonProps={{ className: 'bg-[#1b4332]', loading: sellerSaving }}
        cancelButtonProps={{ disabled: sellerSaving }}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="name" label="ชื่อผู้ขาย (ชื่อเล่น)" rules={[{ required: true, message: 'กรุณากรอกชื่อ' }]}>
            <Input placeholder="เช่น ลุงบุญมี" className="rounded-lg" />
          </Form.Item>
          <Form.Item name="code" label="รหัสสมาชิก">
            <Input placeholder="เช่น AG-001" className="rounded-lg" />
          </Form.Item>
          <Form.Item name="status" label="สถานะ" initialValue="active">
            <Select 
              options={[
                { value: 'active', label: 'กำลังส่ง (Active)' }, 
                { value: 'inactive', label: 'หยุดส่งชั่วคราว (Inactive)' }
              ]} 
              className="rounded-lg"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
