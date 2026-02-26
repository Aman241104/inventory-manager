"use server";

import { revalidatePath } from "next/cache";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import { IProduct } from "@/types";
import { MOCK_PRODUCTS } from "@/lib/mockData";

const USE_MOCK = process.env.USE_MOCK === "true";

export async function getProducts() {
  if (USE_MOCK) return { success: true, data: MOCK_PRODUCTS };
  try {
    await connectDB();
    const products = await Product.find({}).sort({ createdAt: -1 });
    return { success: true, data: JSON.parse(JSON.stringify(products)) };
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
    revalidatePath("/products");
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
    revalidatePath("/products");
    return { success: true };
  } catch (error) {
    console.error("Failed to update product:", error);
    return { success: false, error: "Failed to update product" };
  }
}

export async function toggleProductStatus(id: string, isActive: boolean) {
  try {
    await connectDB();
    await Product.findByIdAndUpdate(id, { isActive });
    revalidatePath("/products");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle product status:", error);
    return { success: false, error: "Failed to update product" };
  }
}
