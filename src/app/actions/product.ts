"use server";

import { revalidatePath } from "next/cache";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Purchase from "@/models/Purchase";
import Sale from "@/models/Sale";
import { IProduct } from "@/types";
import { MOCK_PRODUCTS } from "@/lib/mockData";

const USE_MOCK = process.env.USE_MOCK === "true";

export async function getProducts() {
  if (USE_MOCK) return { success: true, data: MOCK_PRODUCTS };
  try {
    await connectDB();
    const products = await Product.find({ isDeleted: false }).sort({ createdAt: -1 }).lean();

    const productsWithStats = await Promise.all(products.map(async (p: any) => {
      const lastPurchase = await Purchase.findOne({ productId: p._id, isDeleted: false }).sort({ date: -1 }).lean();
      const lastSale = await Sale.findOne({ productId: p._id, isDeleted: false }).sort({ date: -1 }).lean();
      const totalBatches = await Purchase.countDocuments({ productId: p._id, isDeleted: false });

      let lastDate = null;
      if (lastPurchase && lastSale) {
        lastDate = lastPurchase.date > lastSale.date ? lastPurchase.date : lastSale.date;
      } else if (lastPurchase) {
        lastDate = lastPurchase.date;
      } else if (lastSale) {
        lastDate = lastSale.date;
      }

      return {
        ...p,
        _id: p._id.toString(),
        lastTransaction: lastDate,
        totalBatches
      };
    }));

    return { success: true, data: productsWithStats };
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return { success: false, error: "Failed to fetch products" };
  }
}

export async function addProduct(formData: { name: string; unitType: string }) {
  if (USE_MOCK) return { success: true };
  try {
    await connectDB();
    const newProduct = new Product(formData);
    await newProduct.save();
    try { revalidatePath("/products"); } catch (e) {}
    return { success: true };
  } catch (error) {
    console.error("Failed to add product:", error);
    return { success: false, error: "Failed to add product" };
  }
}

export async function updateProduct(id: string, formData: Partial<IProduct>) {
  if (USE_MOCK) return { success: true };
  try {
    await connectDB();
    await Product.findByIdAndUpdate(id, formData);
    try { revalidatePath("/products"); } catch (e) {}
    return { success: true };
  } catch (error) {
    console.error("Failed to update product:", error);
    return { success: false, error: "Failed to update product" };
  }
}

export async function deleteProduct(id: string) {
  if (USE_MOCK) return { success: true };
  try {
    await connectDB();
    
    // Soft delete
    await Product.findByIdAndUpdate(id, { isDeleted: true });
    
    try {
      revalidatePath("/products");
    } catch (e) {}
    return { success: true };
  } catch (error) {
    console.error("Failed to delete product:", error);
    return { success: false, error: "Failed to delete product" };
  }
}

export async function toggleProductStatus(id: string, isActive: boolean) {
  try {
    await connectDB();
    await Product.findByIdAndUpdate(id, { isActive });
    try { revalidatePath("/products"); } catch (e) {}
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle product status:", error);
    return { success: false, error: "Failed to update product" };
  }
}
