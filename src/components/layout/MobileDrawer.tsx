'use client';

import { useState } from 'react';
import { Drawer, Button } from 'antd';
import { MenuOutlined, EnvironmentOutlined } from '@ant-design/icons';
import NavItems from './NavItems';

export default function MobileDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Topbar for mobile */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-100 shadow-sm px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <EnvironmentOutlined className="text-xl text-green-700" />
          <span className="font-bold text-[#1b4332] text-sm">ระบบรับซื้อหน่อไม้ฝรั่ง</span>
        </div>
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={() => setOpen(true)}
          className="text-[#1b4332]"
        />
      </header>

      <Drawer
        title={
          <div className="flex items-center gap-2">
            <EnvironmentOutlined className="text-xl text-green-700" />
            <span className="font-bold text-[#1b4332]">เมนู</span>
          </div>
        }
        placement="left"
        open={open}
        onClose={() => setOpen(false)}
        size="default"
        styles={{ body: { padding: 0 } }}
      >
        <NavItems onSelect={() => setOpen(false)} />
      </Drawer>
    </>
  );
}
