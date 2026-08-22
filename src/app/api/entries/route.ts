import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ─── Helper: แปลง DB record → DailyEntry ที่ frontend ใช้ ─────────────────────
function mapEntry(entry: {
  id: string;
  date: string;
  sellerId: string;
  sellerName: string;
  totalWeight: number;
  grandTotal: number;
  note: string | null;
  createdAt: Date;
  weights: Array<{
    gradeId: string;
    gradeName: string;
    price: number;
    weight: number;
    subtotal: number;
  }>;
}) {
  return {
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
  };
}

// GET /api/entries?date=YYYY-MM-DD           → entries ของวันนั้น
// GET /api/entries?weekDates=d1,d2,d3,...    → entries ของ 7 วัน
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const weekDates = searchParams.get('weekDates');

    let where = {};
    if (date) {
      where = { date };
    } else if (weekDates) {
      const dates = weekDates.split(',').filter(Boolean);
      where = { date: { in: dates } };
    }

    const entries = await prisma.dailyEntry.findMany({
      where,
      include: { weights: true },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(entries.map(mapEntry));
  } catch (error) {
    console.error('[GET /api/entries]', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลรายการได้' }, { status: 500 });
  }
}

// POST /api/entries — สร้างรายการรับซื้อใหม่
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, sellerId, sellerName, entries, note } = body;

    if (!date || !sellerId || !sellerName || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 });
    }

    const totalWeight = entries.reduce((s: number, e: { weight: number }) => s + e.weight, 0);
    const grandTotal = entries.reduce((s: number, e: { subtotal: number }) => s + e.subtotal, 0);

    const entry = await prisma.dailyEntry.create({
      data: {
        date,
        sellerId,
        sellerName,
        totalWeight,
        grandTotal,
        note: note || null,
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
    });

    return NextResponse.json(mapEntry(entry), { status: 201 });
  } catch (error) {
    console.error('[POST /api/entries]', error);
    return NextResponse.json({ error: 'ไม่สามารถบันทึกรายการได้' }, { status: 500 });
  }
}
