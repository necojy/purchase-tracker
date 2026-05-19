"use client";

import { useState, useEffect } from "react";
import BasicInfoSection from "./record-form/BasicInfoSection";
import ItemListSection from "./record-form/ItemListSection";
import AutoDistributeSection from "./record-form/AutoDistributeSection";

type Item = { id: number; name: string; sellPrice: number; originalPrice: number; maxQuantity: number; };
type Store = { id: number; name: string; category: string; }; 
type RecordType = { id: number; pickupLocation: string; purchaseDate: string; }; 
type Props = { items: Item[]; records: RecordType[]; stores: Store[]; refreshData: () => void; onClose: () => void; };

export default function RecordForm({ items, stores, refreshData, onClose }: Props) {
  const [recordForm, setRecordForm] = useState({ 
    costPrice: "", location: "蝦皮", buyer: "洪", 
    paymentMethod: "信用卡", pickupLocation: "", pickupCategory: "SHP" 
  });
  
  const [recordItems, setRecordItems] = useState([{ itemId: "", quantity: 1, originalPrice: "", costPrice: "" }]);

  // 🌟 修復版：處理時間差問題，保護記憶體不被提前洗掉
// 🌟 完美防護版：解決 React 兩次執行導致的時間差覆蓋 Bug
  useEffect(() => {
    if (items.length === 0) return; // 保護機制：商品資料還沒載入完前，不要動作

    if (typeof window !== "undefined") {
      const pendingStr = localStorage.getItem("pendingAutoRecord");
      if (pendingStr) {
        try {
          const pendingData = JSON.parse(pendingStr);
          if (pendingData && pendingData.items && pendingData.items.length > 0) {
            
            // 帶入商品列表
            setRecordItems(pendingData.items);
            
            // 帶入其他表單細節
            setRecordForm(prev => ({
              ...prev,
              costPrice: pendingData.totalPrice || prev.costPrice,
              buyer: pendingData.buyer || prev.buyer,
              location: pendingData.location || prev.location,
              paymentMethod: pendingData.paymentMethod || prev.paymentMethod,
              pickupCategory: pendingData.pickupCategory || prev.pickupCategory,
              pickupLocation: pendingData.pickupLocation || prev.pickupLocation
            }));

            // 確認成功讀取後，刪除記憶體
            localStorage.removeItem("pendingAutoRecord");
            return; // 成功複製後，立刻結束這個回合！
          }
        } catch (e) {
          console.error("解析待處理資料失敗", e);
        }
      }
    }

    // 🌟 關鍵修正：利用 prevItems (最新狀態) 來檢查，確保剛複製進去的資料不會被洗掉
    setRecordItems(prevItems => {
      // 如果「目前畫面上的狀態」真的沒有商品，才給予預設值
      if (!prevItems[0].itemId && items.length > 0) {
        return [{ 
          itemId: items[0].id.toString(), 
          quantity: 1, 
          originalPrice: items[0].originalPrice?.toString() || "", 
          costPrice: "" 
        }];
      }
      // 如果已經有資料（剛剛複製進來的），就保持原樣，絕對不覆蓋
      return prevItems;
    });

  }, [items]);

  useEffect(() => {
    const currentCategoryStores = stores.filter(s => s.category === recordForm.pickupCategory);
    if (!recordForm.pickupLocation && currentCategoryStores.length > 0) {
      setRecordForm(prev => ({ ...prev, pickupLocation: currentCategoryStores[0].name }));
    }
  }, [stores, recordForm.pickupCategory, recordForm.pickupLocation]);

  const handleCategoryChange = (cat: string) => {
    const catStores = stores.filter(s => s.category === cat);
    setRecordForm({ ...recordForm, pickupCategory: cat, pickupLocation: catStores.length > 0 ? catStores[0].name : "" });
  };

  const handleAutoDistribute = () => {
    const totalOrig = recordItems.reduce((sum, item) => sum + (Number(item.originalPrice) || 0) * item.quantity, 0);
    if (totalOrig === 0) { alert("❌ 請先填寫各商品的「店內單價」與「數量」！"); return; }
    
    const finalTotal = Number(recordForm.costPrice);
    if (!finalTotal) { alert("❌ 請輸入「最終結帳發票總額」！"); return; }

    let remainingTotal = finalTotal;
    const newItems = recordItems.map((item, index) => {
      const orig = Number(item.originalPrice) || 0;
      const itemTotalOrig = orig * item.quantity;
      let rowCost = 0;

      if (index === recordItems.length - 1) rowCost = remainingTotal;
      else {
        rowCost = Math.round(finalTotal * (itemTotalOrig / totalOrig));
        remainingTotal -= rowCost;
      }

      const unitCost = rowCost / item.quantity;
      const displayUnitCost = Number(unitCost.toFixed(2));
      return { ...item, costPrice: displayUnitCost > 0 ? displayUnitCost.toString() : "" };
    });
    setRecordItems(newItems);
  };

  const updateRecordItem = (index: number, field: string, value: string | number) => {
    const newItems = [...recordItems];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'itemId') {
      const selectedItem = items.find(i => i.id.toString() === value);
      if (selectedItem) {
        newItems[index].originalPrice = selectedItem.originalPrice?.toString() || "";
        newItems[index].costPrice = ""; 
      }
    }
    setRecordItems(newItems);
  };

  const addRecordItem = () => {
    const firstItem = items[0];
    setRecordItems([...recordItems, { itemId: firstItem?.id.toString() || "", quantity: 1, originalPrice: firstItem?.originalPrice?.toString() || "", costPrice: "" }]);
  };
  
  const removeRecordItem = (index: number) => {
    if (recordItems.length > 1) setRecordItems(recordItems.filter((_, i) => i !== index));
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recordItems.some(i => i.costPrice === "")) { alert("❌ 請點擊自動分配按鈕，或手動填寫進貨價"); return; }
    if (!recordForm.pickupLocation) { alert("❌ 請先至上方「常用店家清單」新增對應的取貨店名！"); return; }

    try {
      const res = await fetch("/api/records", { 
        method: "POST", headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ ...recordForm, recordItems }) 
      });
      if (res.ok) { refreshData(); onClose(); } 
      else { alert("❌ 新增失敗"); }
    } catch (error) { alert("❌ 連線發生錯誤"); }
  };

  const currentCategoryStores = stores.filter(s => s.category === recordForm.pickupCategory);

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100 mb-4 animate-fade-in relative z-10">
      <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 font-bold px-2 text-xl transition">✕</button>
      
      <form onSubmit={handleAddRecord} className="space-y-5">
        <BasicInfoSection recordForm={recordForm} setRecordForm={setRecordForm} currentCategoryStores={currentCategoryStores} handleCategoryChange={handleCategoryChange} />
        <ItemListSection items={items} recordItems={recordItems} updateRecordItem={updateRecordItem} addRecordItem={addRecordItem} removeRecordItem={removeRecordItem} />
        <AutoDistributeSection costPrice={recordForm.costPrice} setCostPrice={(val) => setRecordForm(prev => ({ ...prev, costPrice: val }))} handleAutoDistribute={handleAutoDistribute} />
        <button type="submit" className="w-full bg-[#10B981] text-white font-bold py-3.5 rounded-xl hover:bg-green-600 transition text-lg shadow-sm" disabled={items.length === 0}>
          送出紀錄
        </button>
      </form>
    </div>
  );
}