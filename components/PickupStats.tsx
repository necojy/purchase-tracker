"use client";

import { useMemo, useState } from "react";

type RecordType = { id: number; pickupLocation: string; pickupCategory: string; isReconciled: boolean; isRefunded: boolean; };
// 🌟 更新 Props 接收狀態
type Props = { records: RecordType[]; targetStore: string | null; setTargetStore: (store: string | null) => void; };

export default function PickupStats({ records, targetStore, setTargetStore }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeRecords = useMemo(() => records.filter(r => !r.isReconciled && !r.isRefunded), [records]);

  const getStats = (category: string) => {
    const list = activeRecords.filter(r => r.pickupCategory === category);
    const counts: { [key: string]: number } = {};
    list.forEach(r => {
      const loc = r.pickupLocation || "未填寫店名";
      counts[loc] = (counts[loc] || 0) + 1;
    });
    const entries = Object.entries(counts);
    if (entries.length === 0) return { entries: [], minLoc: "無", total: 0 };
    const minCount = Math.min(...entries.map(e => e[1]));
    const minLoc = entries.find(e => e[1] === minCount)?.[0] || "無";
    return { entries, minLoc, total: list.length };
  };

  const shp = getStats("SHP");
  const cvs = getStats("CVS");
  const totalActive = shp.total + cvs.total;

  if (totalActive === 0) return null;

  // 🌟 點擊店鋪時的處理邏輯
  const handleStoreClick = (loc: string) => {
    const newTarget = loc === targetStore ? null : loc; // 點擊一樣的就取消篩選
    setTargetStore(newTarget);
    
    // 如果是選中狀態，稍微延遲一下讓 RecordManager 渲染好，再平滑捲動過去
    if (newTarget) {
      setTimeout(() => {
        document.getElementById('record-manager-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center cursor-pointer group" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-3">
          <h2 className="text-gray-500 font-bold text-sm group-hover:text-gray-700 transition">
            📦 取貨負載與路線分析 (待取 {totalActive} 件)
          </h2>
          <span className={`text-gray-400 text-xs transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 animate-fade-in border-t border-gray-50 pt-5">
          {/* 蝦皮店到店區塊 */}
          <div className="bg-orange-50 border border-orange-100 rounded-[2rem] p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-orange-700 font-black flex items-center gap-2">蝦皮店到店 ({shp.total})</h3>
              {shp.total > 0 && <span className="text-xs font-bold bg-white text-orange-500 px-3 py-1 rounded-full border border-orange-200 shadow-sm">優先去：{shp.minLoc}</span>}
            </div>
            <div className="space-y-2">
              {shp.entries.length > 0 ? shp.entries.map(([loc, count]) => (
                // 🌟 改成可點擊的按鈕，並加上動態樣式
                <div 
                  key={loc} 
                  onClick={() => handleStoreClick(loc)}
                  className={`flex justify-between p-2.5 rounded-xl text-sm font-bold shadow-sm border transition cursor-pointer hover:scale-[1.02] active:scale-95 ${targetStore === loc ? 'bg-orange-500 text-white border-orange-600' : 'bg-white/60 border-white text-gray-600 hover:bg-orange-100'}`}
                >
                  <span>{loc}</span>
                  <span className={targetStore === loc ? 'text-white' : 'text-orange-600'}>{count} 件</span>
                </div>
              )) : <p className="text-orange-300 text-sm italic">目前沒有蝦皮待取貨</p>}
            </div>
          </div>

          {/* 一般超商區塊 */}
          <div className="bg-blue-50 border border-blue-100 rounded-[2rem] p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-blue-700 font-black flex items-center gap-2">一般超商 ({cvs.total})</h3>
              {cvs.total > 0 && <span className="text-xs font-bold bg-white text-blue-500 px-3 py-1 rounded-full border border-blue-200 shadow-sm">優先去：{cvs.minLoc}</span>}
            </div>
            <div className="space-y-2">
              {cvs.entries.length > 0 ? cvs.entries.map(([loc, count]) => (
                // 🌟 改成可點擊的按鈕，並加上動態樣式
                <div 
                  key={loc} 
                  onClick={() => handleStoreClick(loc)}
                  className={`flex justify-between p-2.5 rounded-xl text-sm font-bold shadow-sm border transition cursor-pointer hover:scale-[1.02] active:scale-95 ${targetStore === loc ? 'bg-blue-500 text-white border-blue-600' : 'bg-white/60 border-white text-gray-600 hover:bg-blue-100'}`}
                >
                  <span>{loc}</span>
                  <span className={targetStore === loc ? 'text-white' : 'text-blue-600'}>{count} 件</span>
                </div>
              )) : <p className="text-blue-300 text-sm italic">目前沒有超商待取貨</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}