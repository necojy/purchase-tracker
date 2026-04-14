"use client";

import { useState, useEffect } from "react";
import ItemManager from "@/components/ItemManager";
import RecordManager from "@/components/RecordManager";
import Dashboard from "@/components/Dashboard"; 

// 🌟 字典更新：加上 originalPrice
type Item = { id: number; name: string; sellPrice: number; originalPrice: number; };
type PurchaseItem = { id: number; quantity: number; costPrice: number; item: Item; itemId: number; };
type RecordType = { 
  id: number; 
  location: string; 
  buyer: string; 
  paymentMethod: string; 
  purchaseDate: string; 
  pickupLocation: string; 
  isReconciled: boolean; 
  items: PurchaseItem[]; 
};

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [records, setRecords] = useState<RecordType[]>([]);

  const fetchData = async () => {
    try {
      const [itemsRes, recordsRes] = await Promise.all([
        fetch("/api/items", { cache: "no-store" }),
        fetch("/api/records", { cache: "no-store" })
      ]);
      
      if (itemsRes.ok) {
        const data = await itemsRes.json();
        setItems(Array.isArray(data) ? data : []);
      } else {
        console.error("品項 API 發生錯誤");
      }

      if (recordsRes.ok) {
        const data = await recordsRes.json();
        setRecords(Array.isArray(data) ? data : []);
      } else {
        console.error("紀錄 API 發生錯誤");
      }
      
    } catch (error) { 
      console.error("抓取失敗", error); 
    }
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