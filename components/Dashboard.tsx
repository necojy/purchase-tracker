"use client";

type RecordType = {
  id: number;
  costPrice: number;
  isReconciled: boolean;
  item: { sellPrice: number };
};

type Props = {
  records: RecordType[];
};

export default function Dashboard({ records }: Props) {
  // 1. 未對帳成本：找沒有打勾的，把成本加起來
  const unreconciledCost = records
    .filter((r) => !r.isReconciled)
    .reduce((sum, r) => sum + r.costPrice, 0);

  // 2. 未對帳預期營收：找沒有打勾的，把預期售價加起來
  const unreconciledRevenue = records
    .filter((r) => !r.isReconciled)
    .reduce((sum, r) => sum + (r.item?.sellPrice || 0), 0);

  // 3. 所有時間累計獲利：全部紀錄的 (售價 - 成本) 加總
  const totalProfit = records.reduce((sum, r) => {
    const profit = (r.item?.sellPrice || 0) - r.costPrice;
    return sum + profit;
  }, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
      {/* 未對帳成本卡片 (深色) */}
      <div className="bg-[#111827] text-white rounded-[2rem] p-8 shadow-md flex flex-col justify-center">
        <p className="text-gray-400 text-sm font-bold mb-2 tracking-wide">未對帳成本</p>
        <p className="text-4xl font-black">${unreconciledCost}</p>
      </div>

      {/* 未對帳預期營收卡片 (白色) */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col justify-center">
        <p className="text-gray-400 text-sm font-bold mb-2 tracking-wide">未對帳預期營收</p>
        <p className="text-4xl font-black text-blue-600">${unreconciledRevenue}</p>
      </div>

      {/* 所有時間累計獲利卡片 (綠色) */}
      <div className="bg-[#10B981] text-white rounded-[2rem] p-8 shadow-md flex flex-col justify-center">
        <p className="text-green-100 text-sm font-bold mb-2 tracking-wide">所有時間累計獲利</p>
        <p className="text-4xl font-black">${totalProfit}</p>
      </div>
    </div>
  );
}