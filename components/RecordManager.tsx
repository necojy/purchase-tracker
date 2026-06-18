"use client";

import { useState, useEffect } from "react";
import RecordForm from "./RecordForm"; 
import RecordHeader from "./record-manager/RecordHeader";
import RecordGroupList from "./record-manager/RecordGroupList";

type Item = { id: number; name: string; sellPrice: number; originalPrice: number; maxQuantity: number; };
type PurchaseItem = { id: number; quantity: number; costPrice: string | number; item: Item; itemId: number; };
type RecordType = { id: number; location: string; buyer: string; paymentMethod: string; purchaseDate: string; items: PurchaseItem[]; pickupLocation: string; isReconciled: boolean; isRefunded: boolean; };
type Store = { id: number; name: string; category: string; };

type Props = { 
  items: Item[]; records: RecordType[]; stores: Store[]; refreshData: () => void; 
  targetStore: string | null; setTargetStore: (store: string | null) => void;
};

export default function RecordManager({ items, records, stores, refreshData, targetStore, setTargetStore }: Props) {
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [filterBuyer, setFilterBuyer] = useState("全部");
  const [showReconciled, setShowReconciled] = useState(false);
  const [showRefunded, setShowRefunded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("pendingAutoRecord")) {
      setIsAddingRecord(true);
      setTimeout(() => {
        document.getElementById('record-manager-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, []);
  
  // 🌟 新增：處理「複製紀錄」並強制表單重新載入的邏輯
  const handleCopyRecord = (record: RecordType) => {
    const storeCategory = stores.find(s => s.name === record.pickupLocation)?.category || "SHP";
    const totalPrice = record.items.reduce((sum, rItem) => sum + (Number(rItem.costPrice) * rItem.quantity), 0);

    const copyData = {
      totalPrice: totalPrice.toString(),
      buyer: record.buyer,
      location: record.location,
      paymentMethod: record.paymentMethod,
      pickupCategory: storeCategory,
      pickupLocation: record.pickupLocation,
      items: record.items.map(rItem => ({
        itemId: rItem.itemId.toString(),
        quantity: rItem.quantity,
        originalPrice: rItem.item.originalPrice?.toString() || "",
        costPrice: rItem.costPrice.toString()
      }))
    };

    localStorage.setItem("pendingAutoRecord", JSON.stringify(copyData));
    
    // 🌟 關鍵：先關閉表單，0.05秒後瞬間打開，確保觸發更新
    setIsAddingRecord(false);
    setTimeout(() => {
      setIsAddingRecord(true);
      setTimeout(() => { document.getElementById('record-manager-section')?.scrollIntoView({ behavior: 'smooth' }); }, 100);
    }, 50);
  };

  let filteredRecords = records;
  if (filterBuyer !== "全部") filteredRecords = filteredRecords.filter(r => r.buyer === filterBuyer);
  if (targetStore) filteredRecords = filteredRecords.filter(r => r.pickupLocation === targetStore);

  const activeRecords = filteredRecords.filter(r => !r.isRefunded && !r.isReconciled);
  const reconciledRecords = filteredRecords.filter(r => !r.isRefunded && r.isReconciled);
  const refundedRecords = filteredRecords.filter(r => r.isRefunded);

  return (
    <div id="record-manager-section" className="scroll-mt-8">
      
      <RecordHeader 
        filterBuyer={filterBuyer} setFilterBuyer={setFilterBuyer}
        targetStore={targetStore} setTargetStore={setTargetStore}
        isAddingRecord={isAddingRecord} setIsAddingRecord={setIsAddingRecord}
      />

      {isAddingRecord && (
        <RecordForm items={items} records={records} stores={stores} refreshData={refreshData} onClose={() => setIsAddingRecord(false)} />
      )}
      
      <div className="mt-4">
        {activeRecords.length === 0 ? (
          <div className="text-center py-8 text-gray-400 font-bold bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            目前沒有符合條件的進行中訂單
          </div>
        ) : (
          <RecordGroupList records={activeRecords} items={items} stores={stores} refreshData={refreshData} onCopy={handleCopyRecord} />
        )}
      </div>

      {reconciledRecords.length > 0 && (
        <div className="mt-10">
          <button onClick={() => setShowReconciled(!showReconciled)} className="flex items-center gap-2 text-green-600 font-bold mb-4 hover:text-green-700 transition px-2">
            ✅ 已完成對帳紀錄 ({reconciledRecords.length} 筆)
            <span className={`transform transition-transform ${showReconciled ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {showReconciled && (
            <div className="animate-fade-in">
              <RecordGroupList records={reconciledRecords} items={items} stores={stores} refreshData={refreshData} onCopy={handleCopyRecord} />
            </div>
          )}
        </div>
      )}

      {refundedRecords.length > 0 && (
        <div className="mt-10">
          <button onClick={() => setShowRefunded(!showRefunded)} className="flex items-center gap-2 text-gray-400 font-bold mb-4 hover:text-gray-600 transition px-2">
            ❌ 已取消 / 退款紀錄 ({refundedRecords.length} 筆)
            <span className={`transform transition-transform ${showRefunded ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {showRefunded && (
            <div className="animate-fade-in">
              <RecordGroupList records={refundedRecords} items={items} stores={stores} refreshData={refreshData} onCopy={handleCopyRecord} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}