"use client";

type Item = { id: number; name: string; sellPrice: number; };
type PurchaseItem = { id: number; quantity: number; costPrice: number; item: Item; };
type RecordType = { id: number; isReconciled: boolean; items: PurchaseItem[]; };

type Props = { records: RecordType[]; };

export default function Dashboard({ records }: Props) {
  // 🌟 成本 = (各商品進貨單價 * 數量) 的加總
  const unreconciledCost = records.filter(r => !r.isReconciled).reduce((sum, r) => {
    const recordCost = (r.items || []).reduce((sub, i) => sub + (i.costPrice || 0) * i.quantity, 0);
    return sum + recordCost;
  }, 0);

  const unreconciledRevenue = records.filter(r => !r.isReconciled).reduce((sum, r) => {
    const recordRev = (r.items || []).reduce((sub, i) => sub + (i.item?.sellPrice || 0) * i.quantity, 0);
    return sum + recordRev;
  }, 0);

  const totalProfit = records.reduce((sum, r) => {
    const recordRev = (r.items || []).reduce((sub, i) => sub + (i.item?.sellPrice || 0) * i.quantity, 0);
    const recordCost = (r.items || []).reduce((sub, i) => sub + (i.costPrice || 0) * i.quantity, 0);
    return sum + (recordRev - recordCost);
  }, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
      <div className="bg-[#111827] text-white rounded-[2rem] p-8 shadow-md flex flex-col justify-center">
        <p className="text-gray-400 text-sm font-bold mb-2 tracking-wide">未對帳成本</p>
        <p className="text-4xl font-black">${unreconciledCost}</p>
      </div>
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col justify-center">
        <p className="text-gray-400 text-sm font-bold mb-2 tracking-wide">未對帳預期營收</p>
        <p className="text-4xl font-black text-blue-600">${unreconciledRevenue}</p>
      </div>
      <div className="bg-[#10B981] text-white rounded-[2rem] p-8 shadow-md flex flex-col justify-center">
        <p className="text-green-100 text-sm font-bold mb-2 tracking-wide">所有時間累計獲利</p>
        <p className="text-4xl font-black">${totalProfit}</p>
      </div>
    </div>
  );
}