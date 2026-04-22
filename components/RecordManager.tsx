"use client";

import { useState, useEffect } from "react";

type Item = { id: number; name: string; sellPrice: number; originalPrice: number; };
type PurchaseItem = { id: number; quantity: number; costPrice: string | number; item: Item; itemId: number; };
type RecordType = { id: number; location: string; buyer: string; paymentMethod: string; purchaseDate: string; items: PurchaseItem[]; pickupLocation: string; isReconciled: boolean; isRefunded: boolean; };

type Props = { items: Item[]; records: RecordType[]; refreshData: () => void; };

export default function RecordManager({ items, records, refreshData }: Props) {
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [expandedRecordId, setExpandedRecordId] = useState<number | null>(null);
  
  // 🌟 新增：控制「已對帳」與「已退款」區塊收合的狀態 (預設 false 為收起)
  const [showReconciled, setShowReconciled] = useState(false);
  const [showRefunded, setShowRefunded] = useState(false);
  
  const [recordForm, setRecordForm] = useState({ costPrice: "", location: "蝦皮", buyer: "洪", paymentMethod: "信用卡", pickupLocation: "" });
  const [recordItems, setRecordItems] = useState([{ itemId: "", quantity: 1, originalPrice: "", costPrice: "" }]);

  const [editForm, setEditForm] = useState({ id: 0, location: "", buyer: "", paymentMethod: "", pickupLocation: "" });
  const [editItems, setEditItems] = useState([{ itemId: "", quantity: 1, costPrice: "" }]);

  useEffect(() => {
    if (items.length > 0 && !recordItems[0].itemId) {
      setRecordItems([{ itemId: items[0].id.toString(), quantity: 1, originalPrice: items[0].originalPrice?.toString() || "", costPrice: "" }]);
    }
  }, [items]);

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

      if (index === recordItems.length - 1) {
        rowCost = remainingTotal;
      } else {
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

  const handleEditItemChange = (index: number, field: string, value: any) => {
    const targetItems = [...editItems];
    targetItems[index] = { ...targetItems[index], [field]: value };
    setEditItems(targetItems);
  };
  const addEditItemRow = () => setEditItems([...editItems, { itemId: items[0]?.id.toString() || "", quantity: 1, costPrice: "" }]);
  const removeEditItemRow = (index: number) => {
    if (editItems.length > 1) setEditItems(editItems.filter((_, i) => i !== index));
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recordItems.some(i => i.costPrice === "")) { alert("❌ 請點擊自動分配按鈕，或手動填寫進貨價"); return; }
    try {
      const res = await fetch("/api/records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...recordForm, recordItems }) });
      if (res.ok) { 
        setRecordForm({ ...recordForm, costPrice: "", pickupLocation: "" });
        setRecordItems([{ itemId: items[0]?.id.toString() || "", quantity: 1, originalPrice: items[0]?.originalPrice?.toString() || "", costPrice: "" }]);
        setIsAddingRecord(false); refreshData(); 
      }
    } catch (error) { alert("❌ 連線發生錯誤"); }
  };

  const toggleExpand = (record: RecordType) => {
    if (expandedRecordId === record.id) setExpandedRecordId(null);
    else {
      setExpandedRecordId(record.id);
      setEditForm({ id: record.id, location: record.location, buyer: record.buyer, paymentMethod: record.paymentMethod || "貨到付款", pickupLocation: record.pickupLocation || "" });
      setEditItems(record.items.map(i => ({ itemId: i.itemId.toString(), quantity: i.quantity, costPrice: i.costPrice.toString() })));
    }
  };

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
    e.stopPropagation(); 
    await fetch("/api/records", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, isReconciled: !currentStatus }) });
    refreshData();
  };
  const handleToggleRefund = async (id: number, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!confirm(currentStatus ? "要取消退款標記，恢復這筆訂單嗎？" : "確定要將這筆訂單標記為「已退款/取消」嗎？（將不計入營收）")) return;
    await fetch("/api/records", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, isRefunded: !currentStatus }) });
    refreshData();
  };

  // 🌟 將紀錄分門別類
  const activeRecords = records.filter(r => !r.isRefunded && !r.isReconciled);
  const reconciledRecords = records.filter(r => !r.isRefunded && r.isReconciled);
  const refundedRecords = records.filter(r => r.isRefunded);

  // 🌟 把渲染卡片的邏輯獨立成一個小元件函式，讓程式碼更簡潔
 const renderRecordCard = (record: RecordType) => {
    const safeItems = record.items || [];
    const recordTotalCost = Math.round(safeItems.reduce((sum, i) => sum + (Number(i.costPrice) || 0) * i.quantity, 0));
    const recordTotalRevenue = Math.round(safeItems.reduce((sum, i) => sum + (i.item?.sellPrice || 0) * i.quantity, 0));
    const recordTotalProfit = recordTotalRevenue - recordTotalCost;
    const isExpanded = expandedRecordId === record.id;
    
    const cardStyle = record.isRefunded 
      ? 'border-red-200 bg-red-50/30 opacity-70 grayscale' 
      : record.isReconciled 
        ? 'border-green-200 bg-green-50/30 opacity-70' 
        : 'border-gray-100';
    
        // 🌟 核心修正：把日期轉換成瀏覽器當下的本地時區 (台灣 UTC+8)
    const dateObj = new Date(record.purchaseDate);
    const localDateString = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

    return (
      <div key={record.id} className={`bg-white rounded-[2rem] shadow-sm border overflow-hidden transition-all duration-300 ${cardStyle} ${isExpanded ? 'ring-2 ring-blue-100' : ''}`}>
        <div onClick={() => toggleExpand(record)} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between cursor-pointer hover:bg-gray-50/50 transition gap-4 md:gap-0">
          <div className="flex items-center gap-4 w-full md:w-[30%]">
            {/* 🌟 替換這裡，使用轉換好的本地時區日期 */}
            <span className="text-blue-600 font-bold text-sm bg-blue-50 px-3 py-1 rounded-full">{localDateString}</span>
            <div className={`font-black text-lg flex items-center gap-2 ${(record.isReconciled || record.isRefunded) ? 'line-through text-gray-400' : ''}`}>
              {safeItems.length === 1 ? safeItems[0].item?.name : `${safeItems[0]?.item?.name || '商品'} 等 ${safeItems.length} 項`}
              {record.isRefunded && <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full no-underline">已退款</span>}
            </div>
          </div>
          
          <div className="flex items-center gap-6 w-full md:w-[25%] bg-gray-50 md:bg-transparent p-3 md:p-0 rounded-xl md:rounded-none">
            <div><p className="text-gray-400 text-xs font-bold mb-1">總成本</p><p className={`font-black text-xl ${record.isRefunded ? 'line-through text-gray-400' : ''}`}>${recordTotalCost}</p></div>
            <div><p className="text-green-500 text-xs font-bold mb-1">總獲利</p><p className={`font-black text-xl ${record.isRefunded ? 'line-through text-gray-400' : (recordTotalProfit >= 0 ? 'text-green-500' : 'text-red-500')}`}>{recordTotalProfit >= 0 ? `+$${recordTotalProfit}` : `-$${Math.abs(recordTotalProfit)}`}</p></div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-[40%] justify-start md:justify-end">
            <span className="flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium">👤 {record.buyer}</span>
            <span className="flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium">📍 {record.location}</span>
            
            <div className="flex items-center gap-3 pl-4 border-l ml-auto md:ml-0" onClick={(e) => e.stopPropagation()}>
              <button onClick={(e) => handleToggleRefund(record.id, record.isRefunded || false, e)} className={`text-xs font-bold px-2 py-1 rounded border ${record.isRefunded ? 'bg-gray-100 text-gray-500 border-gray-300' : 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100'}`}>
                {record.isRefunded ? '取消退款' : '標記退款'}
              </button>
              <label className="flex items-center gap-1 cursor-pointer">
                <span className="text-sm font-bold text-gray-400">對帳</span>
                <input type="checkbox" checked={record.isReconciled} onChange={(e) => handleToggleReconcile(record.id, record.isReconciled, e)} disabled={record.isRefunded} className="w-5 h-5 accent-blue-600 rounded cursor-pointer disabled:opacity-50" />
              </label>
            </div>
            <div className={`ml-2 text-blue-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</div>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-gray-100 p-6 bg-gray-50/30">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="w-full"><label className="block text-xs font-bold text-gray-400 mb-1">購買人</label><select value={editForm.buyer} onChange={(e) => setEditForm({...editForm, buyer: e.target.value})} disabled={record.isRefunded} className="w-full border rounded-xl p-2.5 bg-white text-sm font-bold disabled:opacity-50"><option>洪</option><option>雅</option><option>宥</option><option>崑</option></select></div>
              <div className="w-full"><label className="block text-xs font-bold text-gray-400 mb-1">購買地方</label><select value={editForm.location} onChange={(e) => setEditForm({...editForm, location: e.target.value})} disabled={record.isRefunded} className="w-full border rounded-xl p-2.5 bg-white text-sm font-bold disabled:opacity-50"><option>蝦皮</option><option>屈臣氏</option></select></div>
              <div className="w-full"><label className="block text-xs font-bold text-gray-400 mb-1">付款方式</label><select value={editForm.paymentMethod} onChange={(e) => setEditForm({...editForm, paymentMethod: e.target.value})} disabled={record.isRefunded} className="w-full border rounded-xl p-2.5 bg-white text-sm font-bold disabled:opacity-50"><option>貨到付款</option><option>信用卡</option><option>匯款</option></select></div>
              <div className="w-full"><label className="block text-xs font-bold text-gray-400 mb-1">取貨地點</label><input type="text" value={editForm.pickupLocation} onChange={(e) => setEditForm({...editForm, pickupLocation: e.target.value})} disabled={record.isRefunded} className="w-full border rounded-xl p-2.5 bg-white text-sm font-bold disabled:opacity-50" placeholder="地點" /></div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex text-xs font-bold text-gray-400 px-2 hidden md:flex">
                <div className="flex-1">商品名稱</div>
                <div className="w-24 text-center">進貨單價</div>
                <div className="w-24 text-center">售出單價</div>
                <div className="w-24 text-center">數量</div>
                <div className="w-24 text-center">總利潤</div>
                <div className="w-8"></div>
              </div>
              {editItems.map((eItem, index) => {
                const itemData = items.find(i => i.id.toString() === eItem.itemId);
                const sellPrice = itemData?.sellPrice || 0;
                const itemProfit = Math.round((sellPrice - Number(eItem.costPrice)) * eItem.quantity);
                
                return (
                  <div key={index} className={`flex flex-wrap md:flex-nowrap items-center gap-2 bg-white p-2 rounded-xl border border-gray-100 shadow-sm ${record.isRefunded ? 'opacity-50' : ''}`}>
                    <div className="w-full md:flex-1"><select value={eItem.itemId} onChange={(e) => handleEditItemChange(index, 'itemId', e.target.value)} disabled={record.isRefunded} className="w-full bg-gray-50 rounded-lg p-2.5 text-sm font-bold text-gray-600 outline-none"><option value="">選擇商品</option>{items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
                    <div className="w-1/3 md:w-24"><input type="number" step="0.01" value={eItem.costPrice} onChange={(e) => handleEditItemChange(index, 'costPrice', e.target.value)} disabled={record.isRefunded} className="w-full text-center text-orange-500 font-black text-sm p-2 outline-none border rounded-lg bg-gray-50" /></div>
                    <div className="w-1/3 md:w-24 text-center text-blue-500 font-black text-sm">${sellPrice}</div>
                    <div className="w-1/3 md:w-24"><input type="number" min="1" value={eItem.quantity} onChange={(e) => handleEditItemChange(index, 'quantity', Number(e.target.value))} disabled={record.isRefunded} className="w-full text-center font-black text-sm p-2 outline-none border rounded-lg bg-gray-50" /></div>
                    <div className="w-full md:w-24 text-center font-black text-sm text-gray-600">${itemProfit}</div>
                    <div className="w-full md:w-8 text-center">{editItems.length > 1 && !record.isRefunded && <button onClick={() => removeEditItemRow(index)} className="text-red-300 hover:text-red-500 font-bold">X</button>}</div>
                  </div>
                )
              })}
            </div>

            {!record.isRefunded && (
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-6">
                <button onClick={() => addEditItemRow()} className="text-blue-600 font-bold text-sm bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition w-full md:w-auto">+ 手動新增商品</button>
                <div className="flex gap-3 w-full md:w-auto">
                  <button onClick={() => handleDeleteRecord(record.id)} className="flex-1 md:flex-none text-red-500 font-bold text-sm bg-red-50 px-6 py-2.5 rounded-lg hover:bg-red-100 transition">刪除整筆紀錄</button>
                  <button onClick={handleSaveEdit} className="flex-1 md:flex-none text-white font-bold text-sm bg-blue-600 px-6 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm">儲存修改</button>
                </div>
              </div>
            )}
            {record.isRefunded && (
              <div className="mt-4 text-center text-red-500 font-bold text-sm">此訂單已標記為退款/取消，無法修改明細。若要修改，請先點擊上方「取消退款」。</div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 mt-8 gap-4">
        <h1 className="text-2xl font-black tracking-wide flex items-center gap-2">購買與獲利紀錄 🧾</h1>
        <button onClick={() => setIsAddingRecord(!isAddingRecord)} className="w-full sm:w-auto bg-[#1C4ED8] hover:bg-blue-700 text-white font-bold py-3 sm:py-2 px-5 rounded-full shadow-md transition text-center">+ 開始新紀錄</button>
      </div>

      {/* 新增紀錄表單區塊保留原樣... */}
      {isAddingRecord && (
        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100 mb-4 animate-fade-in">
          <form onSubmit={handleAddRecord} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="w-full"><label className="block text-sm text-gray-500 mb-1">購買人</label><select value={recordForm.buyer} onChange={(e) => setRecordForm({...recordForm, buyer: e.target.value})} className="w-full border rounded-xl p-3 bg-gray-50"><option>洪</option><option>雅</option><option>宥</option><option>崑</option></select></div>
              <div className="w-full"><label className="block text-sm text-gray-500 mb-1">購買地方</label><select value={recordForm.location} onChange={(e) => setRecordForm({...recordForm, location: e.target.value})} className="w-full border rounded-xl p-3 bg-gray-50"><option>蝦皮</option><option>屈臣氏</option></select></div>
              <div className="w-full"><label className="block text-sm text-gray-500 mb-1">付款方式</label><select value={recordForm.paymentMethod} onChange={(e) => setRecordForm({...recordForm, paymentMethod: e.target.value})} className="w-full border rounded-xl p-3 bg-gray-50"><option>貨到付款</option><option>信用卡</option><option>匯款</option></select></div>
              <div className="w-full"><label className="block text-sm text-gray-500 mb-1">取貨地點</label><input type="text" value={recordForm.pickupLocation} onChange={(e) => setRecordForm({...recordForm, pickupLocation: e.target.value})} className="w-full border rounded-xl p-3 bg-gray-50" placeholder="地點" /></div>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-bold text-gray-700 text-sm">🛒 購買品項清單</h3>
                <button type="button" onClick={addRecordItem} className="text-blue-600 font-bold text-sm hover:text-blue-800 bg-white px-3 py-1.5 rounded-lg shadow-sm border">+ 加入商品</button>
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
                  <div className="w-[30%] md:w-24"><input type="number" placeholder="原價" value={rItem.originalPrice} onChange={(e) => updateRecordItem(index, 'originalPrice', e.target.value)} className="w-full border rounded-lg p-2.5 bg-gray-50 text-sm font-bold text-center" /></div>
                  <div className="w-[20%] md:w-20"><input type="number" min="1" placeholder="數量" value={rItem.quantity} onChange={(e) => updateRecordItem(index, 'quantity', Number(e.target.value))} className="w-full border rounded-lg p-2.5 bg-gray-50 text-sm font-bold text-center" required /></div>
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
                  <button type="button" onClick={handleAutoDistribute} className="w-full md:w-auto bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold px-6 py-3 rounded-xl transition shadow-sm text-sm whitespace-nowrap">
                    ✨ 自動分配單價
                  </button>
                </div>
              </div>
            </div>
            
            <button type="submit" className="w-full bg-[#10B981] text-white font-bold py-3.5 rounded-xl hover:bg-green-600 transition text-lg shadow-sm" disabled={items.length === 0}>送出紀錄</button>
          </form>
        </div>
      )}

      {/* 🌟 紀錄列表區塊：分為「進行中」、「已對帳」、「已退款」 */}
      
      {/* 1. 進行中紀錄 */}
      <div className="space-y-4">
        {activeRecords.length === 0 ? (
          <div className="text-center py-8 text-gray-400 font-bold bg-gray-50 rounded-3xl border border-dashed border-gray-200">目前沒有進行中的訂單</div>
        ) : (
          activeRecords.map(renderRecordCard)
        )}
      </div>

      {/* 2. 已對帳紀錄 (點擊收合) */}
      {reconciledRecords.length > 0 && (
        <div className="mt-8">
          <button onClick={() => setShowReconciled(!showReconciled)} className="flex items-center gap-2 text-green-600 font-bold mb-4 hover:text-green-700 transition px-2">
            ✅ 已完成對帳紀錄 ({reconciledRecords.length} 筆)
            <span className={`transform transition-transform ${showReconciled ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {showReconciled && (
            <div className="space-y-4 animate-fade-in">
              {reconciledRecords.map(renderRecordCard)}
            </div>
          )}
        </div>
      )}

      {/* 3. 已退款紀錄 (點擊收合) */}
      {refundedRecords.length > 0 && (
        <div className="mt-8">
          <button onClick={() => setShowRefunded(!showRefunded)} className="flex items-center gap-2 text-gray-400 font-bold mb-4 hover:text-gray-600 transition px-2">
            ❌ 已取消 / 退款紀錄 ({refundedRecords.length} 筆)
            <span className={`transform transition-transform ${showRefunded ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {showRefunded && (
            <div className="space-y-4 animate-fade-in">
              {refundedRecords.map(renderRecordCard)}
            </div>
          )}
        </div>
      )}

    </div>
  );
}