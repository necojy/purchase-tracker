"use client";

import { useState, useMemo } from "react";

type Item = { id: number; name: string; sellPrice: number; };
type PurchaseItem = { id: number; quantity: number; costPrice: number; item: Item; };
type RecordType = { id: number; purchaseDate: string; isReconciled: boolean; isRefunded?: boolean; items: PurchaseItem[]; };

type Props = { records: RecordType[]; };

export default function Dashboard({ records }: Props) {
  // 🌟 狀態：目前選擇查看的月份，預設為 "all" (全部時間)
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  // 1. 未對帳成本
  const unreconciledCost = Math.round(records.filter(r => !r.isReconciled && !r.isRefunded).reduce((sum, r) => {
    const recordCost = (r.items || []).reduce((sub, i) => sub + (Number(i.costPrice) || 0) * i.quantity, 0);
    return sum + recordCost;
  }, 0));

  // 2. 未對帳預期營收
  const unreconciledRevenue = Math.round(records.filter(r => !r.isReconciled && !r.isRefunded).reduce((sum, r) => {
    const recordRev = (r.items || []).reduce((sub, i) => sub + (i.item?.sellPrice || 0) * i.quantity, 0);
    return sum + recordRev;
  }, 0));

  // 🌟 3. 動態抓取所有存在有效訂單的月份 (例如：["2026-04", "2026-03"])
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    records.filter(r => !r.isRefunded).forEach(r => {
      const d = new Date(r.purchaseDate);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthStr);
    });
    // 將月份由新到舊排序
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [records]);

  // 🌟 4. 計算所選月份 (或所有時間) 的總獲利
  const displayProfit = useMemo(() => {
    const filteredRecords = records.filter(r => {
      if (r.isRefunded) return false; // 排除已退款的
      if (selectedMonth === "all") return true; // 如果選「全部」，就通通算進去
      
      // 比對月份
      const d = new Date(r.purchaseDate);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return monthStr === selectedMonth;
    });

    return Math.round(filteredRecords.reduce((sum, r) => {
      const recordRev = (r.items || []).reduce((sub, i) => sub + (i.item?.sellPrice || 0) * i.quantity, 0);
      const recordCost = (r.items || []).reduce((sub, i) => sub + (Number(i.costPrice) || 0) * i.quantity, 0);
      return sum + (recordRev - recordCost);
    }, 0));
  }, [records, selectedMonth]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
      <div className="bg-[#111827] text-white rounded-[2rem] p-8 shadow-md flex flex-col justify-center">
        <p className="text-gray-400 text-sm font-bold mb-2 tracking-wide">未對帳成本</p>
        <p className="text-4xl font-black">${unreconciledCost}</p>
      </div>
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col justify-center">
        <p className="text-gray-400 text-sm font-bold mb-2 tracking-wide">未對帳預期營收</p>
        <p className="text-4xl font-black text-blue-600">${unreconciledRevenue}</p>
      </div>
      <div className="bg-[#10B981] text-white rounded-[2rem] p-8 shadow-md flex flex-col justify-center transition-all duration-300">
        
        {/* 🌟 獲利標題與月份選擇器 */}
        <div className="flex justify-between items-center mb-2">
          <p className="text-green-100 text-sm font-bold tracking-wide">有效訂單獲利</p>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-green-700/40 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg outline-none border border-green-500/50 cursor-pointer hover:bg-green-700/60 transition appearance-none text-center"
          >
            <option value="all">所有時間</option>
            {availableMonths.map(m => (
              // 將 "2026-04" 轉換成 "2026年04月" 顯示
              <option key={m} value={m} className="text-gray-800">{m.replace('-', '年')}月</option>
            ))}
          </select>
        </div>
        
        <p className="text-4xl font-black">${displayProfit}</p>
      </div>
    </div>
  );
}