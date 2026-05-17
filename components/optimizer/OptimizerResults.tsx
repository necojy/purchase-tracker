"use client";

import { useRouter } from "next/navigation"; // 🌟 新增：引入路由跳轉功能

type Item = { id: number; name: string; sellPrice: number; originalPrice: number; maxQuantity: number; };
type CombinationResult = { totalPrice: number; totalOriginalPrice: number; items: { item: Item; quantity: number; subtotal: number; }[]; };

type Props = {
  optimizationResults: CombinationResult[];
  targetAmount: string;
  displayCount: string;
};

export default function OptimizerResults({ optimizationResults, targetAmount, displayCount }: Props) {
  const router = useRouter(); // 🌟 初始化路由

  // 🌟 核心新功能：處理一鍵套用到記帳
  const handleApplyToRecord = (result: CombinationResult) => {
    // 整理成表單需要的資料結構
    const pendingData = {
      totalPrice: result.totalPrice.toString(),
      items: result.items.map(r => ({
        itemId: r.item.id.toString(),
        quantity: r.quantity,
        originalPrice: r.item.originalPrice.toString(),
        costPrice: "" // 保留空白讓使用者可以用自動分配算單價
      }))
    };
    // 存入記憶體並跳轉回主頁
    localStorage.setItem("pendingAutoRecord", JSON.stringify(pendingData));
    router.push("/");
  };

  if (optimizationResults.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 min-h-[400px]">
        <div className="mb-6">
          <h2 className="text-lg font-black text-gray-700 flex items-center gap-2">🎯 最佳黃金排列購買組合推薦</h2>
        </div>
        <div className="h-[300px] flex flex-col justify-center items-center text-gray-400 font-bold bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <span className="text-4xl mb-2">💡</span>
          <p>在此金額範圍與商品組合下，找不到符合條件的排列方式</p>
          <p className="text-xs font-normal text-gray-400 mt-1">您可以嘗試調大「上限範圍」、「微調折數」或加選更多常用商品參與計算。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 min-h-[400px]">
      <div className="mb-6">
        <h2 className="text-lg font-black text-gray-700 flex items-center gap-2">🎯 最佳黃金排列購買組合推薦 (已設定為至多 {displayCount || 6} 組)</h2>
        <p className="text-sm text-gray-400 mt-1">系統已使用【原價】與【網頁自訂限購】為您挑選出【折後總價】最接近目標金額的完美排列方式。</p>
      </div>

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
                    <span className="bg-indigo-50 text-indigo-600 text-xs px-2.5 py-1 rounded-lg">數量 × {quantity}</span>
                    <span className="text-gray-700">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-600">${subtotal}</span>
                    <span className="text-xs text-orange-400 block font-normal">原價 ${item.originalPrice}</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 🌟 新增：一鍵套用跳轉按鈕 */}
            <button 
              onClick={() => handleApplyToRecord(result)}
              className="mt-5 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition shadow-sm flex justify-center items-center gap-2 hover:scale-[1.01]"
            >
              🚀 採用此組合前往記帳
            </button>
            
          </div>
        ))}
      </div>
    </div>
  );
}