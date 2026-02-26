"use client";

import React, { useState } from "react";
import { Plus, Calendar, Filter, X, UserPlus, Apple, ShoppingCart, TrendingUp, History, Info, CheckCircle2, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { addPurchase, addVendorAction, addProductAction, updatePurchase } from "@/app/actions/transaction";
import { deleteLot } from "@/app/actions/report";
import { useRouter, useSearchParams } from "next/navigation";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState(initialVendors);
  const [products, setProducts] = useState(initialProducts);

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
    notes: ""
  });

  const [newVendor, setNewVendor] = useState({ name: "", contact: "" });
  const [newProduct, setNewProduct] = useState({ name: "", unitType: "Box" });
  const [successMessage, setSuccessMessage] = useState("");

  const fruitSelectRef = React.useRef<HTMLSelectElement>(null);

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
        date: new Date().toISOString().split('T')[0],
        notes: ""
      });
      router.refresh();
      if (onSuccess) onSuccess();
      if (!addAnother) {
        if (!isInline) setTimeout(() => window.location.reload(), 500);
        else router.refresh();
      }
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
      const res = await deleteLot(id);
      if (res.success) {
        if (onSuccess) onSuccess();
        router.refresh();
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
              <select
                ref={fruitSelectRef}
                required value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                className="w-full px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              >
                <option value="">Select Fruit</option>
                {products.filter(p => p.isActive).map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
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
              <select
                required value={formData.vendorId}
                onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                className="w-full px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              >
                <option value="">Select Vendor</option>
                {vendors.filter(v => v.isActive).map(v => (
                  <option key={v._id} value={v._id}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lot Name / Batch</label>
              <input
                type="text" required placeholder="e.g. Batch 1" value={formData.lotName}
                onChange={(e) => setFormData({ ...formData, lotName: e.target.value })}
                className="w-full px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Purchase Date</label>
              <input
                type="date" required value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Quantity</label>
              <input
                type="number" required min="0.0001" step="any" value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Purchase Rate</label>
              <input
                type="number" required min="0.0001" step="any" value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
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
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Preview</h4>
          {formData.productId && formData.vendorId ? (
            <div className="flex-1 bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 flex flex-col justify-between animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-2xl font-black text-emerald-900">{selectedProduct?.name}</div>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">{formData.lotName}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <UserPlus size={16} className="text-indigo-500" />
                    </div>
                    <div>
                      <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Supplier</div>
                      <div className="text-sm font-bold">{selectedVendor?.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <TrendingUp size={16} className="text-emerald-500" />
                    </div>
                    <div>
                      <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Incoming Stock</div>
                      <div className="text-sm font-bold">{formData.quantity || 0} units @ ₹{formData.rate || 0}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-emerald-100/50 mt-auto">
                <div className="flex flex-col items-end text-emerald-900">
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Entry Summary</div>
                  <div className="text-sm font-bold">
                    <span className="text-emerald-600 font-black">{formData.quantity || 0}</span> Units
                    <span className="mx-2 opacity-20">|</span>
                    <span className="opacity-60 font-medium italic">₹{((Number(formData.quantity) || 0) * (Number(formData.rate) || 0)).toLocaleString()} Total</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-slate-300">
              <ShoppingCart size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-medium">Complete the form to see<br />a live entry preview.</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
        <Button type="button" variant="ghost" onClick={() => isModal ? setIsModalOpen(false) : router.push('/transactions')}>Cancel</Button>
        <Button type="button" variant="outline" disabled={loading} onClick={(e) => handleSubmit(e, true)} className="border-emerald-200 text-emerald-600">
          {loading ? "..." : "Save & Add Another"}
        </Button>
        <Button type="submit" disabled={loading} className="px-10 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100">
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
                    <th className="px-4 py-3 text-sm font-semibold text-slate-600 text-center">Action</th>
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
                      <td className="px-4 py-4 text-sm font-semibold text-indigo-600">{p.quantity}</td>
                      <td className="px-4 py-4 text-sm text-right">₹{p.rate}</td>
                      <td className="px-4 py-4 text-sm font-bold text-slate-800 text-right">₹{p.quantity * p.rate}</td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleOpenEdit(p)} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(p._id)} className="p-1 text-slate-400 hover:text-rose-600 transition-colors">
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
              <input type="number" required value={editFormData.quantity} onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rate</label>
              <input type="number" required value={editFormData.rate} onChange={(e) => setEditFormData({ ...editFormData, rate: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
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
    </div>
  );
}
