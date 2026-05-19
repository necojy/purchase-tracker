"use client";

import RecordCard from "../RecordCard";

type Item = { id: number; name: string; sellPrice: number; originalPrice: number; maxQuantity: number; };
type PurchaseItem = { id: number; quantity: number; costPrice: string | number; item: Item; itemId: number; };
type RecordType = { id: number; location: string; buyer: string; paymentMethod: string; purchaseDate: string; items: PurchaseItem[]; pickupLocation: string; isReconciled: boolean; isRefunded: boolean; };

type Props = {
  records: RecordType[];
  items: Item[];
  refreshData: () => void;
};

export default function RecordGroupList({ records, items, refreshData }: Props) {
  // 將紀錄依照日期分群
  const groupRecordsByDate = (recordsToGroup: RecordType[]) => {
    const grouped: { [key: string]: RecordType[] } = {};
    
    recordsToGroup.forEach(record => {
      const dateObj = new Date(record.purchaseDate);
      const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
      
      if (!grouped[dateStr]) grouped[dateStr] = [];
      grouped[dateStr].push(record);
    });
    
    return grouped;
  };

  const grouped = groupRecordsByDate(records);
  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <>
      {sortedDates.map(dateStr => (
        <div key={dateStr} className="mb-8">
          <div className="flex items-center gap-4 mb-4 pl-2">
            <h3 className="font-black text-gray-500 tracking-wider bg-gray-100 px-3 py-1 rounded-lg text-sm">
              📅 {dateStr}
            </h3>
            <div className="flex-1 h-[2px] bg-gray-100 rounded-full"></div>
          </div>
          
          <div className="space-y-4">
            {grouped[dateStr].map(record => (
              <RecordCard 
                key={record.id} 
                record={record} 
                items={items} 
                refreshData={refreshData} 
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}