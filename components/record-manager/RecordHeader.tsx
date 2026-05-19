"use client";

type Props = {
  filterBuyer: string;
  setFilterBuyer: (name: string) => void;
  targetStore: string | null;
  setTargetStore: (store: string | null) => void;
  isAddingRecord: boolean;
  setIsAddingRecord: (val: boolean) => void;
};

export default function RecordHeader({
  filterBuyer, setFilterBuyer,
  targetStore, setTargetStore,
  isAddingRecord, setIsAddingRecord
}: Props) {
  return (
    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 mt-8 gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto">
        <h1 className="text-2xl font-black tracking-wide flex items-center gap-2 shrink-0">購買與獲利紀錄 🧾</h1>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto scrollbar-hide">
          {['全部', '洪', '雅', '宥', '崑'].map(name => (
            <button
              key={name}
              onClick={() => setFilterBuyer(name)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                filterBuyer === name ? 'bg-blue-600 text-white shadow-md transform scale-105' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {name === '全部' ? '全部人員' : name}
            </button>
          ))}
        </div>
        
        {targetStore && (
          <button 
            onClick={() => setTargetStore(null)}
            className="ml-0 sm:ml-4 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-bold px-4 py-1.5 rounded-full text-sm flex items-center gap-2 transition animate-fade-in shadow-sm"
          >
            📍 篩選：{targetStore} ✕
          </button>
        )}
      </div>
      <button 
        onClick={() => setIsAddingRecord(!isAddingRecord)} 
        className="w-full xl:w-auto bg-[#1C4ED8] hover:bg-blue-700 text-white font-bold py-3 sm:py-2 px-5 rounded-full shadow-md transition text-center shrink-0"
      >
        + 開始新紀錄
      </button>
    </div>
  );
}