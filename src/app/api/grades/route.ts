import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/grades — ดึงเกรดทั้งหมด
export async function GET() {
  try {
    const grades = await prisma.grade.findMany();
    return NextResponse.json(grades);
  } catch (error) {
    console.error('[GET /api/grades]', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลเกรดได้', detail: String(error) }, { status: 500 });
  }
}

// PUT /api/grades — อัปเดตราคาเกรดทั้งหมด (bulk update)
export async function PUT(req: NextRequest) {
  try {
    const grades: Array<{ id: string; name: string; price: number; badge?: string; color?: string }> =
      await req.json();

    // ทำ upsert แต่ละเกรด
    const updated = await prisma.$transaction(
      grades.map((g) =>
        prisma.grade.upsert({
          where: { id: g.id },
          update: { name: g.name, price: g.price, badge: g.badge, color: g.color },
          create: { id: g.id, name: g.name, price: g.price, badge: g.badge, color: g.color },
        })
      )
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PUT /api/grades]', error);
    return NextResponse.json({ error: 'ไม่สามารถอัปเดตราคาเกรดได้' }, { status: 500 });
  }
}
