"use client";

import { useState } from "react";
import RecordForm from "./RecordForm"; 
import RecordCard from "./RecordCard"; 

type Item = { id: number; name: string; sellPrice: number; originalPrice: number; };
type PurchaseItem = { id: number; quantity: number; costPrice: string | number; item: Item; itemId: number; };
type RecordType = { id: number; location: string; buyer: string; paymentMethod: string; purchaseDate: string; items: PurchaseItem[]; pickupLocation: string; isReconciled: boolean; isRefunded: boolean; };
type Store = { id: number; name: string; category: string; };
type Props = { items: Item[]; records: RecordType[]; stores: Store[]; refreshData: () => void; };

export default function RecordManager({ items, records, stores, refreshData }: Props) {
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [filterBuyer, setFilterBuyer] = useState("全部");
  const [showReconciled, setShowReconciled] = useState(false);
  const [showRefunded, setShowRefunded] = useState(false);

  // 1. 基本過濾邏輯
  const filteredRecords = filterBuyer === "全部" ? records : records.filter(r => r.buyer === filterBuyer);
  const activeRecords = filteredRecords.filter(r => !r.isRefunded && !r.isReconciled);
  const reconciledRecords = filteredRecords.filter(r => !r.isRefunded && r.isReconciled);
  const refundedRecords = filteredRecords.filter(r => r.isRefunded);

  // 🌟 2. 核心新功能：按日期分群的邏輯
  const groupRecordsByDate = (recordsToGroup: RecordType[]) => {
    const grouped: { [key: string]: RecordType[] } = {};
    
    recordsToGroup.forEach(record => {
      // 轉換成台灣本地時區日期
      const dateObj = new Date(record.purchaseDate);
      const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
      
      if (!grouped[dateStr]) grouped[dateStr] = [];
      grouped[dateStr].push(record);
    });
    
    return grouped;
  };

  // 🌟 3. 渲染分群列表的專屬元件
  const renderGroupedRecords = (recordsToRender: RecordType[]) => {
    const grouped = groupRecordsByDate(recordsToRender);
    // 把日期由新到舊排序
    const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    return sortedDates.map(dateStr => (
      <div key={dateStr} className="mb-8">
        {/* 🌟 日期分隔線標題 */}
        <div className="flex items-center gap-4 mb-4 pl-2">
          <h3 className="font-black text-gray-500 tracking-wider bg-gray-100 px-3 py-1 rounded-lg text-sm">
            📅 {dateStr}
          </h3>
          <div className="flex-1 h-[2px] bg-gray-100 rounded-full"></div>
        </div>
        
        {/* 該日期的所有卡片 */}
        <div className="space-y-4">
          {grouped[dateStr].map(record => (
            <RecordCard key={record.id} record={record} items={items} refreshData={refreshData} />
          ))}
        </div>
      </div>
    ));
  };

  return (
    <div>
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 mt-8 gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto">
          <h1 className="text-2xl font-black tracking-wide flex items-center gap-2 shrink-0">購買與獲利紀錄 🧾</h1>
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto scrollbar-hide">
            {['全部', '洪', '雅', '宥', '崑'].map(name => (
              <button
                key={name}
                onClick={() => setFilterBuyer(name)}
                className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                  filterBuyer === name ? 'bg-blue-600 text-white shadow-md transform scale-105' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {name === '全部' ? '全部人員' : name}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => setIsAddingRecord(!isAddingRecord)} className="w-full xl:w-auto bg-[#1C4ED8] hover:bg-blue-700 text-white font-bold py-3 sm:py-2 px-5 rounded-full shadow-md transition text-center shrink-0">
          + 開始新紀錄
        </button>
      </div>

      
      {isAddingRecord && (
  <RecordForm items={items} records={records} stores={stores} refreshData={refreshData} onClose={() => setIsAddingRecord(false)} />
)}
      {/* 進行中紀錄 */}
      <div className="mt-4">
        {activeRecords.length === 0 ? (
          <div className="text-center py-8 text-gray-400 font-bold bg-gray-50 rounded-3xl border border-dashed border-gray-200">目前沒有符合條件的進行中訂單</div>
        ) : (
          renderGroupedRecords(activeRecords) // 🌟 套用分群渲染
        )}
      </div>

      {/* 已對帳紀錄 */}
      {reconciledRecords.length > 0 && (
        <div className="mt-10">
          <button onClick={() => setShowReconciled(!showReconciled)} className="flex items-center gap-2 text-green-600 font-bold mb-4 hover:text-green-700 transition px-2">
            ✅ 已完成對帳紀錄 ({reconciledRecords.length} 筆)
            <span className={`transform transition-transform ${showReconciled ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {showReconciled && (
            <div className="animate-fade-in">
              {renderGroupedRecords(reconciledRecords)} {/* 🌟 套用分群渲染 */}
            </div>
          )}
        </div>
      )}

      {/* 已退款紀錄 */}
      {refundedRecords.length > 0 && (
        <div className="mt-10">
          <button onClick={() => setShowRefunded(!showRefunded)} className="flex items-center gap-2 text-gray-400 font-bold mb-4 hover:text-gray-600 transition px-2">
            ❌ 已取消 / 退款紀錄 ({refundedRecords.length} 筆)
            <span className={`transform transition-transform ${showRefunded ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {showRefunded && (
            <div className="animate-fade-in">
              {renderGroupedRecords(refundedRecords)} {/* 🌟 套用分群渲染 */}
            </div>
          )}
        </div>
      )}
    </div>
  );
}