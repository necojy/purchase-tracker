"use client";

import { useState } from "react";

type Item = { id: number; name: string; sellPrice: number; };

type Props = {
  items: Item[];
  refreshData: () => void;
};

export default function ItemManager({ items, refreshData }: Props) {
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
    refreshData();
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

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <h2 className="text-gray-500 font-bold text-sm">常用商品清單</h2>
        <button onClick={() => setIsAddingItem(!isAddingItem)} className="text-blue-600 font-bold text-sm hover:text-blue-700 transition w-full sm:w-auto text-right sm:text-left">+ 新增商品售價</button>
      </div>
      
      {isAddingItem && (
        // 🌟 修正：手機版改為上下排列 (flex-col)，電腦版左右排列 (sm:flex-row)
        <form onSubmit={handleAddItem} className="flex flex-col sm:flex-row gap-2 mb-4 bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-200">
          <input type="text" placeholder="商品名稱" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="w-full sm:flex-1 px-3 py-2 rounded-lg border outline-none" required />
          <input type="number" placeholder="預期售價" value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value)} className="w-full sm:w-32 px-3 py-2 rounded-lg border outline-none" required />
          <button type="submit" className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">儲存</button>
        </form>
      )}

      <div className="flex flex-wrap gap-2 sm:gap-3">
        {items.map((item) => (
          <div key={item.id} className="bg-gray-50 border border-gray-100 px-3 py-2 sm:px-4 rounded-2xl flex items-center gap-2 sm:gap-3 font-medium shadow-sm group w-full sm:w-auto">
            {editingId === item.id ? (
              // 🌟 編輯模式也做 RWD
              <div className="flex flex-wrap items-center gap-2 w-full">
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full sm:w-24 px-2 py-1 rounded border text-sm" />
                <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="w-full sm:w-16 px-2 py-1 rounded border text-sm text-blue-600" />
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <button onClick={() => handleSaveEdit(item.id)} className="text-green-600 text-sm font-bold bg-green-50 px-2 py-1 rounded">完成</button>
                  <button onClick={() => setEditingId(null)} className="text-gray-400 text-sm bg-gray-100 px-2 py-1 rounded">取消</button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <span>{item.name}</span>
                  <span className="text-blue-600 font-bold">${item.sellPrice}</span>
                </div>
                {/* 🌟 修正：手機版常駐顯示按鈕，電腦版 (sm:hidden) hover 才顯示 */}
                <div className="flex sm:hidden group-hover:flex gap-2 ml-2 sm:ml-1">
                  <button onClick={() => startEdit(item)} className="text-gray-400 hover:text-blue-500 text-xs">編輯</button>
                  <button onClick={() => handleDeleteItem(item.id)} className="text-gray-400 hover:text-red-500 text-xs">刪除</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}