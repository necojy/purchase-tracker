"use client";

import { useState } from "react";

// 定義型別
type Item = { id: number; name: string; sellPrice: number; };

// 定義從老大哥那邊接收到的「禮物 (Props)」
type Props = {
  items: Item[];             // 商品資料
  refreshData: () => void;   // 當資料有變動時，呼叫老大哥重新抓資料的函數
};

export default function ItemManager({ items, refreshData }: Props) {
  // --- 這裡只留跟商品有關的狀態 ---
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemPrice) return;
    await fetch("/api/items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newItemName, sellPrice: newItemPrice }) });
    setNewItemName(""); setNewItemPrice(""); setIsAddingItem(false); 
    refreshData(); // 呼叫老大哥更新畫面
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm("確定刪除此商品？")) return;
    await fetch("/api/items", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    refreshData();
  };

  const startEdit = (item: Item) => { setEditingId(item.id); setEditName(item.name); setEditPrice(item.sellPrice.toString()); };
  
  const handleSaveEdit = async (id: number) => {
    await fetch("/api/items", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, name: editName, sellPrice: editPrice }) });
    setEditingId(null); 
    refreshData();
  };

  // --- 這裡只留商品區塊的畫面 ---
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-gray-500 font-bold text-sm">常用商品清單</h2>
        <button onClick={() => setIsAddingItem(!isAddingItem)} className="text-blue-600 font-bold text-sm hover:text-blue-700 transition">+ 新增商品售價</button>
      </div>
      {isAddingItem && (
        <form onSubmit={handleAddItem} className="flex gap-2 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
          <input type="text" placeholder="商品名稱" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border outline-none" required />
          <input type="number" placeholder="預期售價" value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value)} className="w-32 px-3 py-2 rounded-lg border outline-none" required />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">儲存</button>
        </form>
      )}
      <div className="flex flex-wrap gap-3">
        {items.map((item) => (
          <div key={item.id} className="bg-gray-50 border border-gray-100 px-4 py-2 rounded-2xl flex items-center gap-3 font-medium shadow-sm group">
            {editingId === item.id ? (
              <div className="flex items-center gap-2">
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-24 px-2 py-1 rounded border text-sm" />
                <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="w-16 px-2 py-1 rounded border text-sm text-blue-600" />
                <button onClick={() => handleSaveEdit(item.id)} className="text-green-600 text-sm font-bold">完成</button>
                <button onClick={() => setEditingId(null)} className="text-gray-400 text-sm">取消</button>
              </div>
            ) : (
              <>
                <span>{item.name}</span><span className="text-blue-600 font-bold">${item.sellPrice}</span>
                <div className="hidden group-hover:flex gap-2 ml-1">
                  <button onClick={() => startEdit(item)} className="text-gray-400 hover:text-blue-500 text-xs">編輯</button>
                  <button onClick={() => handleDeleteItem(item.id)} className="text-gray-400 hover:text-red-500 text-xs">刪除</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}