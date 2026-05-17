"use client";

type Props = {
  targetAmount: string; setTargetAmount: (v: string) => void;
  maxTolerance: string; setMaxTolerance: (v: string) => void;
  discountPercent: string; setDiscountPercent: (v: string) => void;
  displayCount: string; setDisplayCount: (v: string) => void;
};

export default function OptimizerSettings({
  targetAmount, setTargetAmount,
  maxTolerance, setMaxTolerance,
  discountPercent, setDiscountPercent,
  displayCount, setDisplayCount
}: Props) {
  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-4">
      <h2 className="font-bold text-gray-700 text-base border-b pb-2">⚙️ 湊單條件設定</h2>
      
      <div>
        <label className="block text-xs font-bold text-gray-500 mb-1">折後目標金額 (不可低於此金額)</label>
        <input 
          type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)}
          className="w-full border-2 border-indigo-100 rounded-xl p-3 font-black text-indigo-600 outline-none focus:border-indigo-500 transition text-lg"
          placeholder="例如: 1000"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 mb-1">可超出之最高上限範圍 (+加成緩衝)</label>
        <input 
          type="number" value={maxTolerance} onChange={(e) => setMaxTolerance(e.target.value)}
          className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold text-gray-600 outline-none focus:border-indigo-400 transition"
          placeholder="例如: 200"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 mb-1">折扣優惠 (例如: 88折輸入 88，不打折輸入 100)</label>
        <input 
          type="number" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)}
          className="w-full border-2 border-orange-200 rounded-xl p-3 font-black text-orange-600 outline-none focus:border-orange-500 transition text-lg"
          placeholder="例如: 88"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 mb-1">顯示組合排列表數 (可自定義筆數)</label>
        <input 
          type="number" min="1" max="30" value={displayCount} onChange={(e) => setDisplayCount(e.target.value)}
          className="w-full border-2 border-purple-100 rounded-xl p-3 font-black text-purple-600 outline-none focus:border-purple-400 transition text-base"
          placeholder="例如: 6"
        />
        <p className="text-xs text-gray-400 mt-2 leading-relaxed">
          目前的【折後實際付款】總價範圍將落在：<br />
          <span className="font-bold text-indigo-500">${Number(targetAmount) || 0}</span> ～ <span className="font-bold text-gray-600">${(Number(targetAmount) || 0) + (Number(maxTolerance) || 0)}</span> 之間。
        </p>
      </div>
    </div>
  );
}