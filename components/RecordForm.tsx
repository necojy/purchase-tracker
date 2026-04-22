"use client";

import { useState, useEffect } from "react";

type Item = { id: number; name: string; sellPrice: number; originalPrice: number; };
type Store = { id: number; name: string; category: string; }; // 🌟 字典補上 Store
type RecordType = { id: number; pickupLocation: string; purchaseDate: string; }; 
type Props = { items: Item[]; records: RecordType[]; stores: Store[]; refreshData: () => void; onClose: () => void; };

export default function RecordForm({ items, stores, refreshData, onClose }: Props) {
  const [recordForm, setRecordForm] = useState({ 
    costPrice: "", location: "蝦皮", buyer: "洪", 
    paymentMethod: "信用卡", pickupLocation: "", pickupCategory: "SHP" 
  });
  
  const [recordItems, setRecordItems] = useState([{ itemId: "", quantity: 1, originalPrice: "", costPrice: "" }]);

  useEffect(() => {
    if (items.length > 0 && !recordItems[0].itemId) {
      setRecordItems([{ itemId: items[0].id.toString(), quantity: 1, originalPrice: items[0].originalPrice?.toString() || "", costPrice: "" }]);
    }
  }, [items]);

  // 🌟 當切換「蝦皮/超商」時，自動把店名選項重置為該類別的第一間店
  const handleCategoryChange = (cat: string) => {
    const catStores = stores.filter(s => s.category === cat);
    setRecordForm({
      ...recordForm,
      pickupCategory: cat,
      pickupLocation: catStores.length > 0 ? catStores[0].name : ""
    });
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
    
    // 防呆：確保使用者有選取有效店名
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

  // 取得目前選擇的通路類別對應的所有預設店家
  const currentCategoryStores = stores.filter(s => s.category === recordForm.pickupCategory);

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100 mb-4 animate-fade-in relative z-10">
      <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 font-bold px-2 text-xl transition">✕</button>
      
      <form onSubmit={handleAddRecord} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div className="w-full">
            <label className="block text-sm text-gray-500 mb-1">購買人</label>
            <select value={recordForm.buyer} onChange={(e) => setRecordForm({...recordForm, buyer: e.target.value})} className="w-full border rounded-xl p-3 bg-gray-50 font-medium outline-none"><option>洪</option><option>雅</option><option>宥</option><option>崑</option></select>
          </div>
          <div className="w-full">
            <label className="block text-sm text-gray-500 mb-1">購買地方</label>
            <select value={recordForm.location} onChange={(e) => setRecordForm({...recordForm, location: e.target.value})} className="w-full border rounded-xl p-3 bg-gray-50 font-medium outline-none"><option>蝦皮</option><option>屈臣氏</option></select>
          </div>
          <div className="w-full">
            <label className="block text-sm text-gray-500 mb-1">付款方式</label>
            <select value={recordForm.paymentMethod} onChange={(e) => setRecordForm({...recordForm, paymentMethod: e.target.value})} className="w-full border rounded-xl p-3 bg-gray-50 font-medium outline-none"><option>貨到付款</option><option>信用卡</option><option>匯款</option></select>
          </div>
          
          <div className="w-full">
            <label className="block text-sm text-gray-500 mb-1">取貨通路</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => handleCategoryChange("SHP")} className={`flex-1 py-[11px] rounded-xl font-bold text-sm transition ${recordForm.pickupCategory === 'SHP' ? 'bg-orange-500 text-white shadow-sm' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>蝦皮店</button>
              <button type="button" onClick={() => handleCategoryChange("CVS")} className={`flex-1 py-[11px] rounded-xl font-bold text-sm transition ${recordForm.pickupCategory === 'CVS' ? 'bg-blue-500 text-white shadow-sm' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>超商</button>
            </div>
          </div>

          <div className="w-full">
            <label className="block text-sm text-gray-500 mb-1">取貨店名</label>
            {/* 🌟 改成完全綁定預設清單的下拉選單 */}
            <select 
              value={recordForm.pickupLocation} 
              onChange={(e) => setRecordForm({...recordForm, pickupLocation: e.target.value})} 
              className={`w-full border rounded-xl p-3 bg-gray-50 font-medium outline-none transition ${currentCategoryStores.length === 0 ? 'text-red-400 border-red-300' : 'focus:border-blue-400'}`}
              required
            >
              {currentCategoryStores.length > 0 ? (
                currentCategoryStores.map(store => (
                  <option key={store.id} value={store.name}>{store.name}</option>
                ))
              ) : (
                <option value="">請先新增上方預設店家</option>
              )}
            </select>
          </div>
        </div>

        {/* 下方商品清單與計算機保留原樣 */}
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-bold text-gray-700 text-sm">🛒 購買品項清單</h3>
            <button type="button" onClick={addRecordItem} className="text-blue-600 font-bold text-sm hover:text-blue-800 bg-white px-3 py-1.5 rounded-lg shadow-sm border transition">+ 加入商品</button>
          </div>
          <div className="flex text-xs font-bold text-gray-400 px-2 hidden md:flex">
            <div className="flex-1">商品名稱</div>
            <div className="w-24 text-center">店內單價</div>
            <div className="w-20 text-center">數量</div>
            <div className="w-24 text-center text-orange-400">折後進貨價</div>
            <div className="w-8"></div>
          </div>
          {recordItems.map((rItem, index) => (
            <div key={index} className="flex flex-wrap md:flex-nowrap gap-2 items-center bg-white p-2 rounded-xl shadow-sm border border-gray-100">
              <div className="w-full md:flex-1"><select value={rItem.itemId} onChange={(e) => updateRecordItem(index, 'itemId', e.target.value)} className="w-full border rounded-lg p-2.5 bg-gray-50 text-sm font-bold text-gray-700 outline-none">{items.map(item => <option key={item.id} value={item.id}>{item.name} (${item.sellPrice})</option>)}</select></div>
              <div className="w-[30%] md:w-24"><input type="number" placeholder="原價" value={rItem.originalPrice} onChange={(e) => updateRecordItem(index, 'originalPrice', e.target.value)} className="w-full border rounded-lg p-2.5 bg-gray-50 text-sm font-bold text-center outline-none" /></div>
              <div className="w-[20%] md:w-20"><input type="number" min="1" placeholder="數量" value={rItem.quantity} onChange={(e) => updateRecordItem(index, 'quantity', Number(e.target.value))} className="w-full border rounded-lg p-2.5 bg-gray-50 text-sm font-bold text-center outline-none" required /></div>
              <div className="w-[30%] md:w-24"><input type="number" step="0.01" placeholder="進貨價" value={rItem.costPrice} onChange={(e) => updateRecordItem(index, 'costPrice', e.target.value)} className="w-full border-2 border-orange-200 rounded-lg p-2.5 bg-orange-50 text-orange-600 text-sm font-black text-center outline-none" required /></div>
              <div className="w-[10%] md:w-8 text-center">{recordItems.length > 1 && <button type="button" onClick={() => removeRecordItem(index)} className="text-red-400 hover:text-red-600 font-bold pb-1 px-2">X</button>}</div>
            </div>
          ))}
        </div>

        <div className="bg-yellow-50 p-5 rounded-2xl border border-yellow-200">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">💡</span>
            <h3 className="font-bold text-yellow-800 text-sm">智慧進貨單價分配 (依照最終發票金額自動算單價)</h3>
          </div>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:flex-1">
              <label className="block text-xs font-bold text-green-700 mb-1">最終結帳發票總額 (必填)</label>
              <input type="number" value={recordForm.costPrice} onChange={(e) => setRecordForm({...recordForm, costPrice: e.target.value})} placeholder="請輸入實際付的總金額" className="w-full border-2 border-green-400 rounded-xl p-2.5 bg-white text-sm font-black text-green-600 outline-none" />
            </div>
            <div className="w-full md:w-auto">
              <button type="button" onClick={handleAutoDistribute} className="w-full md:w-auto bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold px-6 py-3 rounded-xl transition shadow-sm text-sm whitespace-nowrap">✨ 自動分配單價</button>
            </div>
          </div>
        </div>
        
        <button type="submit" className="w-full bg-[#10B981] text-white font-bold py-3.5 rounded-xl hover:bg-green-600 transition text-lg shadow-sm" disabled={items.length === 0}>送出紀錄</button>
      </form>
    </div>
  );
}