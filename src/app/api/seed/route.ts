import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const SELLERS = [
  { id: 's1',  name: 'สมชาย ทัพผล',      code: 'AG-001', status: 'active' },
  { id: 's2',  name: 'วิไลกัญญา มั่นคง', code: 'AG-002', status: 'active' },
  { id: 's3',  name: 'ลำนาจ เจริญดี',    code: 'AG-003', status: 'active' },
  { id: 's4',  name: 'ประกาศ เขียวสาย',  code: 'AG-004', status: 'active' },
  { id: 's5',  name: 'ลุงบุญส่ง',        code: 'AG-005', status: 'active' },
  { id: 's6',  name: 'น้าสมปอง',         code: 'AG-006', status: 'active' },
  { id: 's7',  name: 'ป้าจันทร์',        code: 'AG-007', status: 'inactive' },
  { id: 's8',  name: 'สมร รักเกษตร',     code: 'AG-008', status: 'active' },
  { id: 's9',  name: 'วิชัย ส่วนสวย',    code: 'AG-009', status: 'active' },
  { id: 's10', name: 'นางประนอม มุ่งมั่น', code: 'AG-010', status: 'active' },
];

const GRADES = [
  { id: 'a-toom',   name: 'A ตูม',         price: 120, badge: 'A', color: 'orange' },
  { id: 'a-baan',   name: 'A บาน',         price: 95,  badge: 'A', color: 'orange' },
  { id: 'b-toom',   name: 'B ตูม',         price: 85,  badge: 'B', color: 'green'  },
  { id: 'b-baan',   name: 'B บาน',         price: 65,  badge: 'B', color: 'green'  },
  { id: 'c-toom',   name: 'C ตูม',         price: 45,  badge: 'C', color: 'cyan'   },
  { id: 'c-baan',   name: 'C บาน',         price: 30,  badge: 'C', color: 'cyan'   },
  { id: 'offgrade', name: 'ตกเกรด / อื่นๆ', price: 10, badge: 'F', color: 'red'   },
];

// POST /api/seed — seed ข้อมูลเริ่มต้น (เรียกใช้ครั้งเดียว)
export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'ไม่อนุญาตใน production' }, { status: 403 });
  }

  try {
    // Seed Sellers (upsert เพื่อไม่ให้ซ้ำ)
    await prisma.$transaction(
      SELLERS.map((s) =>
        prisma.seller.upsert({
          where: { id: s.id },
          update: { name: s.name, code: s.code, status: s.status },
          create: { id: s.id, name: s.name, code: s.code, status: s.status },
        })
      )
    );

    // Seed Grades
    await prisma.$transaction(
      GRADES.map((g) =>
        prisma.grade.upsert({
          where: { id: g.id },
          update: { name: g.name, price: g.price, badge: g.badge, color: g.color },
          create: { id: g.id, name: g.name, price: g.price, badge: g.badge, color: g.color },
        })
      )
    );

    const sellerCount = await prisma.seller.count();
    const gradeCount = await prisma.grade.count();

    return NextResponse.json({
      success: true,
      message: 'Seed สำเร็จ',
      sellers: sellerCount,
      grades: gradeCount,
    });
  } catch (error) {
    console.error('[POST /api/seed]', error);
    return NextResponse.json({ error: 'Seed ล้มเหลว', detail: String(error) }, { status: 500 });
  }
}
