"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ItemManager from "@/components/ItemManager";
import StoreManager from "@/components/StoreManager"; 
import RecordManager from "@/components/RecordManager";
import Dashboard from "@/components/Dashboard"; 
import PickupStats from "@/components/PickupStats";

type Item = { id: number; name: string; sellPrice: number; originalPrice: number; maxQuantity: number; };
type Store = { id: number; name: string; category: string; }; 
type PurchaseItem = { id: number; quantity: number; costPrice: number; item: Item; itemId: number; };
type RecordType = { id: number; location: string; buyer: string; paymentMethod: string; purchaseDate: string; pickupLocation: string; pickupCategory: string; isReconciled: boolean; isRefunded: boolean; items: PurchaseItem[]; };

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [stores, setStores] = useState<Store[]>([]); 
  const [records, setRecords] = useState<RecordType[]>([]);
  
  // 🌟 新增：用來記錄「目前使用者在 PickupStats 點擊的目標店鋪」
  const [targetStore, setTargetStore] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [itemsRes, recordsRes, storesRes] = await Promise.all([
        fetch("/api/items", { cache: "no-store" }),
        fetch("/api/records", { cache: "no-store" }),
        fetch("/api/stores", { cache: "no-store" }) 
      ]);
      
      if (itemsRes.ok) setItems(await itemsRes.json());
      if (recordsRes.ok) setRecords(await recordsRes.json());
      if (storesRes.ok) setStores(await storesRes.json()); 
    } catch (error) { 
      console.error("抓取失敗", error); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <main className="min-h-screen p-8 bg-[#F4F6F8] font-sans text-gray-800">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* 按鈕導覽列 */}
        <div className="flex justify-end gap-3 mb-2">
          {/* 🌟 新增：前往最優惠智慧湊單計算頁面的按鈕 */}
          <Link href="/optimizer" className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold py-2 px-5 rounded-full transition shadow-sm flex items-center gap-2">
            ✨ 滿額最優惠湊單計算
          </Link>
          
          <Link href="/statistics" className="bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold py-2 px-5 rounded-full transition shadow-sm flex items-center gap-2">
            📊 蝦皮單日購買分析
          </Link>
        </div>

        <Dashboard records={records} />
        
        {/* 🌟 傳遞 targetStore 與設定函式 */}
        <PickupStats records={records} targetStore={targetStore} setTargetStore={setTargetStore} stores={stores}/>
        
        <StoreManager stores={stores} refreshData={fetchData} />
        <ItemManager items={items} refreshData={fetchData} />
        
        {/* 🌟 傳遞 targetStore 給 RecordManager 讓它進行篩選 */}
        <RecordManager items={items} stores={stores} records={records} refreshData={fetchData} targetStore={targetStore} setTargetStore={setTargetStore} />
      </div>
    </main>
  );
}