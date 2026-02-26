import React from 'react';

export default function LedgerCard({ data }: { data: any }) {
  const {
    productName,
    unitType,
    lotName,
    vendorName,
    purchasedQty,
    purchasedRate,
    date,
    sales,
    totalSoldQty,
    remainingQty
  } = data;

  return (
    <div className="bg-white border-2 border-slate-900 mb-8 print-break-inside-avoid ledger-border font-sans">
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b-2 border-slate-900 ledger-border-b font-bold print-text-black">
        <div className="uppercase">
          {productName} 
        </div>
        <div className="flex gap-4">
          <span className="uppercase text-sm">{lotName}</span>
          <span className="uppercase text-sm">{date}</span>
        </div>
      </div>

      {/* T-Ledger Body */}
      <div className="flex min-h-[300px]">
        
        {/* Left Side: Purchase */}
        <div className="w-1/4 p-4 border-r-2 border-slate-900 ledger-border-r flex flex-col print-text-black">
          <div className="text-xs font-bold uppercase underline mb-4 text-slate-500 print-text-black">Purchase Details</div>
          
          <div className="flex-1 space-y-4">
            <div>
              <div className="text-xl font-black">{purchasedQty} <span className="text-sm">QTY</span></div>
            </div>
            
            <div className="font-bold uppercase">
              {vendorName}
            </div>
            
            <div className="font-bold">
              {purchasedQty} @ {purchasedRate} RS
            </div>
            
            <div className="mt-8 pt-4 border-t border-dashed border-slate-300">
              <div className="text-xs text-slate-400 mb-2">Remarks:</div>
              <div className="h-4 border-b border-slate-300 w-3/4"></div>
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
