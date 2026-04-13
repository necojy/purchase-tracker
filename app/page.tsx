"use client";

import { useState, useEffect } from "react";
import ItemManager from "@/components/ItemManager";
import RecordManager from "@/components/RecordManager";
import Dashboard from "@/components/Dashboard"; 

type Item = { id: number; name: string; sellPrice: number; };
type RecordType = { id: number; costPrice: number; location: string; buyer: string; purchaseDate: string; item: Item; itemId: number; pickupLocation: string; isReconciled: boolean; };

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [records, setRecords] = useState<RecordType[]>([]);

  const fetchData = async () => {
    try {
      const [itemsRes, recordsRes] = await Promise.all([
        fetch("/api/items", { cache: "no-store" }),
        fetch("/api/records", { cache: "no-store" })
      ]);
      setItems(await itemsRes.json());
      setRecords(await recordsRes.json());
    } catch (error) { console.error("抓取失敗", error); }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <main className="min-h-screen p-8 bg-[#F4F6F8] font-sans text-gray-800">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* 1. 最上方的統計儀表板 */}
        <Dashboard records={records} />

        {/* 2. 常用商品清單 */}
        <ItemManager items={items} refreshData={fetchData} />

        {/* 3. 購買與獲利紀錄 */}
        <RecordManager items={items} records={records} refreshData={fetchData} />

      </div>
    </main>
  );
}