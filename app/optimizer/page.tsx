"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

type Item = { id: number; name: string; sellPrice: number; originalPrice: number; maxQuantity: number;};

// 湊單結果的資料結構
type CombinationResult = {
  totalPrice: number;         // 折扣後總價
  totalOriginalPrice: number; // 原價總計
  items: { item: Item; quantity: number; subtotal: number; }[];
};

export default function OptimizerPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 使用者輸入參數
  const [targetAmount, setTargetAmount] = useState<string>("1000"); // 目標金額
  const [maxTolerance, setMaxTolerance] = useState<string>("200");   // 允許超出的上限範圍
  const [discountPercent, setDiscountPercent] = useState<string>("100"); // 折扣百分比
  
  // 記錄哪些商品要參與湊單 (預設空集合，等資料載入後判定)
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch("/api/items", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const itemsData = Array.isArray(data) ? data : [];
          setItems(itemsData);
          
          // 🌟 1. 載入商品時，讀取瀏覽器中記憶的勾選狀態
          const savedSelection = localStorage.getItem("optimizerSelectedItems");
          if (savedSelection) {
            const parsedIds = JSON.parse(savedSelection);
            // 防呆：確保記憶裡的 ID 現在還真的存在於資料庫中（避免商品已刪除但還記著）
            const validIds = parsedIds.filter((id: number) => itemsData.some(i => i.id === id));
            setSelectedItemIds(new Set(validIds));
          } else {
            // 如果從來沒設定過，預設還是全部勾選
            setSelectedItemIds(new Set(itemsData.map(i => i.id)));
          }
        }
      } catch (error) {
        console.error("讀取商品失敗", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchItems();
  }, []);

  // 🌟 2. 只要勾選狀態有變動，就立刻存進瀏覽器的記憶體中
  useEffect(() => {
    // 確保商品有載入才存，避免一開始載入中的空狀態把記憶洗掉
    if (items.length > 0) {
      localStorage.setItem("optimizerSelectedItems", JSON.stringify(Array.from(selectedItemIds)));
    }
  }, [selectedItemIds, items]);

  // 切換商品勾選狀態
  const toggleItemSelect = (id: number) => {
    const newSet = new Set(selectedItemIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedItemIds(newSet);
  };

  // 全選 / 全不選
  const toggleAllItems = (checked: boolean) => {
    if (checked) setSelectedItemIds(new Set(items.map(i => i.id)));
    else setSelectedItemIds(new Set());
  };

  const optimizationResults = useMemo(() => {
    const target = Number(targetAmount);
    const tolerance = Number(maxTolerance);
    const pct = (Number(discountPercent) || 100) / 100; 
    
    if (isNaN(target) || target <= 0 || items.length === 0 || selectedItemIds.size === 0 || pct <= 0) return [];
    
    const maxOrigLimit = Math.ceil((target + tolerance) / pct) + 500;
    
    const candidates = items.filter(i => selectedItemIds.has(i.id) && i.originalPrice > 0);
    if (candidates.length === 0) return [];

    const dp = new Array(maxOrigLimit + 1).fill(-1);
    const parent = new Array(maxOrigLimit + 1).fill(-1);
    
    dp[0] = 0; 

    for (const item of candidates) {
      const price = item.originalPrice; 
      const maxQ = item.maxQuantity || 12; 
      
      const used = new Array(maxOrigLimit + 1).fill(0);

      for (let v = price; v <= maxOrigLimit; v++) {
        if (dp[v - price] !== -1 && dp[v] === -1 && used[v - price] < maxQ) {
          dp[v] = item.id;
          parent[v] = v - price;
          used[v] = used[v - price] + 1; 
        }
      }
    }

    const validResults: CombinationResult[] = [];

    for (let v = 1; v <= maxOrigLimit; v++) {
      if (dp[v] !== -1) {
        const discountedPrice = Math.round(v * pct);
        
        if (discountedPrice >= target && discountedPrice <= target + tolerance) {
          const itemCounts: Record<number, number> = {};
          let currentV = v;
          
          while (currentV > 0) {
            const itemId = dp[currentV];
            if (itemId === undefined || itemId === -1) break;
            itemCounts[itemId] = (itemCounts[itemId] || 0) + 1;
            currentV = parent[currentV];
          }

          const resultItems = Object.entries(itemCounts).map(([idStr, qty]) => {
            const item = candidates.find(c => c.id === Number(idStr))!;
            return {
              item,
              quantity: qty,
              subtotal: item.originalPrice * qty 
            };
          });

          validResults.push({
            totalPrice: discountedPrice,
            totalOriginalPrice: v,
            items: resultItems
          });
        }
      }
    }

    return validResults.sort((a, b) => a.totalPrice - b.totalPrice).slice(0, 6);
  }, [items, targetAmount, maxTolerance, discountPercent, selectedItemIds]);

  if (isLoading) return <div className="min-h-screen flex justify-center items-center font-bold text-gray-500">智慧計算中心載入中...</div>;

  return (
    <main className="min-h-screen p-4 sm:p-8 bg-[#F4F6F8] font-sans text-gray-800">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex justify-between items-center bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-blue-600 font-black text-xl transition shrink-0">
              ← 返回主頁
            </Link>
            <h1 className="text-xl sm:text-2xl font-black tracking-wide text-indigo-600">✨ 智慧最優惠購買計算器</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-1 space-y-6">
            
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-4">
              <h2 className="font-bold text-gray-700 text-base border-b pb-2">⚙️ 湊單條件設定</h2>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">折後目標金額 (不可低於此金額)</label>
                <input 
                  type="number" 
                  value={targetAmount} 
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full border-2 border-indigo-100 rounded-xl p-3 font-black text-indigo-600 outline-none focus:border-indigo-500 transition text-lg"
                  placeholder="例如: 1000"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">可超出之最高上限範圍 (+加成緩衝)</label>
                <input 
                  type="number" 
                  value={maxTolerance} 
                  onChange={(e) => setMaxTolerance(e.target.value)}
                  className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold text-gray-600 outline-none focus:border-indigo-400 transition"
                  placeholder="例如: 200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">折扣優惠 (例如: 88折輸入 88，不打折輸入 100)</label>
                <input 
                  type="number" 
                  value={discountPercent} 
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="w-full border-2 border-orange-200 rounded-xl p-3 font-black text-orange-600 outline-none focus:border-orange-500 transition text-lg"
                  placeholder="例如: 88"
                />
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  目前的【折後實際付款】總價範圍將落在：<br />
                  <span className="font-bold text-indigo-500">${Number(targetAmount) || 0}</span> ～ <span className="font-bold text-gray-600">${(Number(targetAmount) || 0) + (Number(maxTolerance) || 0)}</span> 之間。
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-3 max-h-[500px] flex flex-col">
              <div className="flex justify-between items-center border-b pb-2 shrink-0">
                <h2 className="font-bold text-gray-700 text-base">🛒 參與湊單商品選項</h2>
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-400 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={selectedItemIds.size === items.length}
                    onChange={(e) => toggleAllItems(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  全選
                </label>
              </div>

              <div className="overflow-y-auto space-y-2 flex-1 pr-1">
                {items.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => toggleItemSelect(item.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-sm font-bold cursor-pointer transition select-none ${selectedItemIds.has(item.id) ? 'bg-indigo-50/50 border-indigo-200 text-indigo-900' : 'bg-gray-50/50 border-gray-100 text-gray-400'}`}
                  >
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={selectedItemIds.has(item.id)}
                        onChange={() => {}} 
                        className="rounded text-indigo-600 cursor-pointer"
                      />
                      <span>{item.name}</span>
                    </div>
                    <span className={selectedItemIds.has(item.id) ? 'text-orange-500 font-black' : 'text-gray-400'}>
                      原${item.originalPrice}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 min-h-[400px]">
              <div className="mb-6">
                <h2 className="text-lg font-black text-gray-700 flex items-center gap-2">🎯 最佳黃金排列購買組合推薦 (已解鎖至多 6 組)</h2>
                <p className="text-sm text-gray-400 mt-1">系統已使用<strong className="text-orange-500">【原價】</strong>為您挑選出【折後總價】最接近目標金額、且不超過上限的完美排列方式。</p>
              </div>

              {optimizationResults.length > 0 ? (
                <div className="space-y-6">
                  {optimizationResults.map((result, idx) => (
                    <div key={idx} className="border-2 border-dashed border-gray-200 rounded-2xl p-5 bg-gray-50/50 relative overflow-hidden transition hover:border-indigo-400">
                      
                      <div className={`absolute top-0 right-0 px-4 py-1 rounded-bl-xl text-xs font-black text-white ${idx < 3 ? 'bg-green-500' : 'bg-blue-500'}`}>
                        推薦組合第 {idx + 1} 首選
                      </div>

                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                        <div>
                          <span className="text-xs font-bold text-orange-500">🔥 折扣後預估應付金額</span>
                          <p className="text-3xl font-black text-indigo-600">${result.totalPrice}</p>
                          <span className="text-xs text-gray-400 block font-bold mt-0.5">商品原價總計: ${result.totalOriginalPrice}</span>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className="text-xs font-bold text-gray-400">比目標超出 (折後)</span>
                          <p className="text-sm font-bold text-gray-600">+${result.totalPrice - Number(targetAmount)} 元</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y">
                        {result.items.map(({ item, quantity, subtotal }) => (
                          <div key={item.id} className="p-3 flex justify-between items-center text-sm font-bold">
                            <div className="flex items-center gap-3">
                              <span className="bg-indigo-50 text-indigo-600 text-xs px-2.5 py-1 rounded-lg">
                                數量 × {quantity}
                              </span>
                              <span className="text-gray-700">{item.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-gray-600">${subtotal}</span>
                              <span className="text-xs text-orange-400 block font-normal">原價 ${item.originalPrice}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[300px] flex flex-col justify-center items-center text-gray-400 font-bold bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <span className="text-4xl mb-2">💡</span>
                  <p>在此金額範圍與商品組合下，找不到符合條件的排列方式</p>
                  <p className="text-xs font-normal text-gray-400 mt-1">您可以嘗試調大「上限範圍」、「微調折數」或加選更多常用商品參與計算。</p>
                </div>
              )}
            </div>
          </div>

        </div>
        
      </div>
    </main>
  );
}