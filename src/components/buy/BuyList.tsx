"use client";

import React, { useState } from "react";
import { Plus, Search, Calendar, Tag, User, Filter, X, UserPlus, Apple } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { addPurchase, addVendorAction, addProductAction } from "@/app/actions/transaction";
import { useRouter, useSearchParams } from "next/navigation";

export default function BuyList({ 
  initialPurchases, 
  products: initialProducts, 
  vendors: initialVendors 
}: { 
  initialPurchases: any[], 
  products: any[], 
  vendors: any[] 
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState(initialVendors);
  const [products, setProducts] = useState(initialProducts);
  
  // Filter states
  const [fromDate, setFromDate] = useState(searchParams.get("fromDate") || "");
  const [toDate, setToDate] = useState(searchParams.get("toDate") || "");

  const [formData, setFormData] = useState({
    productId: "",
    vendorId: "",
    lotName: "Batch 1",
    quantity: "",
    rate: "",
    date: new Date().toISOString().split('T')[0],
    notes: ""
  });

  const [newVendor, setNewVendor] = useState({ name: "", contact: "" });
  const [newProduct, setNewProduct] = useState({ name: "", unitType: "Box" });

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (fromDate) params.set("fromDate", fromDate);
    else params.delete("fromDate");
    if (toDate) params.set("toDate", toDate);
    else params.delete("toDate");
    router.push(`/buy?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setFromDate("");
    setToDate("");
    router.push("/buy");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await addPurchase({
      ...formData,
      quantity: Number(formData.quantity),
      rate: Number(formData.rate)
    });
    if (result.success) {
      setIsModalOpen(false);
      setFormData({
        productId: "",
        vendorId: "",
        lotName: "Batch 1",
        quantity: "",
        rate: "",
        date: new Date().toISOString().split('T')[0],
        notes: ""
      });
      router.refresh();
      // Forcing a small delay to ensure DB catchup if needed, though refresh() usually works
      setTimeout(() => window.location.reload(), 500);
    }
    setLoading(false);
  };

  const handleQuickAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await addVendorAction(newVendor.name, newVendor.contact);
    if (result.success && result.data) {
      setVendors([result.data, ...vendors]);
      setFormData({ ...formData, vendorId: result.data._id });
      setIsVendorModalOpen(false);
      setNewVendor({ name: "", contact: "" });
    }
    setLoading(false);
  };

  const handleQuickAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await addProductAction(newProduct.name, newProduct.unitType);
    if (result.success && result.data) {
      setProducts([result.data, ...products]);
      setFormData({ ...formData, productId: result.data._id });
      setIsProductModalOpen(false);
      setNewProduct({ name: "", unitType: "Box" });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Buy Section</h1>
          <p className="text-slate-500">Record and manage fruit batches (Lots).</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus size={18} />
          Record Purchase
        </Button>
      </div>

      {/* Filter Section - only if history exists */}
      {initialPurchases.length > 0 && (
        <Card className="bg-slate-50/50 border-dashed no-print">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-end gap-4">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">From Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="date" 
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">To Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="date" 
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleApplyFilters} className="flex items-center gap-2">
                  <Filter size={16} />
                  Apply
                </Button>
                {(fromDate || toDate) && (
                  <Button variant="ghost" onClick={handleClearFilters} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50">
                    <X size={16} />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {initialPurchases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Purchases ({initialPurchases.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-4 py-3 text-sm font-semibold text-slate-600">Date</th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-600">Product / Lot</th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-600">Vendor</th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-600">Quantity</th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-600 text-right">Rate</th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-600 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {initialPurchases.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4 text-sm text-slate-500">
                        {new Date(p.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-slate-700">
                        <div className="font-bold">{p.productId?.name}</div>
                        <div className="text-[10px] text-indigo-500 uppercase font-black">{p.lotName}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">{p.vendorId?.name}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-indigo-600">{p.quantity} <span className="text-[10px] text-slate-400 font-bold">{p.productId?.unitType}</span></td>
                      <td className="px-4 py-4 text-sm text-right">₹{p.rate}</td>
                      <td className="px-4 py-4 text-sm font-bold text-slate-800 text-right">₹{p.quantity * p.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Record Purchase Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record New Purchase">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex justify-between">
                Product
                <button 
                  type="button" onClick={() => setIsProductModalOpen(true)}
                  className="text-emerald-600 hover:text-emerald-800 flex items-center gap-1 text-[10px] font-bold uppercase"
                >
                  <Apple size={12} /> Quick Add
                </button>
              </label>
              <select 
                required value={formData.productId}
                onChange={(e) => setFormData({...formData, productId: e.target.value})}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Product</option>
                {products.filter(p => p.isActive).map(p => (
                  <option key={p._id} value={p._id}>{p.name} ({p.unitType})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex justify-between">
                Vendor
                <button 
                  type="button" onClick={() => setIsVendorModalOpen(true)}
                  className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-[10px] font-bold uppercase"
                >
                  <UserPlus size={12} /> Quick Add
                </button>
              </label>
              <select 
                required value={formData.vendorId}
                onChange={(e) => setFormData({...formData, vendorId: e.target.value})}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Vendor</option>
                {vendors.filter(v => v.isActive).map(v => (
                  <option key={v._id} value={v._id}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Rest of the form stays same */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lot Name / Batch</label>
              <input 
                type="text" required placeholder="e.g. Batch 1" value={formData.lotName}
                onChange={(e) => setFormData({...formData, lotName: e.target.value})}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input 
                type="date" required value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
              <input 
                type="number" required min="0.0001" step="any" value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Rate</label>
              <input 
                type="number" required min="0.0001" step="any" value={formData.rate}
                onChange={(e) => setFormData({...formData, rate: e.target.value})}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea 
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Purchase"}</Button>
          </div>
        </form>
      </Modal>

      {/* Quick Add Product Modal */}
      <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title="Quick Add Product">
        <form onSubmit={handleQuickAddProduct} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
            <input 
              type="text" required value={newProduct.name}
              onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Unit Type</label>
            <select 
              value={newProduct.unitType}
              onChange={(e) => setNewProduct({...newProduct, unitType: e.target.value})}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Box">Box</option>
              <option value="Kg">Kg</option>
              <option value="Lot">Lot</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsProductModalOpen(false)}>Back</Button>
            <Button type="submit" disabled={loading}>{loading ? "Adding..." : "Add Product"}</Button>
          </div>
        </form>
      </Modal>

      {/* Quick Add Vendor Modal */}
      <Modal isOpen={isVendorModalOpen} onClose={() => setIsVendorModalOpen(false)} title="Quick Add Vendor">
        <form onSubmit={handleQuickAddVendor} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Vendor Name</label>
            <input 
              type="text" required value={newVendor.name}
              onChange={(e) => setNewVendor({...newVendor, name: e.target.value})}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Info</label>
            <input 
              type="text" required value={newVendor.contact}
              onChange={(e) => setNewVendor({...newVendor, contact: e.target.value})}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsVendorModalOpen(false)}>Back</Button>
            <Button type="submit" disabled={loading}>{loading ? "Adding..." : "Add Vendor"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

