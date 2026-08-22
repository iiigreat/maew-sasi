# 🌿 ระบบรับซื้อหน่อไม้ฝรั่ง (Maew)

ระบบบันทึกและสรุปการรับซื้อหน่อไม้ฝรั่งประจำวัน สำหรับใช้งานภายในฟาร์ม  
รองรับการบันทึกน้ำหนักแยกตามเกรด คำนวณยอดเงิน และพิมพ์ใบเสร็จ

---

## ✨ ฟีเจอร์หลัก

| หน้า | รายละเอียด |
|------|------------|
| **รายวัน** `/daily` | บันทึกรายการรับซื้อประจำวัน แยกน้ำหนักตามเกรด A/B/C/ตกเกรด |
| **รายสัปดาห์** `/weekly` | สรุปยอดรายสัปดาห์ พิมพ์ตารางสรุป |
| **บิลเจ้านาย** `/boss-bill` | สรุปยอดรวมรายวัน สำหรับส่งเจ้าของฟาร์ม |
| **ตั้งค่า** `/settings` | จัดการรายชื่อผู้ขาย และกำหนดราคาตามเกรด |

---

## 🛠️ Tech Stack

| ส่วน | เทคโนโลยี |
|------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| UI Library | [Ant Design 6](https://ant.design/) + `@ant-design/icons` |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Language | TypeScript 5 |
| Database | PostgreSQL via [Prisma 7](https://www.prisma.io/) + `@prisma/adapter-pg` |
| State | React Context API (`src/lib/store.tsx`) |
| Runtime | React 19 |

---

## 🗂️ โครงสร้างโปรเจค

```
maew/
├── prisma/
│   └── schema.prisma           # Database schema
│
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout (Sidebar, AntdRegistry, ConfigProvider)
│   │   ├── page.tsx            # หน้า root
│   │   ├── daily/              # หน้าบันทึกรายวัน
│   │   ├── weekly/             # หน้าสรุปรายสัปดาห์
│   │   ├── boss-bill/          # หน้าบิลเจ้านาย
│   │   ├── settings/           # หน้าตั้งค่า
│   │   └── api/
│   │       ├── entries/        # CRUD รายการรับซื้อ
│   │       ├── sellers/        # CRUD ผู้ขาย
│   │       ├── grades/         # CRUD เกรดราคา
│   │       └── seed/           # Seed ข้อมูลเริ่มต้น
│   │
│   ├── components/
│   │   ├── AntdRegistry.tsx    # SSR registry สำหรับ Ant Design
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx     # เมนู sidebar (desktop)
│   │   │   └── MobileDrawer.tsx # เมนู drawer (mobile)
│   │   └── print/
│   │       ├── printBossBill.ts      # พิมพ์บิลเจ้านาย
│   │       ├── printSellerBill.ts    # พิมพ์บิลผู้ขายรายคน
│   │       └── printWeeklyTable.ts   # พิมพ์ตารางสรุปสัปดาห์
│   │
│   ├── lib/
│   │   ├── store.tsx           # Global state (React Context)
│   │   ├── prisma.ts           # Prisma client instance
│   │   ├── constants.ts        # เกรดเริ่มต้น, ค่าคัดแยก
│   │   └── utils.ts            # Helper functions
│   │
│   ├── models/
│   │   └── types.ts            # TypeScript types ทั้งโปรเจค
│   │
│   └── data/
│       └── entries.json        # ข้อมูลตัวอย่าง / fallback
│
├── .env                        # Environment variables (ไม่ commit)
├── next.config.ts
└── package.json
```

---

## 🗄️ Database Schema

```
Seller ─────────────────── DailyEntry ─────────────────── WeightEntry
  id (cuid)                  id (cuid)                      id (cuid)
  name                       date (YYYY-MM-DD)               dailyEntryId → DailyEntry
  code?                      sellerId → Seller               gradeId
  status (active/inactive)   sellerName                      gradeName
                             totalWeight                     price
                             grandTotal                      weight
                             note?                           subtotal

Grade
  id · name · price · badge (A/B/C/F) · color
```

### เกรดและราคาเริ่มต้น

| เกรด | ราคา (บาท/กก.) |
|------|:--------------:|
| A ตูม | 120 |
| A บาน | 95 |
| B ตูม | 85 |
| B บาน | 65 |
| C ตูม | 45 |
| C บาน | 30 |
| ตกเกรด / อื่นๆ | 10 |

> ค่าคัดแยก: **5 บาท/กก.** (หักออกจากยอดรวม)

---

## 🚀 วิธีรันโปรเจค

### 1. ติดตั้ง dependencies

```bash
npm install
```

### 2. ตั้งค่า environment

สร้างไฟล์ `.env` ที่ root:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

### 3. Migrate database

```bash
npx prisma migrate dev
```

### 4. Seed ข้อมูลเริ่มต้น (เกรด)

```bash
# เรียก API seed หลังจากรัน dev server แล้ว
curl -X POST http://localhost:3000/api/seed
```

### 5. รัน dev server

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000) ในเบราว์เซอร์

---

## 📦 Scripts

| คำสั่ง | รายละเอียด |
|--------|-----------|
| `npm run dev` | รัน development server (Turbopack) |
| `npm run build` | Build production |
| `npm run start` | รัน production server |
| `npm run lint` | ตรวจสอบ ESLint |
| `npx prisma studio` | เปิด GUI จัดการ database |
| `npx prisma migrate dev` | Migrate schema |


## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
