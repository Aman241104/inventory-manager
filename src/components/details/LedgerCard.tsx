import React from 'react';

export default function LedgerCard({ data }: { data: any }) {
  const {
    productName,
    lotName,
    vendorNames,
    vendorName,
    purchasedQty,
    purchasedRate,
    appendHistory,
    sales,
    totalSoldQty,
    remainingQty,
    notes
  } = data;

  return (
    <div className="bg-white mb-4 print:mb-1 print-break-inside-avoid font-sans border-2 border-slate-900 ledger-border">
      {/* High-Density Header: Product | Lot | Stats */}
      <div className="flex justify-between items-center bg-slate-900 text-white print:bg-white print:text-black p-2 print:p-1 border-b-2 border-slate-900 ledger-border-b font-black uppercase tracking-tighter">
        <div className="flex items-baseline gap-2">
          <span className="text-base print:text-sm">{productName}</span>
          <span className="text-[10px] print:text-[8px] bg-white/20 print:bg-slate-100 px-1 rounded">{lotName}</span>
        </div>
        <div className="flex gap-4 print:gap-2 text-xs print:text-[10px]">
          <span className="opacity-70">IN: {purchasedQty}</span>
          <span className="opacity-70">OUT: {totalSoldQty}</span>
          <span className="bg-white text-slate-900 print:bg-black print:text-white px-2 rounded ml-2 font-black">BAL: {remainingQty}</span>
        </div>
      </div>

      {/* T-Ledger Body */}
      <div className="flex min-h-0">
        
        {/* Left Side: Purchase (Narrower & Compact) */}
        <div className="w-[35%] p-2 print:p-1 border-r-2 border-slate-900 ledger-border-r flex flex-col print-text-black bg-slate-50/30">
          <div className="text-[8px] font-black uppercase text-slate-400 mb-1 border-b border-slate-200">Purchase / Incoming History</div>
          <div className="space-y-1.5">
            {appendHistory && appendHistory.length > 0 ? (
              <div className="space-y-1">
                {appendHistory.map((h: any, i: number) => (
                  <div key={i} className="text-[9px] print:text-[8px] border-b border-slate-100 pb-0.5 last:border-0">
                    <div className="flex justify-between font-bold">
                      <span>{h.date}</span>
                      <span className="text-indigo-600">{h.quantity} units</span>
                    </div>
                    <div className="flex justify-between italic text-slate-500">
                      <span className="truncate max-w-[100px]">{h.vendorNames?.join(", ")}</span>
                      <span>@ ₹{h.rate}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-0.5">
                <div className="font-bold text-xs print:text-[10px] leading-tight truncate">
                  {vendorNames?.join(", ") || vendorName}
                </div>
                <div className="text-[10px] print:text-[9px] font-medium italic">
                  {purchasedRate > 0 ? `@ ₹${purchasedRate}` : 'Rate: N/A'}
                </div>
              </div>
            )}
            
            {notes && (
              <div className="mt-1 pt-1 border-t border-dotted border-slate-300 text-[8px] text-slate-500 italic leading-tight">
                {notes}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Sales (Dual-Column Layout for density) */}
        <div className="flex-1 p-2 print:p-1 flex flex-col print-text-black">
          <div className="text-[8px] font-black uppercase text-slate-400 mb-1 border-b border-slate-200">Sales History</div>
          
          <div className="flex-1">
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              {sales.length > 0 ? (
                sales.map((sale: any) => (
                  <div key={sale.saleId} className="flex justify-between items-center text-[10px] print:text-[9px] border-b border-slate-50">
                    <span className="uppercase truncate max-w-[100px] font-medium">{sale.customerName}</span>
                    <div className="flex items-center gap-1">
                      <span className="font-bold">{sale.quantity}</span>
                      <span className="text-[7px] opacity-40">(@{sale.rate})</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-[10px] text-slate-300 italic py-1 text-center">No sales recorded.</div>
              )}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
