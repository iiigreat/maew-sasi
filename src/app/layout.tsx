import type { Metadata } from 'next';
import { Sarabun } from 'next/font/google';
import { ConfigProvider } from 'antd';
import th_TH from 'antd/locale/th_TH';
import { AppProvider } from '@/lib/store';
import AntdRegistry from '@/components/AntdRegistry';
import Sidebar from '@/components/layout/Sidebar';
import MobileDrawer from '@/components/layout/MobileDrawer';
import './globals.css';

const sarabun = Sarabun({
  weight: ['400', '500', '600', '700'],
  subsets: ['thai', 'latin'],
  variable: '--font-sarabun',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ระบบรับซื้อหน่อไม้ฝรั่ง',
  description: 'ระบบบันทึกและสรุปการรับซื้อหน่อไม้ฝรั่งประจำวัน',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${sarabun.variable} h-full`}>
      <body className="h-screen bg-gray-50 font-[family-name:var(--font-sarabun)] overflow-hidden">
        <AntdRegistry>
          <ConfigProvider
            locale={th_TH}
            theme={{
              token: {
                colorPrimary: '#1b4332',
                borderRadius: 10,
                fontFamily: 'var(--font-sarabun), sans-serif',
              },
            }}
          >
            <AppProvider>
              <div className="w-full h-screen bg-[#f8fafc] flex overflow-hidden">
                {/* Desktop Sidebar */}
                <Sidebar />

                {/* Mobile Top Bar + Drawer */}
                <MobileDrawer />

                {/* Main content */}
                <main className="flex-1 overflow-y-auto relative bg-[#f8fafc]">
                  <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-full">
                    {children}
                  </div>
                </main>
              </div>
            </AppProvider>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
