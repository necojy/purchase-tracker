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
        pickupCategory: data.pickupCategory, // 🌟 這裡新增：接收並存入取貨類別 (蝦皮/超商)
        items: {
          create: data.recordItems.map((item: any) => ({
            itemId: Number(item.itemId),
            quantity: Number(item.quantity),
            costPrice: Number(item.costPrice)
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
    
    // 如果沒有傳入 recordItems，代表只是「快速切換狀態 (對帳 或 退款)」
    if (!data.recordItems) {
      const updated = await prisma.purchaseRecord.update({
        where: { id: data.id }, 
        data: { 
          ...(data.isReconciled !== undefined && { isReconciled: data.isReconciled }),
          ...(data.isRefunded !== undefined && { isRefunded: data.isRefunded })
        },
      });
      return NextResponse.json(updated, { status: 200 });
    }

    // 否則就是「完整編輯」
    const updatedRecord = await prisma.purchaseRecord.update({
      where: { id: data.id },
      data: {
        location: data.location, 
        buyer: data.buyer,
        paymentMethod: data.paymentMethod, 
        pickupLocation: data.pickupLocation,
        pickupCategory: data.pickupCategory, // 🌟 這裡新增：編輯時也能更新取貨類別
        items: {
          deleteMany: {},
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