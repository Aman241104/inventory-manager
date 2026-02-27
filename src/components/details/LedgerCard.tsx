import React from 'react';

export default function LedgerCard({ data }: { data: any }) {
  const {
    productName,
    unitType,
    lotName,
    vendorName,
    vendorNames,
    purchasedQty,
    purchasedRate,
    date,
    sales,
    totalSoldQty,
    remainingQty
  } = data;

  return (
    <div className="bg-white mb-12 print-break-inside-avoid font-sans border-t-2 border-slate-100 pt-8">
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b-2 border-slate-900 ledger-border-b font-bold print-text-black">
        <div className="uppercase text-xl tracking-tighter">
          {productName} 
        </div>
        <div className="flex gap-6">
          <span className="uppercase text-sm bg-slate-100 px-2 py-1 rounded">{lotName}</span>
        </div>
      </div>

      {/* T-Ledger Body */}
      <div className="flex min-h-[250px]">
        
        {/* Left Side: Purchase */}
        <div className="w-1/4 p-4 border-r-2 border-slate-900 ledger-border-r flex flex-col print-text-black">
          <div className="text-[10px] font-black uppercase underline mb-4 text-slate-400 print-text-black">Purchase Details</div>
          
          <div className="flex-1 space-y-4">
            <div>
              <div className="text-2xl font-black">{purchasedQty} <span className="text-xs text-slate-400">QTY</span></div>
            </div>
            
            <div className="font-bold uppercase text-xs text-slate-600 leading-tight">
              {vendorNames?.join(", ") || vendorName}
            </div>
            
            <div className="font-bold text-sm">
              {purchasedQty} @ {purchasedRate} RS
            </div>
            
            <div className="mt-8 pt-4 border-t border-dashed border-slate-200">
              <div className="text-[10px] text-slate-300 mb-2 uppercase font-bold tracking-widest">Remarks:</div>
              <div className="h-4 border-b border-slate-200 w-3/4"></div>
            </div>
          </div>
        </div>

        {/* Right Side: Sales */}
        <div className="w-3/4 p-4 flex flex-col print-text-black">
          <div className="text-xs font-bold uppercase underline mb-4 text-slate-500 print-text-black">Sales</div>
          
          <div className="flex-1">
            <table className="w-full text-sm">
              <tbody>
                {sales.length > 0 ? (
                  sales.map((sale: any) => (
                    <tr key={sale.saleId} className="border-b border-slate-100 last:border-0">
                      <td className="py-1 uppercase text-slate-600 truncate max-w-[250px] print-text-black">
                        {sale.customerName}
                      </td>
                      <td className="py-1 text-right font-bold print-text-black">{sale.quantity}</td>
                      <td className="py-1 text-right text-xs print-text-black">@ {sale.rate} RS</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-4 text-slate-400 italic print-text-black">No sales recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>

      {/* Footer */}
      <div className="flex border-t-2 border-slate-900 ledger-border-t font-bold text-lg print-text-black bg-slate-50 print:bg-white">
        <div className="w-1/4 p-3 border-r-2 border-slate-900 ledger-border-r uppercase">
          {remainingQty} Balance
        </div>
        <div className="w-3/4 p-3 uppercase text-right">
          (Total Out {totalSoldQty})
        </div>
      </div>
    </div>
  );
}
