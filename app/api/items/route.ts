import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic'; // 強制不快取

const prisma = new PrismaClient();

// 讀取所有品項
export async function GET() {
  try {
    const items = await prisma.item.findMany({
      orderBy: { id: 'desc' } // 新的排前面
    });
    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: '讀取品項失敗' }, { status: 500 });
  }
}

// 新增一個品項
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const newItem = await prisma.item.create({
      data: {
        name: data.name,
        sellPrice: Number(data.sellPrice),
      },
    });
    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '新增品項失敗' }, { status: 500 });
  }
}

// 修改品項 (PUT)
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const updatedItem = await prisma.item.update({
      where: { id: data.id }, // 告訴資料庫要修改哪一筆
      data: {
        name: data.name,
        sellPrice: Number(data.sellPrice),
      },
    });
    return NextResponse.json(updatedItem, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: '修改品項失敗' }, { status: 500 });
  }
}

// 刪除品項 (DELETE)
export async function DELETE(request: Request) {
  try {
    const data = await request.json();
    await prisma.item.delete({
      where: { id: data.id }, // 告訴資料庫要刪除哪一筆
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: '刪除品項失敗' }, { status: 500 });
  }
}