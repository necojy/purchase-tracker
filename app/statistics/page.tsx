"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type Item = { id: number; name: string; sellPrice: number; };
type PurchaseItem = { id: number; quantity: number; costPrice: number; item: Item; };
type RecordType = { id: number; location: string; buyer: string; purchaseDate: string; isReconciled: boolean; isRefunded: boolean; items: PurchaseItem[]; };

// 🌟 為每位成員設定專屬的圖表顏色
const BUYER_COLORS: Record<string, string> = {
  "全部": "#F97316", // 橘色 (預設)
  "洪": "#3B82F6",   // 藍色
  "雅": "#10B981",   // 綠色
  "宥": "#F59E0B",   // 黃色
  "崑": "#8B5CF6",   // 紫色
};

export default function StatisticsPage() {
  const [records, setRecords] = useState<RecordType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const todayStr = new Date().toLocaleDateString('en-CA'); 
  const [selectedDate, setSelectedDate] = useState(todayStr);
  
  // 🌟 新增狀態：目前選擇的人員 (預設為全部)
  const [selectedBuyer, setSelectedBuyer] = useState("全部");

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await fetch("/api/records", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setRecords(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("讀取紀錄失敗", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecords();
  }, []);

  const chartData = useMemo(() => {
    // 1. 先過濾出「特定日期」且「在蝦皮購買」且「未退款」的紀錄
    const targetRecords = records.filter(r => {
      if (r.isRefunded) return false; 
      if (r.location !== "蝦皮") return false; 
      
      const dateObj = new Date(r.purchaseDate);
      const localDateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
      
      return localDateStr === selectedDate;
    });

    const itemMap: Record<string, { name: string; quantity: number }> = {};

    // 2. 計算商品數量
    targetRecords.forEach(record => {
      // 🌟 如果有選擇特定人員，就跳過其他人的紀錄
      if (selectedBuyer !== "全部" && record.buyer !== selectedBuyer) return;

      record.items.forEach(pItem => {
        const itemName = pItem.item?.name || "未知商品";
        if (!itemMap[itemName]) {
          itemMap[itemName] = { name: itemName, quantity: 0 };
        }
        itemMap[itemName].quantity += pItem.quantity;
      });
    });

    // 🌟 3. 轉換成陣列，並根據數量「由多到少」排序 (遞減)
    const sortedData = Object.values(itemMap).sort((a, b) => b.quantity - a.quantity);

    return sortedData;
  }, [records, selectedDate, selectedBuyer]);

  if (isLoading) return <div className="min-h-screen flex justify-center items-center font-bold text-gray-500">載入數據中...</div>;

  return (
    <main className="min-h-screen p-4 sm:p-8 bg-[#F4F6F8] font-sans text-gray-800">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* 上方導覽與篩選列 */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-100 gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-blue-600 font-black text-xl transition shrink-0">
              ← 返回主頁
            </Link>
            <h1 className="text-xl sm:text-2xl font-black tracking-wide text-orange-600">🦐 蝦皮單日購買統計</h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* 🌟 新增：人員篩選下拉選單 */}
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
              <label className="text-sm font-bold text-gray-500">人員：</label>
              <select 
                value={selectedBuyer} 
                onChange={(e) => setSelectedBuyer(e.target.value)}
                className="bg-transparent font-bold text-gray-700 outline-none cursor-pointer"
              >
                <option value="全部">全部總計</option>
                <option value="洪">洪</option>
                <option value="雅">雅</option>
                <option value="宥">宥</option>
                <option value="崑">崑</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-orange-50 px-3 py-2 rounded-xl border border-orange-200">
              <label className="text-sm font-bold text-orange-600">日期：</label>
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent font-bold text-orange-700 outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 統計圖表區塊 */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
          <div className="mb-6 flex justify-between items-end">
            <div>
              <h2 className="text-lg font-bold text-gray-700">
                📦 {selectedDate} <span style={{ color: BUYER_COLORS[selectedBuyer] }}>{selectedBuyer}</span> 的購買數量排行
              </h2>
              <p className="text-sm text-gray-400 mt-1">直方圖已由高至低排序，方便快速檢查是否有大量重複購買之商品。</p>
            </div>
            
            {/* 顯示總數 */}
            {chartData.length > 0 && (
              <div className="text-right hidden sm:block">
                <span className="text-sm font-bold text-gray-400">當日購買總件數</span>
                <p className="text-3xl font-black" style={{ color: BUYER_COLORS[selectedBuyer] }}>
                  {chartData.reduce((sum, item) => sum + item.quantity, 0)} 件
                </p>
              </div>
            )}
          </div>

          {chartData.length > 0 ? (
            <div className="w-full h-[450px]">
              {/* 🌟 加上 minWidth={1} minHeight={1} 消除計算警告 */}
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 'bold' }} 
                    angle={-45} // 字體傾斜避免擠在一起
                    textAnchor="end"
                    interval={0} // 強制顯示所有標籤
                  />
                  <YAxis allowDecimals={false} tick={{ fill: '#6B7280', fontWeight: 'bold' }} />
                  <Tooltip 
                    cursor={{ fill: '#F3F4F6' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                  />
                  
                  {/* 🌟 單一直方圖，顏色動態跟隨選擇的人員 */}
                  <Bar 
                    dataKey="quantity" 
                    fill={BUYER_COLORS[selectedBuyer] || BUYER_COLORS["全部"]} 
                    radius={[6, 6, 0, 0]} 
                    name={`${selectedBuyer} 的購買數量`} 
                    barSize={40} // 讓柱子不要太粗
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex flex-col justify-center items-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <span className="text-4xl mb-2">📭</span>
              <p className="text-gray-400 font-bold">
                {selectedBuyer === "全部" ? "該日期目前沒有人在蝦皮購買商品" : `${selectedBuyer} 在這天沒有蝦皮購買紀錄`}
              </p>
            </div>
          )}
        </div>
        
      </div>
    </main>
  );
}