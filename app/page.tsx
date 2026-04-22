"use client";

import { useState, useEffect } from "react";
import ItemManager from "@/components/ItemManager";
import StoreManager from "@/components/StoreManager"; // 🌟 引入 StoreManager
import RecordManager from "@/components/RecordManager";
import Dashboard from "@/components/Dashboard"; 
import PickupStats from "@/components/PickupStats";

type Item = { id: number; name: string; sellPrice: number; originalPrice: number; };
type Store = { id: number; name: string; category: string; }; // 🌟 字典補上 Store
type PurchaseItem = { id: number; quantity: number; costPrice: number; item: Item; itemId: number; };
type RecordType = { id: number; location: string; buyer: string; paymentMethod: string; purchaseDate: string; pickupLocation: string; pickupCategory: string; isReconciled: boolean; isRefunded: boolean; items: PurchaseItem[]; };

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [stores, setStores] = useState<Store[]>([]); // 🌟 新增 stores 狀態
  const [records, setRecords] = useState<RecordType[]>([]);

  const fetchData = async () => {
    try {
      const [itemsRes, recordsRes, storesRes] = await Promise.all([
        fetch("/api/items", { cache: "no-store" }),
        fetch("/api/records", { cache: "no-store" }),
        fetch("/api/stores", { cache: "no-store" }) // 🌟 讀取 API
      ]);
      
      if (itemsRes.ok) setItems(await itemsRes.json());
      if (recordsRes.ok) setRecords(await recordsRes.json());
      if (storesRes.ok) setStores(await storesRes.json()); // 🌟 寫入狀態
    } catch (error) { 
      console.error("抓取失敗", error); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <main className="min-h-screen p-8 bg-[#F4F6F8] font-sans text-gray-800">
      <div className="max-w-6xl mx-auto space-y-6">
        <Dashboard records={records} />
        <PickupStats records={records} />
        
        {/* 🌟 常用店家清單 */}
        <StoreManager stores={stores} refreshData={fetchData} />
        
        <ItemManager items={items} refreshData={fetchData} />
        
        {/* 🌟 往下傳遞 stores */}
        <RecordManager items={items} stores={stores} records={records} refreshData={fetchData} />
      </div>
    </main>
  );
}