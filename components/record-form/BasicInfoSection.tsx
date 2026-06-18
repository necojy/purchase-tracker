"use client";

type Store = { id: number; name: string; category: string; };

type Props = {
  recordForm: any;
  setRecordForm: React.Dispatch<React.SetStateAction<any>>;
  currentCategoryStores: Store[];
  handleCategoryChange: (cat: string) => void;
};

export default function BasicInfoSection({ recordForm, setRecordForm, currentCategoryStores, handleCategoryChange }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
      <div className="w-full">
        <label className="block text-sm text-gray-500 mb-1">購買人</label>
        {/* 🌟 加上「請選擇人員」空選項 */}
        <select value={recordForm.buyer} onChange={(e) => setRecordForm((prev: any) => ({...prev, buyer: e.target.value}))} className="w-full border rounded-xl p-3 bg-gray-50 font-medium outline-none focus:border-blue-400">
          <option value="" disabled>請選擇人員</option>
          <option value="洪">洪</option><option value="雅">雅</option><option value="宥">宥</option><option value="崑">崑</option>
        </select>
      </div>
      <div className="w-full">
        <label className="block text-sm text-gray-500 mb-1">購買地方</label>
        <select value={recordForm.location} onChange={(e) => setRecordForm((prev: any) => ({...prev, location: e.target.value}))} className="w-full border rounded-xl p-3 bg-gray-50 font-medium outline-none">
          <option value="蝦皮">蝦皮</option><option value="屈臣氏">屈臣氏</option>
        </select>
      </div>
      <div className="w-full">
        <label className="block text-sm text-gray-500 mb-1">付款方式</label>
        <select value={recordForm.paymentMethod} onChange={(e) => setRecordForm((prev: any) => ({...prev, paymentMethod: e.target.value}))} className="w-full border rounded-xl p-3 bg-gray-50 font-medium outline-none">
          <option value="貨到付款">貨到付款</option><option value="信用卡">信用卡</option><option value="匯款">匯款</option>
        </select>
      </div>
      
      <div className="w-full">
        <label className="block text-sm text-gray-500 mb-1">取貨通路</label>
        <div className="flex gap-2">
          <button type="button" onClick={() => handleCategoryChange("SHP")} className={`flex-1 py-[11px] rounded-xl font-bold text-sm transition ${recordForm.pickupCategory === 'SHP' ? 'bg-orange-500 text-white shadow-sm' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>蝦皮店</button>
          <button type="button" onClick={() => handleCategoryChange("CVS")} className={`flex-1 py-[11px] rounded-xl font-bold text-sm transition ${recordForm.pickupCategory === 'CVS' ? 'bg-blue-500 text-white shadow-sm' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>超商</button>
        </div>
      </div>

      <div className="w-full">
        <label className="block text-sm text-gray-500 mb-1">取貨店名</label>
        {/* 🌟 加上「請選擇店名」空選項 */}
        <select 
          value={recordForm.pickupLocation} 
          onChange={(e) => setRecordForm((prev: any) => ({...prev, pickupLocation: e.target.value}))} 
          className={`w-full border rounded-xl p-3 bg-gray-50 font-medium outline-none transition focus:border-blue-400`}
        >
          <option value="" disabled>請選擇店名</option>
          {currentCategoryStores.length > 0 ? (
            currentCategoryStores.map(store => (
              <option key={store.id} value={store.name}>{store.name}</option>
            ))
          ) : (
            <option value="" disabled>上方無預設店家</option>
          )}
        </select>
      </div>
    </div>
  );
}