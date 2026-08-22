'use client';

import NavItems from './NavItems';
import { EnvironmentOutlined, UserOutlined } from '@ant-design/icons';

export default function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-64 h-full bg-[#2a3036] border-r border-gray-800 shadow-sm z-20">
      {/* Logo / Brand */}
      <div className="px-6 py-8 flex flex-col items-center">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md mb-4">
          <EnvironmentOutlined className="text-3xl text-green-700" />
        </div>
        <h2 className="text-white font-bold text-lg tracking-wide">Agri-Point</h2>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-2 px-3">
        <NavItems />
      </div>

      {/* Footer / Profile */}
      <div className="px-4 py-4 mt-auto">
        <div className="flex items-center gap-3 p-3 bg-[#1e2327] rounded-xl border border-gray-700">
          <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-white">
            <UserOutlined className="text-xs" />
          </div>
          <div>
            <p className="text-xs text-white font-medium">พนักงานรับซื้อ</p>
            <p className="text-[10px] text-gray-400">สาขาหลัก</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
