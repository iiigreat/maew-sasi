import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/entries/[id] — แก้ไขรายการ (อัปเดต weights)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { entries, note } = body;

    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: 'กรุณากรอกน้ำหนักอย่างน้อย 1 เกรด' }, { status: 400 });
    }

    const totalWeight = entries.reduce((s: number, e: { weight: number }) => s + e.weight, 0);
    const grandTotal = entries.reduce((s: number, e: { subtotal: number }) => s + e.subtotal, 0);

    // ลบ WeightEntries เดิม แล้วสร้างใหม่
    const updated = await prisma.$transaction([
      prisma.weightEntry.deleteMany({ where: { dailyEntryId: id } }),
      prisma.dailyEntry.update({
        where: { id },
        data: {
          totalWeight,
          grandTotal,
          note: note !== undefined ? note || null : undefined,
          weights: {
            create: entries.map((e: {
              gradeId: string;
              gradeName: string;
              price: number;
              weight: number;
              subtotal: number;
            }) => ({
              gradeId: e.gradeId,
              gradeName: e.gradeName,
              price: e.price,
              weight: e.weight,
              subtotal: e.subtotal,
            })),
          },
        },
        include: { weights: true },
      }),
    ]);

    const entry = updated[1];
    return NextResponse.json({
      id: entry.id,
      date: entry.date,
      sellerId: entry.sellerId,
      sellerName: entry.sellerName,
      totalWeight: entry.totalWeight,
      grandTotal: entry.grandTotal,
      note: entry.note ?? undefined,
      createdAt: entry.createdAt.toISOString(),
      entries: entry.weights.map((w) => ({
        gradeId: w.gradeId,
        gradeName: w.gradeName,
        price: w.price,
        weight: w.weight,
        subtotal: w.subtotal,
      })),
    });
  } catch (error) {
    console.error('[PUT /api/entries/[id]]', error);
    return NextResponse.json({ error: 'ไม่สามารถแก้ไขรายการได้' }, { status: 500 });
  }
}

// DELETE /api/entries/[id] — ลบรายการ (weights ถูกลบ cascade อัตโนมัติ)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.dailyEntry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/entries/[id]]', error);
    return NextResponse.json({ error: 'ไม่สามารถลบรายการได้' }, { status: 500 });
  }
}
