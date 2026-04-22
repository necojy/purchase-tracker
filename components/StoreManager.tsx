"use client";

import { useState } from "react";

type Store = { id: number; name: string; category: string; };
type Props = { stores: Store[]; refreshData: () => void; };

export default function StoreManager({ stores, refreshData }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("SHP");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    await fetch("/api/stores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, category }) });
    setName(""); setIsAdding(false); refreshData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("確定刪除此店家？")) return;
    await fetch("/api/stores", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    refreshData();
  };

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100 mb-6 mt-6">
      <div className="flex flex-wrap justify-between items-center cursor-pointer group" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-3">
          <h2 className="text-gray-500 font-bold text-sm group-hover:text-gray-700 transition">🏪 常用店家清單 ({stores.length})</h2>
          <span className={`text-gray-400 text-xs transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
        </div>
        <button onClick={(e) => { e.stopPropagation(); if (!isExpanded) setIsExpanded(true); setIsAdding(!isAdding); }} className="text-blue-600 font-bold text-sm hover:text-blue-700 transition w-full sm:w-auto text-right sm:text-left mt-2 sm:mt-0">+ 新增預設店家</button>
      </div>
      
      {isExpanded && (
        <div className="mt-5 animate-fade-in border-t border-gray-50 pt-5">
          {isAdding && (
            <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2 mb-5 bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-200">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full sm:w-32 px-3 py-2 rounded-lg border outline-none font-bold text-gray-600">
                <option value="SHP">蝦皮店</option>
                <option value="CVS">一般超商</option>
              </select>
              <input type="text" placeholder="輸入店名 (例: 全家神農店)" value={name} onChange={(e) => setName(e.target.value)} className="w-full sm:flex-1 px-3 py-2 rounded-lg border outline-none" required />
              <button type="submit" className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">儲存</button>
            </form>
          )}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {stores.map((store) => (
              <div key={store.id} className="bg-gray-50 border border-gray-100 px-3 py-2 sm:px-4 rounded-2xl flex items-center justify-between gap-3 font-medium shadow-sm group w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded text-white ${store.category === 'SHP' ? 'bg-orange-500' : 'bg-blue-500'}`}>{store.category === 'SHP' ? '蝦皮' : '超商'}</span>
                  <span className="text-sm font-bold text-gray-700">{store.name}</span>
                </div>
                <button onClick={() => handleDelete(store.id)} className="text-gray-400 hover:text-red-500 text-xs ml-2 flex sm:hidden group-hover:flex">刪除</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}