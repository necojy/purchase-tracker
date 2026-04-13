"use client";

import { useState, useEffect } from "react";

type Item = { id: number; name: string; sellPrice: number; };
type RecordType = { id: number; costPrice: number; location: string; buyer: string; purchaseDate: string; item: Item; itemId: number; pickupLocation: string; isReconciled: boolean; }; // 🌟 補上 isReconciled

type Props = { items: Item[]; records: RecordType[]; refreshData: () => void; };

export default function RecordManager({ items, records, refreshData }: Props) {
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [recordForm, setRecordForm] = useState({ itemId: "", costPrice: "", location: "蝦皮", buyer: "洪", paymentMethod: "信用卡", pickupLocation: "" });

  useEffect(() => {
    if (items.length > 0 && !recordForm.itemId) {
      setRecordForm(prev => ({ ...prev, itemId: items[0].id.toString() }));
    }
  }, [items]);

  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  const [editRecordForm, setEditRecordForm] = useState({ itemId: "", costPrice: "", location: "", buyer: "", pickupLocation: "" });

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const submitItemId = recordForm.itemId || (items.length > 0 ? items[0].id.toString() : "");
    if (!submitItemId || !recordForm.costPrice) { alert("❌ 請確認商品與購入成本都有填寫喔！"); return; }
    try {
      const res = await fetch("/api/records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...recordForm, itemId: submitItemId }) });
      if (res.ok) { setRecordForm(prev => ({ ...prev, costPrice: "", pickupLocation: "" })); setIsAddingRecord(false); refreshData(); }
    } catch (error) { alert("❌ 連線發生錯誤"); }
  };

  const handleDeleteRecord = async (id: number) => {
    if (!confirm("確定要刪除這筆購買紀錄嗎？")) return;
    await fetch("/api/records", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    refreshData();
  };

  const startEditRecord = (record: RecordType) => {
    setEditingRecordId(record.id);
    setEditRecordForm({ itemId: record.itemId.toString(), costPrice: record.costPrice.toString(), location: record.location, buyer: record.buyer, pickupLocation: record.pickupLocation || "" });
  };

  const handleSaveRecordEdit = async (id: number) => {
    await fetch("/api/records", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...editRecordForm }) });
    setEditingRecordId(null); refreshData();
  };

  // 🌟 新增：處理打勾/取消打勾的函式
  const handleToggleReconcile = async (id: number, currentStatus: boolean) => {
    await fetch("/api/records", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isReconciled: !currentStatus }) // 傳送反轉後的狀態
    });
    refreshData();
  };

  return (
    <div>
      <div className="flex justify-between items-end mb-4 mt-8">
        <h1 className="text-2xl font-black tracking-wide flex items-center gap-2">購買與獲利紀錄 🧾</h1>
        <button onClick={() => setIsAddingRecord(!isAddingRecord)} className="bg-[#1C4ED8] hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-full shadow-md transition">+ 開始新紀錄</button>
      </div>

      {isAddingRecord && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-4 animate-fade-in">
          <form onSubmit={handleAddRecord} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]"><label className="block text-sm text-gray-500 mb-1">選擇商品</label><select name="itemId" value={recordForm.itemId} onChange={(e) => setRecordForm({...recordForm, itemId: e.target.value})} className="w-full border rounded-xl p-3 bg-gray-50">{items.map(item => <option key={item.id} value={item.id}>{item.name} (售價 ${item.sellPrice})</option>)}</select></div>
            <div className="w-32"><label className="block text-sm text-gray-500 mb-1">購入成本</label><input type="number" value={recordForm.costPrice} onChange={(e) => setRecordForm({...recordForm, costPrice: e.target.value})} className="w-full border rounded-xl p-3 bg-gray-50" required /></div>
            <div className="w-28"><label className="block text-sm text-gray-500 mb-1">購買人</label><select value={recordForm.buyer} onChange={(e) => setRecordForm({...recordForm, buyer: e.target.value})} className="w-full border rounded-xl p-3 bg-gray-50"><option>洪</option><option>雅</option><option>宥</option><option>崑</option></select></div>
            <div className="w-32"><label className="block text-sm text-gray-500 mb-1">購買地點</label><select value={recordForm.location} onChange={(e) => setRecordForm({...recordForm, location: e.target.value})} className="w-full border rounded-xl p-3 bg-gray-50"><option>蝦皮</option><option>屈臣氏</option></select></div>
            <div className="w-32"><label className="block text-sm text-gray-500 mb-1">取貨地點</label><input type="text" value={recordForm.pickupLocation} onChange={(e) => setRecordForm({...recordForm, pickupLocation: e.target.value})} className="w-full border rounded-xl p-3 bg-gray-50" placeholder="例: 全家" /></div>
            <button type="submit" className="bg-green-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-green-600 transition" disabled={items.length === 0}>送出紀錄</button>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {records.map((record) => {
          const profit = record.item ? record.item.sellPrice - record.costPrice : 0;
          return (
            // 🌟 如果打勾了，卡片會稍微變淡 (opacity-70)
            <div key={record.id} className={`bg-white rounded-[2rem] p-5 shadow-sm border flex flex-col md:flex-row items-center justify-between group relative overflow-hidden transition-all ${record.isReconciled ? 'border-green-200 opacity-70 bg-green-50/30' : 'border-gray-50'}`}>
              {editingRecordId === record.id ? (
                <div className="flex items-center gap-3 w-full">
                  <select value={editRecordForm.itemId} onChange={(e) => setEditRecordForm({...editRecordForm, itemId: e.target.value})} className="flex-1 border rounded-lg p-2 text-sm">{items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                  <input type="number" value={editRecordForm.costPrice} onChange={(e) => setEditRecordForm({...editRecordForm, costPrice: e.target.value})} className="w-24 border rounded-lg p-2 text-sm" placeholder="成本" />
                  <select value={editRecordForm.buyer} onChange={(e) => setEditRecordForm({...editRecordForm, buyer: e.target.value})} className="w-20 border rounded-lg p-2 text-sm"><option>洪</option><option>雅</option><option>宥</option><option>崑</option></select>
                  <select value={editRecordForm.location} onChange={(e) => setEditRecordForm({...editRecordForm, location: e.target.value})} className="w-24 border rounded-lg p-2 text-sm"><option>蝦皮</option><option>屈臣氏</option></select>
                  <input type="text" value={editRecordForm.pickupLocation} onChange={(e) => setEditRecordForm({...editRecordForm, pickupLocation: e.target.value})} className="w-24 border rounded-lg p-2 text-sm" placeholder="取貨點" />
                  <div className="flex gap-2">
                    <button onClick={() => handleSaveRecordEdit(record.id)} className="bg-green-100 text-green-700 px-3 py-2 rounded-lg font-bold text-sm">儲存</button>
                    <button onClick={() => setEditingRecordId(null)} className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-sm">取消</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-6 w-[30%]">
                    <span className="text-blue-600 font-bold text-sm bg-blue-50 px-3 py-1 rounded-full">{new Date(record.purchaseDate).toISOString().split('T')[0]}</span>
                    <span className={`font-bold text-lg ${record.isReconciled ? 'line-through text-gray-400' : ''}`}>{record.item?.name || "未知商品"}</span>
                  </div>
                  <div className="flex items-center gap-8 w-[30%]">
                    <div><p className="text-gray-400 text-xs font-bold mb-1">成本</p><p className="font-black text-xl">${record.costPrice}</p></div>
                    <div><p className="text-green-500 text-xs font-bold mb-1">獲利</p><p className="text-green-500 font-black text-xl">{profit >= 0 ? `+${profit}` : profit}</p></div>
                  </div>
                  <div className="flex items-center gap-6 w-[40%] justify-end pr-12">
                    <span className="flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium">👤 {record.buyer}</span>
                    <span className="flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium w-32 truncate">📍 {record.location} {record.pickupLocation && `(${record.pickupLocation})`}</span>
                    
                    {/* 🌟 這裡就是對帳的打勾方塊！ */}
                    <div className="flex items-center gap-2 pl-4 border-l">
                      <span className="text-sm font-bold text-gray-400">對帳</span>
                      <input 
                        type="checkbox" 
                        checked={record.isReconciled} 
                        onChange={() => handleToggleReconcile(record.id, record.isReconciled)}
                        className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEditRecord(record)} className="text-gray-400 hover:text-blue-500 text-xs font-bold px-2 py-1 bg-white shadow-sm rounded">編輯</button>
                    <button onClick={() => handleDeleteRecord(record.id)} className="text-gray-400 hover:text-red-500 text-xs font-bold px-2 py-1 bg-white shadow-sm rounded">刪除</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}