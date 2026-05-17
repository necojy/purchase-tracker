"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import OptimizerSettings from "@/components/optimizer/OptimizerSettings";
import OptimizerItemList from "@/components/optimizer/OptimizerItemList";
import OptimizerResults from "@/components/optimizer/OptimizerResults";

type Item = { id: number; name: string; sellPrice: number; originalPrice: number; maxQuantity: number; };
type CombinationResult = { totalPrice: number; totalOriginalPrice: number; items: { item: Item; quantity: number; subtotal: number; }[]; };

export default function OptimizerPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [targetAmount, setTargetAmount] = useState<string>("1000"); 
  const [maxTolerance, setMaxTolerance] = useState<string>("200");   
  const [discountPercent, setDiscountPercent] = useState<string>("100"); 
  const [displayCount, setDisplayCount] = useState<string>("6");
  
  const [localMaxQuantities, setLocalMaxQuantities] = useState<Record<number, string>>({});
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch("/api/items", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const itemsData = Array.isArray(data) ? data : [];
          setItems(itemsData);
          
          const savedSelection = localStorage.getItem("optimizerSelectedItems");
          if (savedSelection) {
            const parsedIds = JSON.parse(savedSelection);
            const validIds = parsedIds.filter((id: number) => itemsData.some(i => i.id === id));
            setSelectedItemIds(new Set(validIds));
          } else {
            setSelectedItemIds(new Set(itemsData.map(i => i.id)));
          }

          const savedMaxQ = localStorage.getItem("optimizerLocalMaxQuantities");
          if (savedMaxQ) {
            setLocalMaxQuantities(JSON.parse(savedMaxQ));
          } else {
            const initialMaxQ: Record<number, string> = {};
            itemsData.forEach(i => { initialMaxQ[i.id] = (i.maxQuantity || 12).toString(); });
            setLocalMaxQuantities(initialMaxQ);
          }

          const savedDisplayCount = localStorage.getItem("optimizerDisplayCount");
          if (savedDisplayCount) setDisplayCount(savedDisplayCount);
        }
      } catch (error) { console.error("讀取商品失敗", error); } 
      finally { setIsLoading(false); }
    };
    fetchItems();
  }, []);

  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem("optimizerSelectedItems", JSON.stringify(Array.from(selectedItemIds)));
      localStorage.setItem("optimizerLocalMaxQuantities", JSON.stringify(localMaxQuantities));
      localStorage.setItem("optimizerDisplayCount", displayCount);
    }
  }, [selectedItemIds, localMaxQuantities, displayCount, items]);

  const toggleItemSelect = (id: number) => {
    const newSet = new Set(selectedItemIds);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedItemIds(newSet);
  };

  const toggleAllItems = (checked: boolean) => {
    if (checked) setSelectedItemIds(new Set(items.map(i => i.id))); else setSelectedItemIds(new Set());
  };

  const optimizationResults = useMemo(() => {
    const target = Number(targetAmount);
    const tolerance = Number(maxTolerance);
    const pct = (Number(discountPercent) || 100) / 100; 
    const displayLimit = Number(displayCount) || 6; 
    
    if (isNaN(target) || target <= 0 || items.length === 0 || selectedItemIds.size === 0 || pct <= 0) return [];
    
    const maxOrigLimit = Math.ceil((target + tolerance) / pct) + 500;
    const candidates = items.filter(i => selectedItemIds.has(i.id) && i.originalPrice > 0);
    if (candidates.length === 0) return [];

    const dp = new Array(maxOrigLimit + 1).fill(-1);
    const parent = new Array(maxOrigLimit + 1).fill(-1);
    dp[0] = 0; 

    for (const item of candidates) {
      const price = item.originalPrice; 
      const maxQ = localMaxQuantities[item.id] !== undefined && localMaxQuantities[item.id] !== "" 
        ? Number(localMaxQuantities[item.id]) : (item.maxQuantity || 12); 
      
      const used = new Array(maxOrigLimit + 1).fill(0);
      for (let v = price; v <= maxOrigLimit; v++) {
        if (dp[v - price] !== -1 && dp[v] === -1 && used[v - price] < maxQ) {
          dp[v] = item.id; parent[v] = v - price; used[v] = used[v - price] + 1; 
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
            return { item, quantity: qty, subtotal: item.originalPrice * qty };
          });
          validResults.push({ totalPrice: discountedPrice, totalOriginalPrice: v, items: resultItems });
        }
      }
    }
    return validResults.sort((a, b) => a.totalPrice - b.totalPrice).slice(0, displayLimit);
  }, [items, targetAmount, maxTolerance, discountPercent, selectedItemIds, localMaxQuantities, displayCount]);

  if (isLoading) return <div className="min-h-screen flex justify-center items-center font-bold text-gray-500">智慧計算中心載入中...</div>;

  return (
    <main className="min-h-screen p-4 sm:p-8 bg-[#F4F6F8] font-sans text-gray-800">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-blue-600 font-black text-xl transition shrink-0">← 返回主頁</Link>
            <h1 className="text-xl sm:text-2xl font-black tracking-wide text-indigo-600">✨ 智慧最優惠購買計算器</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <OptimizerSettings 
              targetAmount={targetAmount} setTargetAmount={setTargetAmount}
              maxTolerance={maxTolerance} setMaxTolerance={setMaxTolerance}
              discountPercent={discountPercent} setDiscountPercent={setDiscountPercent}
              displayCount={displayCount} setDisplayCount={setDisplayCount}
            />
            <OptimizerItemList 
              items={items} selectedItemIds={selectedItemIds} toggleItemSelect={toggleItemSelect} 
              toggleAllItems={toggleAllItems} localMaxQuantities={localMaxQuantities} setLocalMaxQuantities={setLocalMaxQuantities}
            />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <OptimizerResults 
              optimizationResults={optimizationResults} targetAmount={targetAmount} displayCount={displayCount} 
            />
          </div>
        </div>
      </div>
    </main>
  );
}