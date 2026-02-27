"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { bulkAddTransactions, getLotsForProduct } from "@/app/actions/transaction";

export default function BulkEntry({
  products,
  vendors,
  customers,
  onSuccess
}: {
  products: any[],
  vendors: any[],
  customers: any[],
  onSuccess?: () => void
}) {
  const [rows, setRows] = useState<any[]>([
    { id: 1, type: "sell", productId: "", vendorId: "", customerId: "", purchaseId: "", quantity: "", rate: "", date: new Date().toISOString().split('T')[0], lots: [] }
  ]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const addRow = () => {
    setRows([...rows, { 
      id: Date.now(), 
      type: rows[rows.length - 1]?.type || "sell",
      productId: rows[rows.length - 1]?.productId || "", 
      vendorId: "",
      customerId: "", 
      purchaseId: rows[rows.length - 1]?.purchaseId || "", 
      quantity: "", 
      rate: rows[rows.length - 1]?.rate || "", 
      date: rows[rows.length - 1]?.date || new Date().toISOString().split('T')[0],
      lots: rows[rows.length - 1]?.lots || []
    }]);
  };

  const removeRow = (id: number) => {
    if (rows.length === 1) return;
    setRows(rows.filter(r => r.id !== id));
  };

  const updateRow = async (id: number, field: string, value: any) => {
    const newRows = [...rows];
    const index = newRows.findIndex(r => r.id === id);
    newRows[index][field] = value;

    if (field === "type") {
      newRows[index].purchaseId = "";
      newRows[index].customerId = "";
      newRows[index].vendorId = "";
    }

    if (field === "productId" && value && newRows[index].type === "sell") {
      const res = await getLotsForProduct(value);
      if (res.success) {
        newRows[index].lots = res.data;
        if (res.data.length > 0 && !newRows[index].purchaseId) {
          newRows[index].purchaseId = res.data[0]._id;
        }
      }
    }
    setRows(newRows);
  };

  const handleSaveAll = async () => {
    const validRows = rows.filter(r => {
      const basic = r.productId && r.quantity && r.rate;
      if (r.type === "sell") return basic && r.customerId && r.purchaseId;
      return basic && r.vendorId;
    });

    if (validRows.length === 0) {
      alert("Please fill at least one complete row");
      return;
    }

    setLoading(true);
    const res = await bulkAddTransactions(validRows);
    if (res.success) {
      setMessage({ type: 'success', text: `Successfully saved ${res.count} transactions!` });
      setTimeout(() => {
        setRows([{ id: Date.now(), type: "sell", productId: "", vendorId: "", customerId: "", purchaseId: "", quantity: "", rate: "", date: new Date().toISOString().split('T')[0], lots: [] }]);
        if (onSuccess) onSuccess();
      }, 2000);
    } else {
      setMessage({ type: 'error', text: res.error || "Failed to save bulk entries" });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-2 animate-in fade-in zoom-in ${
          message.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span className="font-bold text-sm">{message.text}</span>
        </div>
      )}

      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
        <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
          <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <Save size={16} className="text-indigo-400" />
            Bulk Transaction Spreadsheet
          </h3>
          <div className="flex gap-2">
            <Button onClick={addRow} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 py-1 h-8 text-xs">
              + Add Row
            </Button>
            <Button onClick={handleSaveAll} disabled={loading} className="bg-indigo-500 hover:bg-indigo-600 py-1 h-8 text-xs">
              {loading ? "Saving..." : "Commit All Rows"}
            </Button>
          </div>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 w-24">Type</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400">Fruit</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400">Entity (C/V)</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400">Batch</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 w-24">Qty</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 w-24">Rate</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 w-32">Date</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="p-2">
                      <select 
                        value={row.type} 
                        onChange={(e) => updateRow(row.id, "type", e.target.value)}
                        className={`w-full border rounded-lg p-1.5 text-xs font-black outline-none focus:ring-2 ${
                          row.type === 'buy' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        }`}
                      >
                        <option value="buy">BUY</option>
                        <option value="sell">SELL</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <select 
                        value={row.productId} 
                        onChange={(e) => updateRow(row.id, "productId", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Fruit...</option>
                        {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                      </select>
                    </td>
                    <td className="p-2">
                      {row.type === 'buy' ? (
                        <select 
                          value={row.vendorId} 
                          onChange={(e) => updateRow(row.id, "vendorId", e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Vendor...</option>
                          {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                        </select>
                      ) : (
                        <select 
                          value={row.customerId} 
                          onChange={(e) => updateRow(row.id, "customerId", e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Customer...</option>
                          {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="p-2">
                      {row.type === 'sell' ? (
                        <select 
                          value={row.purchaseId} 
                          onChange={(e) => updateRow(row.id, "purchaseId", e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                          disabled={!row.productId}
                        >
                          <option value="">Lot...</option>
                          {row.lots?.map((l: any) => <option key={l._id} value={l._id}>{l.lotName} ({l.availableQty})</option>)}
                        </select>
                      ) : (
                        <div className="text-[10px] text-slate-400 italic text-center">Auto-Gen</div>
                      )}
                    </td>
                    <td className="p-2">
                      <input 
                        type="number" 
                        value={row.quantity} 
                        placeholder="0"
                        onChange={(e) => updateRow(row.id, "quantity", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="p-2">
                      <input 
                        type="number" 
                        value={row.rate} 
                        placeholder="0"
                        onChange={(e) => updateRow(row.id, "rate", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="p-2">
                      <input 
                        type="date" 
                        value={row.date} 
                        onChange={(e) => updateRow(row.id, "date", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button onClick={() => removeRow(row.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button 
            onClick={addRow}
            className="w-full py-3 border-t border-dashed border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-colors"
          >
            + Click to add another row (or press Tab)
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
