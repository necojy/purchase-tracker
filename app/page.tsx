"use client";

import { useState, useEffect } from "react";

type Item = {
  id: number;
  name: string;
  sellPrice: number;
};

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");

  // 編輯狀態管理
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/items", { cache: "no-store" });
      const data = await res.json();
      setItems(data);
    } catch (error) {
      console.error("抓取商品失敗", error);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // --- 新增 ---
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemPrice) return;
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newItemName, sellPrice: newItemPrice }),
      });
      if (res.ok) {
        setNewItemName("");
        setNewItemPrice("");
        setIsAddingItem(false);
        fetchItems();
      }
    } catch (error) {
      console.error("錯誤:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("確定要刪除這個商品嗎？")) return; 
    try {
      const res = await fetch("/api/items", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      
      if (res.ok) {
        fetchItems(); // 成功就更新畫面
      } else {
        // 🌟 加上這行：如果失敗，告訴我們原因
        alert("❌ 刪除失敗！這個商品可能已經有購買紀錄了，不能隨便刪除喔。");
      }
    } catch (error) {
      console.error("刪除失敗", error);
    }
  };

  // --- 啟動編輯模式 ---
  const startEdit = (item: Item) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditPrice(item.sellPrice.toString());
  };

  // --- 儲存編輯 ---
  const handleSaveEdit = async (id: number) => {
    try {
      const res = await fetch("/api/items", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: editName, sellPrice: editPrice }),
      });
      if (res.ok) {
        setEditingId(null); // 關閉編輯模式
        fetchItems();
      }
    } catch (error) {
      console.error("更新失敗", error);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-[#F4F6F8] font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* 常用商品清單 區塊 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-gray-500 font-bold text-sm">常用商品清單</h2>
            <button 
              onClick={() => setIsAddingItem(!isAddingItem)}
              className="text-blue-600 font-bold text-sm hover:text-blue-700 transition"
            >
              + 新增商品售價
            </button>
          </div>

          {/* 新增商品的隱藏表單 */}
          {isAddingItem && (
            <form onSubmit={handleAddItem} className="flex gap-2 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
              <input type="text" placeholder="商品名稱" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500" required />
              <input type="number" placeholder="預期售價" value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value)} className="w-32 px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500" required />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700">儲存</button>
            </form>
          )}

          {/* 商品標籤列表 */}
          <div className="flex flex-wrap gap-3">
            {items.map((item) => (
              <div key={item.id} className="bg-gray-50 border border-gray-100 text-gray-800 px-4 py-2 rounded-2xl flex items-center gap-3 font-medium shadow-sm group">
                
                {/* 判斷：如果是編輯模式，顯示輸入框；如果是一般模式，顯示文字 */}
                {editingId === item.id ? (
                  <div className="flex items-center gap-2">
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-24 px-2 py-1 rounded border text-sm" />
                    <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="w-16 px-2 py-1 rounded border text-sm text-blue-600" />
                    <button onClick={() => handleSaveEdit(item.id)} className="text-green-600 text-sm font-bold hover:text-green-700">完成</button>
                    <button onClick={() => setEditingId(null)} className="text-gray-400 text-sm hover:text-gray-600">取消</button>
                  </div>
                ) : (
                  <>
                    <span>{item.name}</span>
                    <span className="text-blue-600 font-bold">${item.sellPrice}</span>
                    
                    {/* 隱藏的按鈕：滑鼠移過去 (group-hover) 才會顯示 */}
                    <div className="hidden group-hover:flex gap-2 ml-1">
                      <button onClick={() => startEdit(item)} className="text-gray-400 hover:text-blue-500 text-xs">編輯</button>
                      <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-500 text-xs">刪除</button>
                    </div>
                  </>
                )}

              </div>
            ))}
            {items.length === 0 && <span className="text-gray-400 text-sm">目前還沒有商品喔～</span>}
          </div>
        </div>

      </div>
    </main>
  );
}