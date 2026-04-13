import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';
const prisma = new PrismaClient();

export async function GET() {
  try {
    const records = await prisma.purchaseRecord.findMany({
      orderBy: { purchaseDate: 'desc' },
      include: { items: { include: { item: true } } },
    });
    return NextResponse.json(records, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: '讀取失敗' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const newRecord = await prisma.purchaseRecord.create({
      data: {
        location: data.location,
        buyer: data.buyer,
        paymentMethod: data.paymentMethod,
        pickupLocation: data.pickupLocation,
        items: {
          create: data.recordItems.map((item: any) => ({
            itemId: Number(item.itemId),
            quantity: Number(item.quantity),
            costPrice: Number(item.costPrice) // 🌟 存入單價
          }))
        }
      },
    });
    return NextResponse.json(newRecord, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '新增失敗' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    
    // 如果只有傳 isReconciled，代表只是切換對帳狀態
    if (Object.keys(data).length === 2 && data.isReconciled !== undefined) {
      const updated = await prisma.purchaseRecord.update({
        where: { id: data.id }, data: { isReconciled: data.isReconciled },
      });
      return NextResponse.json(updated, { status: 200 });
    }

    // 🌟 否則就是「完整編輯」：更新主單，並刪除舊明細、建立新明細
    const updatedRecord = await prisma.purchaseRecord.update({
      where: { id: data.id },
      data: {
        location: data.location, buyer: data.buyer,
        paymentMethod: data.paymentMethod, pickupLocation: data.pickupLocation,
        items: {
          deleteMany: {}, // 先清空舊的明細
          create: data.recordItems.map((item: any) => ({
            itemId: Number(item.itemId), quantity: Number(item.quantity), costPrice: Number(item.costPrice)
          }))
        }
      },
    });
    return NextResponse.json(updatedRecord, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: '修改失敗' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const data = await request.json();
    await prisma.purchaseRecord.delete({ where: { id: data.id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: '刪除失敗' }, { status: 500 });
  }
}