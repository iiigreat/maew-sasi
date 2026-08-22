import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/sellers — ดึงรายชื่อผู้ขายทั้งหมด
export async function GET() {
  try {
    const sellers = await prisma.seller.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(sellers);
  } catch (error) {
    console.error('[GET /api/sellers]', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลผู้ขายได้' }, { status: 500 });
  }
}

// POST /api/sellers — เพิ่มผู้ขายใหม่
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, code, status } = body;

    if (!name) {
      return NextResponse.json({ error: 'กรุณาระบุชื่อผู้ขาย' }, { status: 400 });
    }

    const seller = await prisma.seller.create({
      data: { name, code: code || null, status: status || 'active' },
    });
    return NextResponse.json(seller, { status: 201 });
  } catch (error) {
    console.error('[POST /api/sellers]', error);
    return NextResponse.json({ error: 'ไม่สามารถเพิ่มผู้ขายได้' }, { status: 500 });
  }
}
