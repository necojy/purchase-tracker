"use client";

import { useState } from "react";

type Item = { id: number; name: string; sellPrice: number; originalPrice: number; };
type PurchaseItem = { id: number; quantity: number; costPrice: string | number; item: Item; itemId: number; };
type RecordType = { id: number; location: string; buyer: string; paymentMethod: string; purchaseDate: string; items: PurchaseItem[]; pickupLocation: string; isReconciled: boolean; isRefunded: boolean; };

type Props = { record: RecordType; items: Item[]; refreshData: () => void; };

export default function RecordCard({ record, items, refreshData }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editForm, setEditForm] = useState({ id: 0, location: "", buyer: "", paymentMethod: "", pickupLocation: "" });
  const [editItems, setEditItems] = useState([{ itemId: "", quantity: 1, costPrice: "" }]);

  const toggleExpand = () => {
    if (isExpanded) {
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
      setEditForm({ id: record.id, location: record.location, buyer: record.buyer, paymentMethod: record.paymentMethod || "貨到付款", pickupLocation: record.pickupLocation || "" });
      setEditItems(record.items.map(i => ({ itemId: i.itemId.toString(), quantity: i.quantity, costPrice: i.costPrice.toString() })));
    }
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

  const handleSaveEdit = async () => {
    if (editItems.some(i => i.costPrice === "")) { alert("❌ 請填寫所有商品的進貨單價"); return; }
    await fetch("/api/records", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...editForm, recordItems: editItems }) });
    setIsExpanded(false); refreshData();
  };

  const handleDeleteRecord = async () => {
    if (!confirm("確定要刪除這筆紀錄嗎？")) return;
    await fetch("/api/records", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: record.id }) });
    refreshData();
  };

  const handleToggleReconcile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation(); 
    await fetch("/api/records", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: record.id, isReconciled: !record.isReconciled }) });
    refreshData();
  };

  const handleToggleRefund = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!confirm(record.isRefunded ? "要取消退款標記，恢復這筆訂單嗎？" : "確定要將這筆訂單標記為「已退款/取消」嗎？（將不計入營收）")) return;
    await fetch("/api/records", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: record.id, isRefunded: !record.isRefunded }) });
    refreshData();
  };

  const safeItems = record.items || [];
  const recordTotalCost = Math.round(safeItems.reduce((sum, i) => sum + (Number(i.costPrice) || 0) * i.quantity, 0));
  const recordTotalRevenue = Math.round(safeItems.reduce((sum, i) => sum + (i.item?.sellPrice || 0) * i.quantity, 0));
  const recordTotalProfit = recordTotalRevenue - recordTotalCost;

  const cardStyle = record.isRefunded 
    ? 'border-red-200 bg-red-50/30 opacity-70 grayscale' 
    : record.isReconciled 
      ? 'border-green-200 bg-green-50/30 opacity-70' 
      : 'border-gray-100';

  const dateObj = new Date(record.purchaseDate);
  const localDateString = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

  return (
    <div className={`bg-white rounded-[2rem] shadow-sm border overflow-hidden transition-all duration-300 ${cardStyle} ${isExpanded ? 'ring-2 ring-blue-100' : ''}`}>
      <div onClick={toggleExpand} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between cursor-pointer hover:bg-gray-50/50 transition gap-4 md:gap-0">
        <div className="flex items-center gap-4 w-full md:w-[30%]">
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
            <button onClick={handleToggleRefund} className={`text-xs font-bold px-2 py-1 rounded border ${record.isRefunded ? 'bg-gray-100 text-gray-500 border-gray-300' : 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100'}`}>
              {record.isRefunded ? '取消退款' : '標記退款'}
            </button>
            <label className="flex items-center gap-1 cursor-pointer">
              <span className="text-sm font-bold text-gray-400">對帳</span>
              <input type="checkbox" checked={record.isReconciled} onChange={handleToggleReconcile} disabled={record.isRefunded} className="w-5 h-5 accent-blue-600 rounded cursor-pointer disabled:opacity-50" />
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
              <button onClick={addEditItemRow} className="text-blue-600 font-bold text-sm bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition w-full md:w-auto">+ 手動新增商品</button>
              <div className="flex gap-3 w-full md:w-auto">
                <button onClick={handleDeleteRecord} className="flex-1 md:flex-none text-red-500 font-bold text-sm bg-red-50 px-6 py-2.5 rounded-lg hover:bg-red-100 transition">刪除整筆紀錄</button>
                <button onClick={handleSaveEdit} className="flex-1 md:flex-none text-white font-bold text-sm bg-blue-600 px-6 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm">儲存修改</button>
              </div>
            </div>
          )}
          {record.isRefunded && <div className="mt-4 text-center text-red-500 font-bold text-sm">此訂單已標記為退款/取消，無法修改明細。若要修改，請先點擊上方「取消退款」。</div>}
        </div>
      )}
    </div>
  );
}