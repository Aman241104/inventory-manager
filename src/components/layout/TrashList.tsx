"use client";

import React, { useState, useEffect } from "react";
import { Trash2, RotateCcw, AlertCircle, ShoppingCart, BadgeDollarSign, Apple, Users, UserSquare2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getDeletedItems, restoreItem } from "@/app/actions/trash";

export default function TrashList() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeleted = async () => {
    setLoading(true);
    const res = await getDeletedItems();
    if (res.success) {
      setData(res.data);
    } else {
      setError(res.error || "Failed to load");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDeleted();
  }, []);

  const handleRestore = async (type: any, id: string) => {
    const res = await restoreItem(type, id);
    if (res.success) {
      fetchDeleted();
    } else {
      alert(res.error);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Loading Trash...</div>;
  if (error) return <div className="p-8 text-center text-rose-500">{error}</div>;

  const isEmpty = !data || (
    data.lots.length === 0 && 
    data.sales.length === 0 && 
    data.products.length === 0 && 
    data.vendors.length === 0 && 
    data.customers.length === 0
  );

  if (isEmpty) {
    return (
      <Card className="border-dashed border-2 border-slate-200">
        <CardContent className="py-20 text-center space-y-4">
          <Trash2 size={48} className="mx-auto text-slate-200" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-400">Your trash bin is empty</h3>
            <p className="text-sm text-slate-300 font-medium">Deleted items will appear here for recovery.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-12">
      {/* 1. Lots (Purchases) */}
      {data.lots.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <ShoppingCart size={14} /> Deleted Purchase Lots
          </h3>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-left border-collapse">
                <tbody className="divide-y divide-slate-100">
                  {data.lots.map((lot: any) => (
                    <tr key={lot._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-700">{lot.productName || lot.productId?.name}</div>
                        <div className="text-[10px] text-indigo-500 font-black uppercase">{lot.lotName}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{new Date(lot.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="outline" size="sm" onClick={() => handleRestore('lot', lot._id)} className="gap-2">
                          <RotateCcw size={14} /> Restore
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>
      )}

      {/* 2. Sales */}
      {data.sales.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <BadgeDollarSign size={14} /> Deleted Sales
          </h3>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-left border-collapse">
                <tbody className="divide-y divide-slate-100">
                  {data.sales.map((sale: any) => (
                    <tr key={sale._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-700">{sale.productName || sale.productId?.name}</div>
                        <div className="text-[10px] text-emerald-600 font-black uppercase">To: {sale.customerName || sale.customerId?.name}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{sale.quantity} units</td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="outline" size="sm" onClick={() => handleRestore('sale', sale._id)} className="gap-2">
                          <RotateCcw size={14} /> Restore
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>
      )}

      {/* 3. Products */}
      {data.products.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Apple size={14} /> Deleted Products
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.products.map((p: any) => (
              <Card key={p._id}>
                <CardContent className="p-4 flex justify-between items-center">
                  <span className="font-bold">{p.name}</span>
                  <Button variant="outline" size="sm" onClick={() => handleRestore('product', p._id)}>
                    Restore
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* 4. Vendors/Customers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {data.vendors.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Users size={14} /> Deleted Vendors
            </h3>
            <Card>
              <CardContent className="p-4 space-y-4">
                {data.vendors.map((v: any) => (
                  <div key={v._id} className="flex justify-between items-center">
                    <span className="font-bold">{v.name}</span>
                    <Button variant="ghost" size="sm" onClick={() => handleRestore('vendor', v._id)} className="text-indigo-600">Restore</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        )}
        {data.customers.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <UserSquare2 size={14} /> Deleted Customers
            </h3>
            <Card>
              <CardContent className="p-4 space-y-4">
                {data.customers.map((c: any) => (
                  <div key={c._id} className="flex justify-between items-center">
                    <span className="font-bold">{c.name}</span>
                    <Button variant="ghost" size="sm" onClick={() => handleRestore('customer', c._id)} className="text-indigo-600">Restore</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}
