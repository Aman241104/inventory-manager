"use server";

import { revalidatePath } from "next/cache";
import connectDB from "@/lib/mongodb";
import Purchase from "@/models/Purchase";
import Sale from "@/models/Sale";
import Vendor from "@/models/Vendor";
import Customer from "@/models/Customer";
import Product from "@/models/Product";
import { IPurchase, ISale } from "@/types";

/**
 * Adds a purchase. If a purchase for the same product, same date, and same lot name 
 * exists, it combines them (merges into a Lot).
 */
export async function addPurchase(data: Partial<IPurchase> & { date: string | Date }) {
  try {
    await connectDB();
    
    const purchaseDate = new Date(data.date);
    const startOfDay = new Date(purchaseDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(purchaseDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find existing purchase for same product, same lot name on the same day
    const existingLot = await Purchase.findOne({
      productId: data.productId,
      lotName: data.lotName,
      date: { $gte: startOfDay, $lte: endOfDay },
      isDeleted: false
    });

    if (existingLot) {
      // Update existing lot (Combine quantity and average the rate or keep last)
      // Here we add quantity and we'll use the new rate (or we could weighted average)
      const newQuantity = Number(existingLot.quantity) + Number(data.quantity);
      
      existingLot.quantity = newQuantity;
      existingLot.rate = data.rate; // Update to latest rate
      existingLot.notes = (existingLot.notes ? existingLot.notes + "; " : "") + (data.notes || "");
      
      await existingLot.save();
    } else {
      const purchase = new Purchase(data);
      await purchase.save();
    }

    revalidatePath("/buy");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Purchase error:", error);
    return { success: false, error: "Failed to record purchase" };
  }
}

/**
 * Adds a sale linked to a specific Lot (Purchase entry).
 */
export async function addSale(data: Partial<ISale> & { date: string | Date }) {
  try {
    await connectDB();
    
    // Calculate total stock for this specific lot
    const lot = await Purchase.findById(data.purchaseId);
    if (!lot) return { success: false, error: "Lot not found" };

    const previousSales = await Sale.aggregate([
      { $match: { purchaseId: lot._id, isDeleted: false } },
      { $group: { _id: null, total: { $sum: "$quantity" } } }
    ]);

    const soldSoFar = previousSales[0]?.total || 0;
    const available = lot.quantity - soldSoFar;
    const isExtraSold = Number(data.quantity) > available;

    const sale = new Sale({
      ...data,
      date: new Date(data.date),
      isExtraSold
    });
    
    await sale.save();
    revalidatePath("/sell");
    revalidatePath("/");
    return { success: true, isExtraSold };
  } catch (error) {
    console.error("Sale error:", error);
    return { success: false, error: "Failed to record sale" };
  }
}

/**
 * On-the-go Vendor creation
 */
export async function addVendorAction(name: string, contact: string) {
  try {
    await connectDB();
    const vendor = new Vendor({ name, contact });
    await vendor.save();
    return { success: true, data: JSON.parse(JSON.stringify(vendor)) };
  } catch (error) {
    return { success: false, error: "Failed to add vendor" };
  }
}

/**
 * On-the-go Customer creation
 */
export async function addCustomerAction(name: string, contact: string) {
  try {
    await connectDB();
    const customer = new Customer({ name, contact });
    await customer.save();
    return { success: true, data: JSON.parse(JSON.stringify(customer)) };
  } catch (error) {
    return { success: false, error: "Failed to add customer" };
  }
}

/**
 * On-the-go Product creation
 */
export async function addProductAction(name: string, unitType: string) {
  try {
    await connectDB();
    const product = new Product({ name, unitType });
    await product.save();
    return { success: true, data: JSON.parse(JSON.stringify(product)) };
  } catch (error) {
    return { success: false, error: "Failed to add product" };
  }
}

export async function getLotsForProduct(productId: string) {
    try {
        await connectDB();
        const lots = await Purchase.find({ productId, isDeleted: false })
            .sort({ date: -1 });
        return { success: true, data: JSON.parse(JSON.stringify(lots)) };
    } catch (error) {
        return { success: false, error: "Failed to fetch lots" };
    }
}
