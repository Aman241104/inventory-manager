"use server";

import connectDB from "@/lib/mongodb";
import Purchase from "@/models/Purchase";
import Sale from "@/models/Sale";
import Product from "@/models/Product";
import Vendor from "@/models/Vendor";
import Customer from "@/models/Customer";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

export async function getDeletedItems() {
  try {
    await connectDB();
    
    const [lots, sales, products, vendors, customers] = await Promise.all([
      Purchase.find({ isDeleted: true }).populate("productId", "name").lean(),
      Sale.find({ isDeleted: true }).populate("productId", "name").populate("customerId", "name").lean(),
      Product.find({ isDeleted: true }).lean(),
      Vendor.find({ isDeleted: true }).lean(),
      Customer.find({ isDeleted: true }).lean(),
    ]);

    return {
      success: true,
      data: {
        lots: JSON.parse(JSON.stringify(lots)),
        sales: JSON.parse(JSON.stringify(sales)),
        products: JSON.parse(JSON.stringify(products)),
        vendors: JSON.parse(JSON.stringify(vendors)),
        customers: JSON.parse(JSON.stringify(customers)),
      }
    };
  } catch (error) {
    return { success: false, error: "Failed to fetch deleted items" };
  }
}

export async function restoreItem(type: 'lot' | 'sale' | 'product' | 'vendor' | 'customer', id: string) {
  try {
    await connectDB();
    
    let model;
    switch (type) {
      case 'lot': model = Purchase; break;
      case 'sale': model = Sale; break;
      case 'product': model = Product; break;
      case 'vendor': model = Vendor; break;
      case 'customer': model = Customer; break;
    }

    if (!model) return { success: false, error: "Invalid type" };

    const item = await model.findByIdAndUpdate(id, { isDeleted: false }, { new: true });

    // Side effects
    if (type === 'sale' && item) {
        // When restoring a sale, we must decrement remainingQty on the lot again
        await Purchase.findByIdAndUpdate(item.purchaseId, {
            $inc: { remainingQty: -item.quantity }
        });
    }

    revalidatePath("/trash");
    revalidatePath("/");
    revalidatePath("/details");
    revalidatePath("/products");
    revalidatePath("/vendors");
    revalidatePath("/customers");
    
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to restore item" };
  }
}
