import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/sellers/[id] — แก้ไขข้อมูลผู้ขาย
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, code, status } = body;

    const seller = await prisma.seller.update({
      where: { id },
      data: { name, code: code || null, status },
    });
    return NextResponse.json(seller);
  } catch (error) {
    console.error('[PUT /api/sellers/[id]]', error);
    return NextResponse.json({ error: 'ไม่สามารถแก้ไขผู้ขายได้' }, { status: 500 });
  }
}

// DELETE /api/sellers/[id] — ลบผู้ขาย
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.seller.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/sellers/[id]]', error);
    return NextResponse.json({ error: 'ไม่สามารถลบผู้ขายได้' }, { status: 500 });
  }
}
