"use client";

type Item = { id: number; name: string; sellPrice: number; originalPrice: number; maxQuantity: number; };
type RecordItem = { itemId: string; quantity: number; originalPrice: string; costPrice: string; };

type Props = {
  items: Item[];
  recordItems: RecordItem[];
  updateRecordItem: (index: number, field: string, value: string | number) => void;
  addRecordItem: () => void;
  removeRecordItem: (index: number) => void;
};

export default function ItemListSection({ items, recordItems, updateRecordItem, addRecordItem, removeRecordItem }: Props) {
  return (
    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
      <div className="flex justify-between items-center mb-1">
        <h3 className="font-bold text-gray-700 text-sm">🛒 購買品項清單</h3>
        <button type="button" onClick={addRecordItem} className="text-blue-600 font-bold text-sm hover:text-blue-800 bg-white px-3 py-1.5 rounded-lg shadow-sm border transition">+ 加入商品</button>
      </div>
      <div className="flex text-xs font-bold text-gray-400 px-2 hidden md:flex">
        <div className="flex-1">商品名稱</div>
        <div className="w-24 text-center">店內單價</div>
        <div className="w-20 text-center">數量</div>
        <div className="w-24 text-center text-orange-400">折後進貨價</div>
        <div className="w-8"></div>
      </div>
      {recordItems.map((rItem, index) => (
        <div key={index} className="flex flex-wrap md:flex-nowrap gap-2 items-center bg-white p-2 rounded-xl shadow-sm border border-gray-100">
          <div className="w-full md:flex-1">
            <select value={rItem.itemId} onChange={(e) => updateRecordItem(index, 'itemId', e.target.value)} className="w-full border rounded-lg p-2.5 bg-gray-50 text-sm font-bold text-gray-700 outline-none">
              {items.map(item => <option key={item.id} value={item.id}>{item.name} (${item.sellPrice})</option>)}
            </select>
          </div>
          <div className="w-[30%] md:w-24"><input type="number" placeholder="原價" value={rItem.originalPrice} onChange={(e) => updateRecordItem(index, 'originalPrice', e.target.value)} className="w-full border rounded-lg p-2.5 bg-gray-50 text-sm font-bold text-center outline-none" /></div>
          <div className="w-[20%] md:w-20"><input type="number" min="1" placeholder="數量" value={rItem.quantity} onChange={(e) => updateRecordItem(index, 'quantity', Number(e.target.value))} className="w-full border rounded-lg p-2.5 bg-gray-50 text-sm font-bold text-center outline-none" required /></div>
          <div className="w-[30%] md:w-24"><input type="number" step="0.01" placeholder="進貨價" value={rItem.costPrice} onChange={(e) => updateRecordItem(index, 'costPrice', e.target.value)} className="w-full border-2 border-orange-200 rounded-lg p-2.5 bg-orange-50 text-orange-600 text-sm font-black text-center outline-none" required /></div>
          <div className="w-[10%] md:w-8 text-center">{recordItems.length > 1 && <button type="button" onClick={() => removeRecordItem(index)} className="text-red-400 hover:text-red-600 font-bold pb-1 px-2">X</button>}</div>
        </div>
      ))}
    </div>
  );
}