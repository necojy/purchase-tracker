import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// 強制 Next.js 每次都去資料庫抓最新資料，不使用快取
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// 讀取所有紀錄
export async function GET() {
  try {
    const records = await prisma.purchaseRecord.findMany({
      orderBy: { purchaseDate: 'desc' }, // 新的排前面
      include: { item: true },           // 🌟 關鍵：把關聯的品項資料也一起抓出來！
    });
    return NextResponse.json(records, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: '讀取紀錄失敗' }, { status: 500 });
  }
}

// 新增紀錄
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const newRecord = await prisma.purchaseRecord.create({
      data: {
        itemId: Number(data.itemId),
        costPrice: Number(data.costPrice),
        location: data.location,
        buyer: data.buyer,
        paymentMethod: data.paymentMethod,
        pickupLocation: data.pickupLocation,
      },
    });
    return NextResponse.json(newRecord, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '新增紀錄失敗' }, { status: 500 });
  }
}

// ... 原本上面的 GET 和 POST 保留著 ...

// 修改紀錄 (PUT)
// 修改紀錄 (PUT)
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const updatedRecord = await prisma.purchaseRecord.update({
      where: { id: data.id },
      data: {
        // 使用三元運算子：如果有傳值才更新，沒傳值就保持原樣 (undefined)
        itemId: data.itemId ? Number(data.itemId) : undefined,
        costPrice: data.costPrice ? Number(data.costPrice) : undefined,
        location: data.location,
        buyer: data.buyer,
        pickupLocation: data.pickupLocation,
        isReconciled: data.isReconciled, // 🌟 接收對帳狀態
      },
    });
    return NextResponse.json(updatedRecord, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: '修改紀錄失敗' }, { status: 500 });
  }
}

// 刪除紀錄 (DELETE)
export async function DELETE(request: Request) {
  try {
    const data = await request.json();
    await prisma.purchaseRecord.delete({
      where: { id: data.id },
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: '刪除紀錄失敗' }, { status: 500 });
  }
}