'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FormOutlined,
  BarChartOutlined,
  CalendarOutlined,
  SettingOutlined,
} from '@ant-design/icons';

const NAV_ITEMS = [
  { icon: <FormOutlined />,      label: 'รับซื้อรายวัน',     short: 'รับซื้อ',   path: '/daily'     },
  { icon: <BarChartOutlined />,  label: 'สรุปส่งเถ้าแก่',    short: 'ส่งเถ้าแก่', path: '/boss-bill' },
  { icon: <CalendarOutlined />,  label: 'ประวัติ & สัปดาห์', short: 'ประวัติ',   path: '/weekly'    },
  { icon: <SettingOutlined />,   label: 'ตั้งค่า & จัดการ',  short: 'ตั้งค่า',   path: '/settings'  },
];

interface NavItemsProps {
  onSelect?: () => void;
}

export default function NavItems({ onSelect }: NavItemsProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2">
      {NAV_ITEMS.map(item => {
        const active = pathname.startsWith(item.path);
        return (
          <Link
            key={item.path}
            href={item.path}
            onClick={onSelect}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              active
                ? 'bg-[#1b4332] text-white shadow-md'
                : 'text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-medium text-sm">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
