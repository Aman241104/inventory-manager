"use client";

import React, { useState } from "react";
import { Plus, Calendar, Filter, X, UserPlus, Apple, ShoppingCart, TrendingUp, History, Info, CheckCircle2, Edit2, Trash2, GitMerge } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Combobox } from "@/components/ui/Combobox";
import EditableCell from "@/components/ui/EditableCell";
import { addPurchase, addVendorAction, addProductAction, updatePurchase, mergeLotsAction } from "@/app/actions/transaction";
import { deleteLot } from "@/app/actions/report";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export default function BuyList({
  initialPurchases,
  products: initialProducts,
  vendors: initialVendors,
  isInline = false,
  onSuccess
}: {
  initialPurchases: any[],
  products: any[],
  vendors: any[],
  isInline?: boolean,
  onSuccess?: () => void
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [purchases, setPurchases] = useState(initialPurchases);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState(initialVendors);
  const [products, setProducts] = useState(initialProducts);

  // Merge States
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [sourceLot, setSourceLot] = useState<any>(null);
  const [targetLotId, setTargetLotId] = useState("");

  // Edit Lot States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLot, setEditingLot] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    lotName: "",
    quantity: "",
    rate: "",
    date: ""
  });

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
    notes: "",
    targetLotId: ""
  });

  const [newVendor, setNewVendor] = useState({ name: "", contact: "" });
  const [newProduct, setNewProduct] = useState({ name: "", unitType: "Box" });
  const [successMessage, setSuccessMessage] = useState("");

  const fruitSelectRef = React.useRef<HTMLInputElement>(null);
  const vendorSelectRef = React.useRef<HTMLInputElement>(null);
  const qtyInputRef = React.useRef<HTMLInputElement>(null);
  const rateInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setPurchases(initialPurchases);
  }, [initialPurchases]);

  React.useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  React.useEffect(() => {
    if (isModalOpen || isInline) {
      fruitSelectRef.current?.focus();
    }
  }, [isModalOpen, isInline]);

  const handleKeyDown = (e: React.KeyboardEvent, nextRef?: React.RefObject<any>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef) {
        nextRef.current?.focus();
      } else {
        // If no nextRef, it's the last field, so submit
        handleSubmit(null, true);
      }
    }
  };

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

  const handleSubmit = async (e: React.FormEvent | null, addAnother = false) => {
    if (e) e.preventDefault();
    setLoading(true);

    // Optimistic Entry
    const tempId = `temp-${new Date().getTime()}`;
    const optimisticEntry = {
      _id: tempId,
      productId: products.find(p => p._id === formData.productId),
      vendorId: vendors.find(v => v._id === formData.vendorId),
      vendorNames: [vendors.find(v => v._id === formData.vendorId)?.name],
      lotName: "Saving...",
      quantity: Number(formData.quantity),
      rate: Number(formData.rate) || 0,
      date: formData.date,
      isOptimistic: true
    };

    setPurchases(prev => [optimisticEntry, ...prev]);

    const result = await addPurchase({
      ...formData,
      quantity: Number(formData.quantity),
      rate: Number(formData.rate)
    });
    if (result.success) {
      setSuccessMessage("Purchase recorded successfully!");
      if (!addAnother) {
        setIsModalOpen(false);
      }
      setFormData({
        productId: addAnother ? formData.productId : "",
        vendorId: addAnother ? formData.vendorId : "",
        lotName: "Batch 1",
        quantity: "",
        rate: "",
        date: formData.date,
        notes: "",
        targetLotId: ""
      });
      router.refresh();
      if (onSuccess) onSuccess();
    } else {
      setPurchases(initialPurchases); // Rollback
      alert(result.error);
    }
    setLoading(false);
  };

  const handleOpenEdit = (purchase: any) => {
    setEditingLot(purchase);
    setEditFormData({
      lotName: purchase.lotName,
      quantity: purchase.quantity.toString(),
      rate: purchase.rate.toString(),
      date: new Date(purchase.date).toISOString().split('T')[0]
    });
    setIsEditModalOpen(true);
  };

  const handleOpenMerge = (purchase: any) => {
    setSourceLot(purchase);
    setTargetLotId("");
    setIsMergeModalOpen(true);
  };

  const handleMerge = async () => {
    if (!sourceLot || !targetLotId) return;
    setLoading(true);
    const res = await mergeLotsAction(sourceLot._id, targetLotId);
    if (res.success) {
      setIsMergeModalOpen(false);
      if (onSuccess) onSuccess();
      router.refresh();
    } else {
      alert(res.error || "Merge failed");
    }
    setLoading(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await updatePurchase(editingLot._id, {
      lotName: editFormData.lotName,
      quantity: Number(editFormData.quantity),
      rate: Number(editFormData.rate),
      date: editFormData.date
    });
    if (res.success) {
      setIsEditModalOpen(false);
      if (onSuccess) onSuccess();
      router.refresh();
    } else {
      alert("Failed to update");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure? This will delete the ENTIRE batch and all its sales!")) {
      const previousPurchases = [...purchases];
      // Optimistic update
      setPurchases(prev => prev.filter(p => p._id !== id));

      const res = await deleteLot(id);
      if (res.success) {
        if (onSuccess) onSuccess();
        router.refresh();
      } else {
        // Rollback
        setPurchases(previousPurchases);
        alert(res.error || "Failed to delete lot");
      }
    }
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

  const selectedProduct = products.find(p => p._id === formData.productId);
  const selectedVendor = vendors.find(v => v._id === formData.vendorId);

  const isFormValid = formData.productId && 
                     formData.vendorId && 
                     Number(formData.quantity) > 0 && 
                     (formData.targetLotId === "" || (formData.targetLotId !== "" && formData.targetLotId !== "SELECT_PENDING"));

  const handleCancel = (isModal: boolean) => {
    if (isModal) {
      setIsModalOpen(false);
    } else {
      // Clear form
      setFormData({
        productId: "",
        vendorId: "",
        lotName: "Batch 1",
        quantity: "",
        rate: "",
        date: new Date().toISOString().split('T')[0],
        notes: "",
        targetLotId: ""
      });
    }
  };

  const renderForm = (isModal = true) => (
    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
      {successMessage && (
        <div className="p-4 bg-emerald-500 text-white rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 animate-in fade-in zoom-in duration-300 mb-6">
          <CheckCircle2 size={20} className="animate-pulse" />
          <span className="font-black text-sm uppercase tracking-widest">{successMessage}</span>
        </div>
      )}
      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex justify-between">
                Fruit
                <button type="button" onClick={() => setIsProductModalOpen(true)} className="text-emerald-600 hover:text-emerald-800 flex items-center gap-1 font-bold">
                  <Apple size={10} /> Quick Add
                </button>
              </label>
              <Combobox
                ref={fruitSelectRef}
                options={products.filter(p => p.isActive)}
                value={formData.productId}
                onChange={(val) => setFormData({ ...formData, productId: val })}
                onKeyDown={(e) => handleKeyDown(e, vendorSelectRef)}
                placeholder="Select Fruit..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex justify-between">
                Vendor
                <button
                  type="button" onClick={() => setIsVendorModalOpen(true)}
                  className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-bold"
                >
                  <UserPlus size={10} /> Quick Add
                </button>
              </label>
              <Combobox
                ref={vendorSelectRef}
                options={vendors.filter(v => v.isActive)}
                value={formData.vendorId}
                onChange={(val) => setFormData({ ...formData, vendorId: val })}
                onKeyDown={(e) => handleKeyDown(e, qtyInputRef)}
                placeholder="Select Vendor..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Purchase Date</label>
              <input
                type="date" required value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            {formData.productId && (
              <div className="flex flex-col justify-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={!!formData.targetLotId}
                    onChange={(e) => setFormData({ ...formData, targetLotId: e.target.checked ? "SELECT_PENDING" : "" })}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-700 transition-colors">Append to existing batch?</span>
                </label>
              </div>
            )}
          </div>

          {formData.targetLotId !== "" && formData.productId && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Select Target Batch</label>
              <select
                value={formData.targetLotId === "SELECT_PENDING" ? "" : formData.targetLotId}
                required
                onChange={(e) => setFormData({ ...formData, targetLotId: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border-2 border-emerald-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              >
                <option value="">Choose a batch to merge into...</option>
                {purchases
                  .filter(p => p.productId?._id === formData.productId && !p.isOptimistic)
                  .map(p => (
                    <option key={p._id} value={p._id}>
                      {p.lotName} (Stock: {p.remainingQty} | ₹{p.rate})
                    </option>
                  ))
                }
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Quantity</label>
              <input
                ref={qtyInputRef}
                type="number" required min="0.0001" step="any" value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e, rateInputRef)}
                className="w-full px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Purchase Rate</label>
              <input
                ref={rateInputRef}
                type="number" min="0" step="any" value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e)}
                className="w-full px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              rows={2}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Live Receipt Preview</h4>
          {formData.productId && formData.vendorId ? (
            <div className="flex-1 bg-white border-2 border-slate-100 rounded-[2rem] p-8 flex flex-col justify-between animate-in fade-in slide-in-from-right-8 duration-500 shadow-xl shadow-slate-200/50 relative overflow-hidden group/receipt">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/receipt:opacity-10 transition-opacity">
                <ShoppingCart size={120} className="-mr-10 -mt-10 rotate-12" />
              </div>
              
              <div className="space-y-6 relative z-10">
                <div className="pb-4 border-b border-dashed border-slate-200">
                  <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Incoming Inventory</div>
                  <div className="text-3xl font-black text-slate-900 tracking-tight">{selectedProduct?.name}</div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-slate-600">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shadow-sm border border-indigo-100/50">
                      <UserPlus size={18} className="text-indigo-600" />
                    </div>
                    <div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">Supplier</div>
                      <div className="text-sm font-bold text-slate-700">{selectedVendor?.name}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-slate-600">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shadow-sm border border-emerald-100/50">
                      <TrendingUp size={18} className="text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">Batch Details</div>
                      <div className="text-sm font-bold text-slate-700">
                        {formData.quantity || 0} Units 
                        <span className="mx-2 text-slate-300 font-normal">@</span> 
                        ₹{formData.rate || 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t-2 border-slate-50 mt-auto relative z-10">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Valuation</div>
                    <div className="text-2xl font-black text-slate-900 tracking-tighter">
                      ₹{((Number(formData.quantity) || 0) * (Number(formData.rate) || 0)).toLocaleString()}
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full border border-emerald-100 uppercase tracking-tighter">
                    Ready to Save
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 border-2 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center p-12 text-center text-slate-300 group">
              <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <ShoppingCart size={32} className="opacity-20" />
              </div>
              <p className="text-sm font-bold text-slate-400">Complete the form to<br />generate a live preview.</p>
              <p className="text-[10px] text-slate-300 mt-2 font-medium uppercase tracking-widest">Awaiting Input...</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
        <Button type="button" variant="ghost" onClick={() => handleCancel(isModal)}>Cancel</Button>
        <Button 
          type="button" 
          variant="outline" 
          disabled={loading || !isFormValid} 
          onClick={(e) => handleSubmit(e, true)} 
          className="border-emerald-200 text-emerald-600 disabled:opacity-30"
        >
          {loading ? "..." : "Save & Add Another"}
        </Button>
        <Button 
          type="submit" 
          disabled={loading || !isFormValid} 
          className="px-10 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : "Save Purchase"}
        </Button>
      </div>
    </form>
  );

  if (isInline) {
    return (
      <div className="space-y-6">
        <Card className="border-none shadow-xl shadow-emerald-100/50 rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-900 text-white py-6">
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus size={20} className="text-emerald-400" />
              New Purchase Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-8">
            {renderForm(false)}
          </CardContent>
        </Card>

        {/* Quick Add Modals */}
        <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title="Quick Add Product">
          <form onSubmit={handleQuickAddProduct} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
              <input type="text" required value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unit Type</label>
              <select value={newProduct.unitType} onChange={(e) => setNewProduct({ ...newProduct, unitType: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
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

        <Modal isOpen={isVendorModalOpen} onClose={() => setIsVendorModalOpen(false)} title="Quick Add Vendor">
          <form onSubmit={handleQuickAddVendor} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Vendor Name</label>
              <input type="text" required value={newVendor.name} onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contact Info</label>
              <input type="text" required value={newVendor.contact} onChange={(e) => setNewVendor({ ...newVendor, contact: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Buy Section</h1>
          <p className="text-slate-500">Record and manage fruit batches (Lots).</p>
        </div>
        {!isInline && (
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Plus size={18} />
            Record Purchase
          </Button>
        )}
      </div>

      {purchases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Purchases ({purchases.length})</CardTitle>
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
                    <th className="px-4 py-3 text-sm font-semibold text-slate-600 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {purchases.map((p) => (
                    <tr key={p._id} className={cn(
                      "hover:bg-slate-50/50 transition-colors",
                      p.isOptimistic && "opacity-50 grayscale animate-pulse"
                    )}>
                      <td className="px-4 py-4 text-sm text-slate-500">
                        {new Date(p.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-slate-700">
                        <div className="font-bold">{p.productId?.name}</div>
                        <div className="text-[10px] text-indigo-500 uppercase font-black">{p.lotName}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {p.vendorNames?.length > 0 
                          ? p.vendorNames.join(", ") 
                          : (p.vendorIds?.map((v: any) => v.name).join(", ") || "N/A")}
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-indigo-600">
                        <EditableCell 
                          value={p.quantity} 
                          onSave={async (val) => {
                            await updatePurchase(p._id, { quantity: val });
                          }}
                          className="text-indigo-600"
                        />
                      </td>
                      <td className="px-4 py-4 text-sm text-right">
                        <EditableCell 
                          value={p.rate} 
                          prefix="₹"
                          onSave={async (val) => {
                            await updatePurchase(p._id, { rate: val });
                          }}
                        />
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-slate-800 text-right">₹{p.quantity * p.rate}</td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleOpenMerge(p)}
                            disabled={p.isOptimistic}
                            className="p-1 text-slate-400 hover:text-orange-600 transition-colors disabled:opacity-0"
                            title="Merge with another batch"
                          >
                            <GitMerge size={16} />
                          </button>
                          <button onClick={() => handleOpenEdit(p)} disabled={p.isOptimistic} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors disabled:opacity-0">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(p._id)} disabled={p.isOptimistic} className="p-1 text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-0 relative z-10">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
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
        {renderForm(true)}
      </Modal>

      {/* Edit Purchase Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Purchase Batch">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lot Name</label>
              <input type="text" required value={editFormData.lotName} onChange={(e) => setEditFormData({ ...editFormData, lotName: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantity</label>
              <input type="number" required min="0.0001" step="any" value={editFormData.quantity} onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rate</label>
              <input type="number" required min="0" step="any" value={editFormData.rate} onChange={(e) => setEditFormData({ ...editFormData, rate: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
              <input type="date" required value={editFormData.date} onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Update Batch"}</Button>
          </div>
        </form>
      </Modal>

      {/* Quick Add Modals for Modal Mode */}
      <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title="Quick Add Product">
        <form onSubmit={handleQuickAddProduct} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
            <input type="text" required value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Unit Type</label>
            <select value={newProduct.unitType} onChange={(e) => setNewProduct({ ...newProduct, unitType: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
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

      <Modal isOpen={isVendorModalOpen} onClose={() => setIsVendorModalOpen(false)} title="Quick Add Vendor">
        <form onSubmit={handleQuickAddVendor} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Vendor Name</label>
            <input type="text" required value={newVendor.name} onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Info</label>
            <input type="text" required value={newVendor.contact} onChange={(e) => setNewVendor({ ...newVendor, contact: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsVendorModalOpen(false)}>Back</Button>
            <Button type="submit" disabled={loading}>{loading ? "Adding..." : "Add Vendor"}</Button>
          </div>
        </form>
      </Modal>

      {/* Merge Modal */}
      <Modal
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        title="Merge Batches"
      >
        <div className="space-y-6">
          {sourceLot && (
            <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl space-y-2">
              <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Source Batch (To be merged and removed)</p>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-800">{sourceLot.productId?.name}</div>
                  <div className="text-xs text-slate-500">{sourceLot.lotName} • {sourceLot.quantity} units @ ₹{sourceLot.rate}</div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Target Batch (To merge into)</label>
            <select
              value={targetLotId}
              onChange={(e) => setTargetLotId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              <option value="">Choose a target batch...</option>
              {purchases
                .filter(p => p._id !== sourceLot?._id && p.productId?._id === sourceLot?.productId?._id && !p.isOptimistic)
                .map(p => (
                  <option key={p._id} value={p._id}>
                    {p.lotName} ({p.quantity} units @ ₹{p.rate})
                  </option>
                ))
              }
            </select>
          </div>

          {sourceLot && targetLotId && (
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-3">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Merged Preview</p>
              {(() => {
                const target = purchases.find(p => p._id === targetLotId);
                if (!target) return null;
                const totalQty = sourceLot.quantity + target.quantity;
                const weightedRate = ((sourceLot.quantity * sourceLot.rate) + (target.quantity * target.rate)) / totalQty;
                return (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">New Total Quantity:</span>
                      <span className="font-bold text-slate-800">{totalQty} units</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">New Average Rate:</span>
                      <span className="font-bold text-indigo-600">₹{weightedRate.toFixed(2)}</span>
                    </div>
                    <p className="text-[10px] text-indigo-400 italic pt-2">* All sales from {sourceLot.lotName} will be moved to {target.lotName}.</p>
                  </div>
                );
              })()}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsMergeModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleMerge} 
              disabled={loading || !targetLotId}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {loading ? "Merging..." : "Confirm & Merge"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
