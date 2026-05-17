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
        originalPrice: Number(data.originalPrice) || 0, 
        maxQuantity: Number(data.maxQuantity) || 12, // 🌟 新增：儲存數量上限
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
        originalPrice: Number(data.originalPrice) || 0, 
        maxQuantity: Number(data.maxQuantity) || 12, // 🌟 新增：編輯時也能更新數量上限
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
  } catch (error: any) { // 🌟 加上 any 以便讀取 error.code
    
    // 🌟 新增：如果錯誤代碼是 P2003 (外鍵約束違反)，代表它被購買紀錄綁定了
    if (error.code === 'P2003') {
      console.log(`⚠️ 拒絕刪除：因為該商品已經有購買紀錄綁定。`);
      return NextResponse.json({ error: '此商品已有購買紀錄，為保護帳本完整無法刪除' }, { status: 400 });
    }

    // 其他未知的嚴重錯誤才印出紅字
    console.error("❌ DELETE /api/items 發生錯誤:", error);
    return NextResponse.json({ error: '刪除品項失敗' }, { status: 500 });
  }
}