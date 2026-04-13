"use client";

import { useState, useEffect } from "react";

type Item = { id: number; name: string; sellPrice: number; };
type PurchaseItem = { id: number; quantity: number; costPrice: number; item: Item; itemId: number; };
type RecordType = { id: number; location: string; buyer: string; paymentMethod: string; purchaseDate: string; items: PurchaseItem[]; pickupLocation: string; isReconciled: boolean; };

type Props = { items: Item[]; records: RecordType[]; refreshData: () => void; };

export default function RecordManager({ items, records, refreshData }: Props) {
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [expandedRecordId, setExpandedRecordId] = useState<number | null>(null); // 控制哪個紀錄被展開
  
  // 新增表單的狀態
  const [recordForm, setRecordForm] = useState({ location: "蝦皮", buyer: "洪", paymentMethod: "貨到付款", pickupLocation: "" });
  const [recordItems, setRecordItems] = useState([{ itemId: "", quantity: 1, costPrice: "" }]);

  // 編輯表單的狀態
  const [editForm, setEditForm] = useState({ id: 0, location: "", buyer: "", paymentMethod: "", pickupLocation: "" });
  const [editItems, setEditItems] = useState([{ itemId: "", quantity: 1, costPrice: "" }]);

  useEffect(() => {
    if (items.length > 0 && !recordItems[0].itemId) {
      setRecordItems([{ itemId: items[0].id.toString(), quantity: 1, costPrice: "" }]);
    }
  }, [items]);

  // 新增/修改/移除商品明細 (適用於新增與編輯)
  const handleItemChange = (index: number, field: string, value: any, isEdit: boolean = false) => {
    const targetItems = isEdit ? [...editItems] : [...recordItems];
    targetItems[index] = { ...targetItems[index], [field]: value };
    isEdit ? setEditItems(targetItems) : setRecordItems(targetItems);
  };
  const addItemRow = (isEdit: boolean = false) => {
    const newItem = { itemId: items[0]?.id.toString() || "", quantity: 1, costPrice: "" };
    isEdit ? setEditItems([...editItems, newItem]) : setRecordItems([...recordItems, newItem]);
  };
  const removeItemRow = (index: number, isEdit: boolean = false) => {
    const targetItems = isEdit ? editItems : recordItems;
    if (targetItems.length > 1) {
      const filtered = targetItems.filter((_, i) => i !== index);
      isEdit ? setEditItems(filtered) : setRecordItems(filtered);
    }
  };

  // 送出新增紀錄
  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recordItems.some(i => i.costPrice === "")) { alert("❌ 請填寫所有商品的進貨單價"); return; }
    try {
      const res = await fetch("/api/records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...recordForm, recordItems }) });
      if (res.ok) { 
        setRecordForm({ ...recordForm, pickupLocation: "" });
        setRecordItems([{ itemId: items[0]?.id.toString() || "", quantity: 1, costPrice: "" }]);
        setIsAddingRecord(false); refreshData(); 
      }
    } catch (error) { alert("❌ 連線發生錯誤"); }
  };

  // 展開紀錄並載入資料
  const toggleExpand = (record: RecordType) => {
    if (expandedRecordId === record.id) {
      setExpandedRecordId(null);
    } else {
      setExpandedRecordId(record.id);
      setEditForm({ id: record.id, location: record.location, buyer: record.buyer, paymentMethod: record.paymentMethod || "貨到付款", pickupLocation: record.pickupLocation || "" });
      setEditItems(record.items.map(i => ({ itemId: i.itemId.toString(), quantity: i.quantity, costPrice: i.costPrice.toString() })));
    }
  };

  // 儲存編輯
  const handleSaveEdit = async () => {
    if (editItems.some(i => i.costPrice === "")) { alert("❌ 請填寫所有商品的進貨單價"); return; }
    await fetch("/api/records", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...editForm, recordItems: editItems }) });
    setExpandedRecordId(null); refreshData();
  };

  const handleDeleteRecord = async (id: number) => {
    if (!confirm("確定要刪除這筆紀錄嗎？")) return;
    await fetch("/api/records", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setExpandedRecordId(null); refreshData();
  };

  const handleToggleReconcile = async (id: number, currentStatus: boolean, e: React.ChangeEvent<HTMLInputElement>) => {
  e.stopPropagation(); // 避免點擊打勾時觸發展開
  await fetch("/api/records", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, isReconciled: !currentStatus }) });
  refreshData();
};

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 mt-8 gap-4">
        <h1 className="text-2xl font-black tracking-wide flex items-center gap-2">購買與獲利紀錄 🧾</h1>
        <button onClick={() => setIsAddingRecord(!isAddingRecord)} className="w-full sm:w-auto bg-[#1C4ED8] hover:bg-blue-700 text-white font-bold py-3 sm:py-2 px-5 rounded-full shadow-md transition text-center">+ 開始新紀錄</button>
      </div>

      {/* 新增紀錄表單 */}
      {isAddingRecord && (
        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100 mb-4 animate-fade-in">
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="w-full"><label className="block text-sm text-gray-500 mb-1">購買人</label><select value={recordForm.buyer} onChange={(e) => setRecordForm({...recordForm, buyer: e.target.value})} className="w-full border rounded-xl p-3 bg-gray-50"><option>洪</option><option>雅</option><option>宥</option><option>崑</option></select></div>
              <div className="w-full"><label className="block text-sm text-gray-500 mb-1">購買地方</label><select value={recordForm.location} onChange={(e) => setRecordForm({...recordForm, location: e.target.value})} className="w-full border rounded-xl p-3 bg-gray-50"><option>蝦皮</option><option>屈臣氏</option></select></div>
              <div className="w-full"><label className="block text-sm text-gray-500 mb-1">付款方式</label><select value={recordForm.paymentMethod} onChange={(e) => setRecordForm({...recordForm, paymentMethod: e.target.value})} className="w-full border rounded-xl p-3 bg-gray-50"><option>貨到付款</option><option>信用卡</option><option>匯款</option></select></div>
              <div className="w-full"><label className="block text-sm text-gray-500 mb-1">取貨地點</label><input type="text" value={recordForm.pickupLocation} onChange={(e) => setRecordForm({...recordForm, pickupLocation: e.target.value})} className="w-full border rounded-xl p-3 bg-gray-50" placeholder="地點" /></div>
            </div>
            
            <div className="space-y-2">
              <div className="flex text-xs font-bold text-gray-400 px-2 hidden md:flex">
                <div className="flex-1">商品名稱</div>
                <div className="w-24 text-center">進貨單價</div>
                <div className="w-24 text-center">數量</div>
                <div className="w-8"></div>
              </div>
              {recordItems.map((rItem, index) => (
                <div key={index} className="flex flex-wrap md:flex-nowrap gap-2 items-center bg-gray-50 p-2 rounded-xl border">
                  <div className="w-full md:flex-1">
                    <select value={rItem.itemId} onChange={(e) => handleItemChange(index, 'itemId', e.target.value)} className="w-full border rounded-lg p-2.5 bg-white text-sm font-bold text-gray-700">{items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                  </div>
                  <div className="w-1/2 md:w-24"><input type="number" placeholder="進貨單價" value={rItem.costPrice} onChange={(e) => handleItemChange(index, 'costPrice', e.target.value)} className="w-full border rounded-lg p-2.5 bg-white text-sm font-bold text-orange-500 text-center" required /></div>
                  <div className="w-[40%] md:w-24"><input type="number" min="1" placeholder="數量" value={rItem.quantity} onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))} className="w-full border rounded-lg p-2.5 bg-white text-sm font-bold text-center" required /></div>
                  <div className="w-[10%] md:w-8 text-center">{recordItems.length > 1 && <button onClick={() => removeItemRow(index)} className="text-red-300 hover:text-red-500 font-bold px-2">X</button>}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => addItemRow()} className="text-blue-600 bg-blue-50 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-100 transition">+ 加入更多商品</button>
            </div>
            <button onClick={handleAddRecord} className="w-full bg-[#10B981] text-white font-bold py-3.5 rounded-xl hover:bg-green-600 transition text-lg mt-4 shadow-sm" disabled={items.length === 0}>送出紀錄</button>
          </div>
        </div>
      )}

      {/* 紀錄列表 */}
      <div className="space-y-4">
        {records.map((record) => {
          const safeItems = record.items || [];
          const recordTotalCost = safeItems.reduce((sum, i) => sum + (i.costPrice || 0) * i.quantity, 0);
          const recordTotalRevenue = safeItems.reduce((sum, i) => sum + (i.item?.sellPrice || 0) * i.quantity, 0);
          const recordTotalProfit = recordTotalRevenue - recordTotalCost;
          const isExpanded = expandedRecordId === record.id;

          return (
            <div key={record.id} className={`bg-white rounded-[2rem] shadow-sm border overflow-hidden transition-all duration-300 ${record.isReconciled ? 'border-green-200 opacity-70 bg-green-50/30' : 'border-gray-100'} ${isExpanded ? 'ring-2 ring-blue-100' : ''}`}>
              
              {/* 卡片標題區塊 (點擊展開) */}
              <div onClick={() => toggleExpand(record)} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between cursor-pointer hover:bg-gray-50/50 transition gap-4 md:gap-0">
                <div className="flex items-center gap-4 w-full md:w-[30%]">
                  <span className="text-blue-600 font-bold text-sm bg-blue-50 px-3 py-1 rounded-full">{new Date(record.purchaseDate).toISOString().split('T')[0]}</span>
                  <div className={`font-black text-lg ${record.isReconciled ? 'line-through text-gray-400' : ''}`}>
                    {safeItems.length === 1 ? safeItems[0].item?.name : `${safeItems[0]?.item?.name || '商品'} 等 ${safeItems.length} 項`}
                  </div>
                </div>
                
                <div className="flex items-center gap-6 w-full md:w-[25%] bg-gray-50 md:bg-transparent p-3 md:p-0 rounded-xl md:rounded-none">
                  <div><p className="text-gray-400 text-xs font-bold mb-1">總成本</p><p className="font-black text-xl">${recordTotalCost}</p></div>
                  <div><p className="text-green-500 text-xs font-bold mb-1">總獲利</p><p className={`font-black text-xl ${recordTotalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>{recordTotalProfit >= 0 ? `+$${recordTotalProfit}` : `-$${Math.abs(recordTotalProfit)}`}</p></div>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-[40%] justify-start md:justify-end">
                  <span className="flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium">👤 {record.buyer}</span>
                  <span className="flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium">📍 {record.location}</span>
                  <div className="flex items-center gap-2 pl-4 border-l ml-auto md:ml-0" onClick={(e) => e.stopPropagation()}>
                    <span className="text-sm font-bold text-gray-400">對帳</span>
                    <input type="checkbox" checked={record.isReconciled} onChange={(e) => handleToggleReconcile(record.id, record.isReconciled, e)} className="w-5 h-5 accent-blue-600 rounded cursor-pointer" />
                  </div>
                  {/* 下拉箭頭圖示 */}
                  <div className={`ml-2 text-blue-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</div>
                </div>
              </div>

              {/* 展開的詳細編輯區塊 (符合你截圖的設計) */}
              {isExpanded && (
                <div className="border-t border-gray-100 p-6 bg-gray-50/30">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="w-full"><label className="block text-xs font-bold text-gray-400 mb-1">購買人</label><select value={editForm.buyer} onChange={(e) => setEditForm({...editForm, buyer: e.target.value})} className="w-full border rounded-xl p-2.5 bg-white text-sm font-bold"><option>洪</option><option>雅</option><option>宥</option><option>崑</option></select></div>
                    <div className="w-full"><label className="block text-xs font-bold text-gray-400 mb-1">購買地方</label><select value={editForm.location} onChange={(e) => setEditForm({...editForm, location: e.target.value})} className="w-full border rounded-xl p-2.5 bg-white text-sm font-bold"><option>蝦皮</option><option>屈臣氏</option></select></div>
                    <div className="w-full"><label className="block text-xs font-bold text-gray-400 mb-1">付款方式</label><select value={editForm.paymentMethod} onChange={(e) => setEditForm({...editForm, paymentMethod: e.target.value})} className="w-full border rounded-xl p-2.5 bg-white text-sm font-bold"><option>貨到付款</option><option>信用卡</option><option>匯款</option></select></div>
                    <div className="w-full"><label className="block text-xs font-bold text-gray-400 mb-1">取貨地點</label><input type="text" value={editForm.pickupLocation} onChange={(e) => setEditForm({...editForm, pickupLocation: e.target.value})} className="w-full border rounded-xl p-2.5 bg-white text-sm font-bold" placeholder="地點" /></div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex text-xs font-bold text-gray-400 px-2 hidden md:flex">
                      <div className="flex-1">商品名稱</div>
                      <div className="w-24 text-center">進貨單價</div>
                      <div className="w-24 text-center">售出單價</div>
                      <div className="w-24 text-center">數量</div>
                      <div className="w-24 text-center">利潤</div>
                      <div className="w-8"></div>
                    </div>
                    {editItems.map((eItem, index) => {
                      const itemData = items.find(i => i.id.toString() === eItem.itemId);
                      const sellPrice = itemData?.sellPrice || 0;
                      const itemProfit = (sellPrice - Number(eItem.costPrice)) * eItem.quantity;
                      
                      return (
                        <div key={index} className="flex flex-wrap md:flex-nowrap items-center gap-2 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                          <div className="w-full md:flex-1">
                            <select value={eItem.itemId} onChange={(e) => handleItemChange(index, 'itemId', e.target.value, true)} className="w-full bg-gray-50 rounded-lg p-2.5 text-sm font-bold text-gray-600 outline-none">{items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                          </div>
                          <div className="w-1/3 md:w-24"><input type="number" value={eItem.costPrice} onChange={(e) => handleItemChange(index, 'costPrice', e.target.value, true)} className="w-full text-center text-orange-500 font-black text-sm p-2 outline-none border rounded-lg bg-gray-50" /></div>
                          <div className="w-1/3 md:w-24 text-center text-blue-500 font-black text-sm">${sellPrice}</div>
                          <div className="w-1/3 md:w-24"><input type="number" min="1" value={eItem.quantity} onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value), true)} className="w-full text-center font-black text-sm p-2 outline-none border rounded-lg bg-gray-50" /></div>
                          <div className="w-full md:w-24 text-center font-black text-sm text-gray-600">${itemProfit}</div>
                          <div className="w-full md:w-8 text-center">{editItems.length > 1 && <button onClick={() => removeItemRow(index, true)} className="text-red-300 hover:text-red-500 font-bold">X</button>}</div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-6">
                    <button onClick={() => addItemRow(true)} className="text-blue-600 font-bold text-sm bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition w-full md:w-auto">+ 手動新增商品</button>
                    <div className="flex gap-3 w-full md:w-auto">
                      <button onClick={() => handleDeleteRecord(record.id)} className="flex-1 md:flex-none text-red-500 font-bold text-sm bg-red-50 px-6 py-2.5 rounded-lg hover:bg-red-100 transition">刪除整筆紀錄</button>
                      <button onClick={handleSaveEdit} className="flex-1 md:flex-none text-white font-bold text-sm bg-blue-600 px-6 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm">儲存修改</button>
                    </div>
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