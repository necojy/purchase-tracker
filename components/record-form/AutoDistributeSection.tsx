"use client";

type Props = {
  costPrice: string;
  setCostPrice: (value: string) => void;
  handleAutoDistribute: () => void;
};

export default function AutoDistributeSection({ costPrice, setCostPrice, handleAutoDistribute }: Props) {
  return (
    <div className="bg-yellow-50 p-5 rounded-2xl border border-yellow-200">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">💡</span>
        <h3 className="font-bold text-yellow-800 text-sm">智慧進貨單價分配 (依照最終發票金額自動算單價)</h3>
      </div>
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="w-full md:flex-1">
          <label className="block text-xs font-bold text-green-700 mb-1">最終結帳發票總額 (必填)</label>
          <input 
            type="number" 
            value={costPrice} 
            onChange={(e) => setCostPrice(e.target.value)} 
            placeholder="請輸入實際付的總金額" 
            className="w-full border-2 border-green-400 rounded-xl p-2.5 bg-white text-sm font-black text-green-600 outline-none" 
          />
        </div>
        <div className="w-full md:w-auto">
          <button type="button" onClick={handleAutoDistribute} className="w-full md:w-auto bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold px-6 py-3 rounded-xl transition shadow-sm text-sm whitespace-nowrap">
            ✨ 自動分配單價
          </button>
        </div>
      </div>
    </div>
  );
}