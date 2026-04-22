import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';
const prisma = new PrismaClient();

export async function GET() {
  try {
    const stores = await prisma.store.findMany({ orderBy: { id: 'desc' } });
    return NextResponse.json(stores, { status: 200 });
  } catch (error) { return NextResponse.json({ error: '讀取失敗' }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const newStore = await prisma.store.create({ data: { name: data.name, category: data.category } });
    return NextResponse.json(newStore, { status: 201 });
  } catch (error) { return NextResponse.json({ error: '新增失敗' }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  try {
    const data = await request.json();
    await prisma.store.delete({ where: { id: data.id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) { return NextResponse.json({ error: '刪除失敗' }, { status: 500 }); }
}