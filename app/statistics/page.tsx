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

    // 🌟 升級：在暫存字典裡多記錄一個 totalCost (總成本)
    const itemMap: Record<string, { name: string; quantity: number; totalCost: number }> = {};

    // 2. 計算商品數量與總成本
    targetRecords.forEach(record => {
      if (selectedBuyer !== "全部" && record.buyer !== selectedBuyer) return;

      record.items.forEach(pItem => {
        const itemName = pItem.item?.name || "未知商品";
        if (!itemMap[itemName]) {
          itemMap[itemName] = { name: itemName, quantity: 0, totalCost: 0 };
        }
        itemMap[itemName].quantity += pItem.quantity;
        itemMap[itemName].totalCost += (Number(pItem.costPrice) || 0) * pItem.quantity;
      });
    });

    // 🌟 3. 算出平均單價後，轉換成陣列，並根據數量由多到少排序
    const sortedData = Object.values(itemMap).map(item => ({
      ...item,
      // 平均進貨價 = 總成本 / 總數量 (四捨五入到小數點後 1 位)
      avgCost: item.quantity > 0 ? (item.totalCost / item.quantity).toFixed(1) : 0
    })).sort((a, b) => b.quantity - a.quantity);

    return sortedData;
  }, [records, selectedDate, selectedBuyer]);

  // 🌟 新增：客製化滑鼠懸浮提示框 (Tooltip)
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload; // 取出我們剛剛算好的整包資料
      return (
        <div className="bg-white p-4 rounded-2xl shadow-xl border border-gray-100 z-50">
          <p className="font-black text-gray-700 mb-2 border-b border-gray-100 pb-2">{label}</p>
          <div className="space-y-1.5 mt-2">
            <p className="text-sm font-bold flex items-center gap-2" style={{ color: payload[0].fill }}>
              <span>📦 總購買數：</span>
              <span className="text-base">{data.quantity} 件</span>
            </p>
            <p className="text-sm font-bold text-orange-500 flex items-center gap-2">
              <span>💰 平均進貨單價：</span>
              <span className="text-base">${data.avgCost}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) return <div className="min-h-screen flex justify-center items-center font-bold text-gray-500">載入數據中...</div>;

  return (
    <main className="min-h-screen p-4 sm:p-8 bg-[#F4F6F8] font-sans text-gray-800">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-100 gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-blue-600 font-black text-xl transition shrink-0">
              ← 返回主頁
            </Link>
            <h1 className="text-xl sm:text-2xl font-black tracking-wide text-orange-600">🦐 蝦皮單日購買統計</h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
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

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
          <div className="mb-6 flex justify-between items-end">
            <div>
              <h2 className="text-lg font-bold text-gray-700">
                📦 {selectedDate} <span style={{ color: BUYER_COLORS[selectedBuyer] }}>{selectedBuyer}</span> 的購買數量排行
              </h2>
              <p className="text-sm text-gray-400 mt-1">直方圖已由高至低排序，方便快速檢查是否有大量重複購買之商品。</p>
            </div>
            
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
              <ResponsiveContainer width="99%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 'bold' }} 
                    angle={-45} 
                    textAnchor="end"
                    interval={0} 
                  />
                  <YAxis allowDecimals={false} tick={{ fill: '#6B7280', fontWeight: 'bold' }} />
                  
                  {/* 🌟 核心：套用我們剛剛做好的客製化 Tooltip */}
                  <Tooltip 
                    content={<CustomTooltip />} 
                    cursor={{ fill: '#F3F4F6' }}
                  />
                  
                  <Bar 
                    dataKey="quantity" 
                    fill={BUYER_COLORS[selectedBuyer] || BUYER_COLORS["全部"]} 
                    radius={[6, 6, 0, 0]} 
                    name="購買數量" 
                    barSize={40} 
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