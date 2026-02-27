"use client";

import React, { useState } from "react";
import { Plus, Search, Edit2, Power, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { addProduct, updateProduct, toggleProductStatus, deleteProduct } from "@/app/actions/product";

interface ProductListProps {
  initialProducts: any[];
}

export default function ProductList({ initialProducts }: ProductListProps) {
  const [products, setProducts] = useState(initialProducts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Keep local state in sync with props
  React.useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const [formData, setFormData] = useState<{
    name: string;
    unitType: "Box" | "Kg" | "Lot";
  }>({
    name: "",
    unitType: "Box",
  });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({ name: "", unitType: "Box" });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: any) => {
    setEditingProduct(product);
    setFormData({ name: product.name, unitType: product.unitType });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    let result;
    if (editingProduct) {
      result = await updateProduct(editingProduct._id, formData);
    } else {
      result = await addProduct(formData);
    }

    if (result.success) {
      setIsModalOpen(false);
      // Let Next.js revalidate, but we can also reload or wait for refresh
      window.location.reload();
    }
    setLoading(false);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const previousProducts = [...products];
    // Optimistic update
    setProducts(prev => prev.map(p => p._id === id ? { ...p, isActive: !currentStatus } : p));
    
    const result = await toggleProductStatus(id, !currentStatus);
    if (!result.success) {
      // Rollback
      setProducts(previousProducts);
      alert("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    console.log("handleDelete called for ID:", id);
    if (window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      const previousProducts = [...products];
      // Optimistic delete
      setProducts(prev => prev.filter(p => p._id !== id));

      try {
        const result = await deleteProduct(id);
        console.log("deleteProduct result:", result);
        if (!result.success) {
          // Rollback
          setProducts(previousProducts);
          alert(result.error || "Failed to delete product.");
        }
      } catch (err) {
        console.error("Error deleting product:", err);
        setProducts(previousProducts);
        alert("An error occurred while deleting the product.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Products</h1>
          <p className="text-slate-500">Manage your fruit catalog and unit types.</p>
        </div>
        <Button onClick={handleOpenAddModal} className="flex items-center gap-2">
          <Plus size={18} />
          Add Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>Product List ({filteredProducts.length})</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search products..." 
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">Product Name</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">Unit Type</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">Batches</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">Last Trade</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400 italic">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4 text-sm font-medium text-slate-700">{product.name}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">{product.unitType}</td>
                      <td className="px-4 py-4 text-sm">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.isActive 
                            ? "bg-emerald-100 text-emerald-700" 
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${product.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                          {product.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600 font-bold">
                        {product.totalBatches || 0}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-500">
                        {product.lastTransaction ? new Date(product.lastTransaction).toLocaleDateString() : "Never"}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleToggleStatus(product._id, product.isActive)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                            title={product.isActive ? "Deactivate" : "Activate"}
                          >
                            <Power size={16} />
                          </button>
                          <button 
                            onClick={() => handleOpenEditModal(product)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(product._id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors relative z-10"
                            title="Delete Product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Product Modal (Add/Edit) */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingProduct ? "Edit Product" : "Add New Product"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Product Name
            </label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. Kiwi, Mango"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Unit Type
            </label>
            <select
              value={formData.unitType}
              onChange={(e: any) => setFormData({...formData, unitType: e.target.value})}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Box">Box</option>
              <option value="Kg">Kg</option>
              <option value="Lot">Lot</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
            >
              {loading ? "Saving..." : (editingProduct ? "Update Product" : "Add Product")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
