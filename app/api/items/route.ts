import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';
const prisma = new PrismaClient();

export async function GET() {
  try {
    const items = await prisma.item.findMany({ orderBy: { id: 'desc' } });
    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    console.error("❌ GET /api/items 發生錯誤:", error);
    return NextResponse.json({ error: '讀取品項失敗' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const newItem = await prisma.item.create({
      data: {
        name: data.name,
        sellPrice: Number(data.sellPrice),
        originalPrice: Number(data.originalPrice) || 0, // 🌟 接收原價
      },
    });
    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error("❌ POST /api/items 發生錯誤:", error);
    return NextResponse.json({ error: '新增品項失敗' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const updatedItem = await prisma.item.update({
      where: { id: data.id },
      data: {
        name: data.name,
        sellPrice: Number(data.sellPrice),
        originalPrice: Number(data.originalPrice) || 0, // 🌟 修改原價
      },
    });
    return NextResponse.json(updatedItem, { status: 200 });
  } catch (error) {
    console.error("❌ PUT /api/items 發生錯誤:", error);
    return NextResponse.json({ error: '修改品項失敗' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const data = await request.json();
    await prisma.item.delete({ where: { id: data.id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("❌ DELETE /api/items 發生錯誤:", error);
    return NextResponse.json({ error: '刪除品項失敗' }, { status: 500 });
  }
}