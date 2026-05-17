"use client";

import { useState } from "react";

// 🌟 字典補上 maxQuantity
type Item = { id: number; name: string; sellPrice: number; originalPrice: number; maxQuantity: number; };

type Props = { items: Item[]; refreshData: () => void; };

export default function ItemManager({ items, refreshData }: Props) {
  const [isListExpanded, setIsListExpanded] = useState(false); 
  
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newOriginalPrice, setNewOriginalPrice] = useState("");
  const [newMaxQuantity, setNewMaxQuantity] = useState("12"); // 🌟 新增狀態：預設給 12

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editOriginalPrice, setEditOriginalPrice] = useState("");
  const [editMaxQuantity, setEditMaxQuantity] = useState(""); // 🌟 編輯用的狀態

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemPrice || !newOriginalPrice) return;
    await fetch("/api/items", { 
      method: "POST", headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ name: newItemName, sellPrice: newItemPrice, originalPrice: newOriginalPrice, maxQuantity: newMaxQuantity }) 
    });
    setNewItemName(""); setNewItemPrice(""); setNewOriginalPrice(""); setNewMaxQuantity("12"); setIsAddingItem(false); 
    refreshData();
  };

const handleDeleteItem = async (id: number) => {
    if (!confirm("確定刪除此商品？\n(注意：如果此商品已經有購買紀錄，將無法直接刪除！)")) return;
    
    const res = await fetch("/api/items", { 
      method: "DELETE", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ id }) 
    });

    if (!res.ok) {
      alert("❌ 刪除失敗！\n\n原因：這個商品已經被記錄在下方的「購買紀錄」中了。\n為保護記帳資料完整，系統禁止刪除已使用的商品。\n\n💡 建議做法：請先刪除包含此商品的紀錄，或是點擊編輯將商品改名為「(停用)」。");
    }
    refreshData();
  };

  const startEdit = (item: Item) => { 
    setEditingId(item.id); setEditName(item.name); 
    setEditPrice(item.sellPrice.toString()); setEditOriginalPrice(item.originalPrice?.toString() || "0"); 
    setEditMaxQuantity(item.maxQuantity?.toString() || "12");
  };
  
  const handleSaveEdit = async (id: number) => {
    await fetch("/api/items", { 
      method: "PUT", headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ id, name: editName, sellPrice: editPrice, originalPrice: editOriginalPrice, maxQuantity: editMaxQuantity }) 
    });
    setEditingId(null); refreshData();
  };

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100">
      
      <div 
        className="flex flex-wrap justify-between items-center cursor-pointer group" 
        onClick={() => setIsListExpanded(!isListExpanded)}
      >
        <div className="flex items-center gap-3">
          <h2 className="text-gray-500 font-bold text-sm group-hover:text-gray-700 transition">常用商品清單 ({items.length})</h2>
          <span className={`text-gray-400 text-xs transform transition-transform duration-300 ${isListExpanded ? 'rotate-180' : ''}`}>▼</span>
        </div>
        
        <button 
          onClick={(e) => {
            e.stopPropagation(); 
            if (!isListExpanded) setIsListExpanded(true); 
            setIsAddingItem(!isAddingItem);
          }} 
          className="text-blue-600 font-bold text-sm hover:text-blue-700 transition w-full sm:w-auto text-right sm:text-left mt-2 sm:mt-0"
        >
          + 新增商品設定
        </button>
      </div>
      
      {isListExpanded && (
        <div className="mt-5 animate-fade-in border-t border-gray-50 pt-5">
          {isAddingItem && (
            <form onSubmit={handleAddItem} className="flex flex-col sm:flex-row gap-2 mb-5 bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-200">
              <input type="text" placeholder="商品名稱" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="w-full sm:flex-1 px-3 py-2 rounded-lg border outline-none" required />
              <input type="number" placeholder="常用原價" value={newOriginalPrice} onChange={(e) => setNewOriginalPrice(e.target.value)} className="w-full sm:w-28 px-3 py-2 rounded-lg border outline-none text-orange-600 font-bold" required />
              <input type="number" placeholder="預期售價" value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value)} className="w-full sm:w-28 px-3 py-2 rounded-lg border outline-none text-blue-600 font-bold" required />
              {/* 🌟 新增上限輸入框 */}
              <input type="number" placeholder="上限" value={newMaxQuantity} onChange={(e) => setNewMaxQuantity(e.target.value)} className="w-full sm:w-20 px-3 py-2 rounded-lg border outline-none text-purple-600 font-bold" required title="最高購買數量" />
              <button type="submit" className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">儲存</button>
            </form>
          )}

          <div className="flex flex-wrap gap-2 sm:gap-3">
            {items.map((item) => (
              <div key={item.id} className="bg-gray-50 border border-gray-100 px-3 py-2 sm:px-4 rounded-2xl flex items-center gap-2 sm:gap-3 font-medium shadow-sm group w-full sm:w-auto">
                {editingId === item.id ? (
                  <div className="flex flex-wrap items-center gap-2 w-full">
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full sm:w-24 px-2 py-1 rounded border text-sm" />
                    <input type="number" placeholder="原價" value={editOriginalPrice} onChange={(e) => setEditOriginalPrice(e.target.value)} className="w-full sm:w-16 px-2 py-1 rounded border text-sm text-orange-600 font-bold" />
                    <input type="number" placeholder="售價" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="w-full sm:w-16 px-2 py-1 rounded border text-sm text-blue-600 font-bold" />
                    {/* 🌟 編輯模式的上限輸入框 */}
                    <input type="number" placeholder="上限" value={editMaxQuantity} onChange={(e) => setEditMaxQuantity(e.target.value)} className="w-full sm:w-16 px-2 py-1 rounded border text-sm text-purple-600 font-bold" />
                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                      <button onClick={() => handleSaveEdit(item.id)} className="text-green-600 text-sm font-bold bg-green-50 px-2 py-1 rounded">完成</button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400 text-sm bg-gray-100 px-2 py-1 rounded">取消</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center w-full sm:w-auto">
                    <div className="flex items-center gap-3">
                      <span>{item.name}</span>
                      <div className="flex gap-2 text-sm">
                        <span className="text-orange-500 font-bold bg-orange-50 px-1.5 rounded">原${item.originalPrice || 0}</span>
                        <span className="text-blue-600 font-bold bg-blue-50 px-1.5 rounded">售${item.sellPrice}</span>
                        {/* 🌟 顯示上限數量 */}
                        <span className="text-purple-600 font-bold bg-purple-50 px-1.5 rounded">限{item.maxQuantity}件</span>
                      </div>
                    </div>
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
      )}
    </div>
  );
}