"use client";

type Item = { id: number; name: string; sellPrice: number; originalPrice: number; maxQuantity: number; };

type Props = {
  items: Item[];
  selectedItemIds: Set<number>;
  toggleItemSelect: (id: number) => void;
  toggleAllItems: (checked: boolean) => void;
  localMaxQuantities: Record<number, string>;
  setLocalMaxQuantities: (updater: Record<number, string>) => void;
};

export default function OptimizerItemList({
  items, selectedItemIds, toggleItemSelect, toggleAllItems, localMaxQuantities, setLocalMaxQuantities
}: Props) {
  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-3 max-h-[500px] flex flex-col">
      <div className="flex justify-between items-center border-b pb-2 shrink-0">
        <h2 className="font-bold text-gray-700 text-base">🛒 參與湊單商品選項</h2>
        <label className="flex items-center gap-1.5 text-xs font-bold text-gray-400 cursor-pointer select-none">
          <input 
            type="checkbox" checked={selectedItemIds.size === items.length && items.length > 0} 
            onChange={(e) => toggleAllItems(e.target.checked)} className="rounded text-indigo-600"
          />
          全選
        </label>
      </div>

      <div className="overflow-y-auto space-y-2 flex-1 pr-1">
        {items.map(item => (
          <div 
            key={item.id} onClick={() => toggleItemSelect(item.id)}
            className={`flex items-center justify-between p-2.5 rounded-xl border text-sm font-bold cursor-pointer transition select-none ${selectedItemIds.has(item.id) ? 'bg-indigo-50/50 border-indigo-200 text-indigo-900' : 'bg-gray-50/50 border-gray-100 text-gray-400'}`}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <input type="checkbox" checked={selectedItemIds.has(item.id)} onChange={() => {}} className="rounded text-indigo-600 cursor-pointer shrink-0" />
              <span className="truncate">{item.name}</span>
            </div>
            
            <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              {selectedItemIds.has(item.id) && (
                <div className="flex items-center gap-0.5 text-xs font-black text-purple-600">
                  <span>限</span>
                  <input 
                    type="number" min="1" value={localMaxQuantities[item.id] || ""}
                    onChange={(e) => setLocalMaxQuantities({ ...localMaxQuantities, [item.id]: e.target.value })}
                    placeholder="12" className="w-11 border border-purple-200 rounded px-1 py-0.5 text-center bg-white font-black text-purple-700 outline-none focus:border-purple-500 shadow-sm" 
                    title="僅在此頁面臨時調整上限"
                  />
                </div>
              )}
              <span className={selectedItemIds.has(item.id) ? 'text-orange-500 font-black' : 'text-gray-400'}>
                原${item.originalPrice}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}