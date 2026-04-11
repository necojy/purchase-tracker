import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// 🌟 加入這一行，強制 Next.js 每次都去資料庫抓最新資料！
export const dynamic = 'force-dynamic';

// 初始化 Prisma 勾點
const prisma = new PrismaClient();

// ... 下面的 POST 和 GET 程式碼都完全不用動 ...

export async function POST(request: Request) {
  try {
    // 取得前端傳過來的資料
    const data = await request.json();

    // 透過 Prisma 將購買紀錄寫入資料庫
    const newRecord = await prisma.purchaseRecord.create({
      data: {
        itemId: Number(data.itemId), // 確保轉換為數字格式
        costPrice: Number(data.costPrice),
        location: data.location,
        buyer: data.buyer,
        paymentMethod: data.paymentMethod,
        pickupLocation: data.pickupLocation,
        // purchaseDate 如果前端沒傳，資料庫會自動帶入當下時間
      },
    });

    // 成功的話，回傳 201 狀態碼與新增的資料
    return NextResponse.json(newRecord, { status: 201 });
  } catch (error) {
    console.error("API 發生錯誤:", error);
    // 失敗的話，回傳 500 狀態碼與錯誤訊息
    return NextResponse.json({ error: '新增購買紀錄失敗' }, { status: 500 });
  }
}

// 新增這段 GET 函式
export async function GET() {
  try {
    // 透過 Prisma 從資料庫撈出所有購買紀錄
    const records = await prisma.purchaseRecord.findMany({
      orderBy: { purchaseDate: 'desc' }, // 讓最新的紀錄排在最上面
      include: { item: true },           // 把關聯的品項 (Item) 資訊也一起抓出來
    });
    
    return NextResponse.json(records, { status: 200 });
  } catch (error) {
    console.error("讀取失敗:", error);
    return NextResponse.json({ error: '讀取紀錄失敗' }, { status: 500 });
  }
}