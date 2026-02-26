"use server";

import { revalidatePath } from "next/cache";
import connectDB from "@/lib/mongodb";
import Purchase from "@/models/Purchase";
import Sale from "@/models/Sale";
import { getProductStock } from "@/services/stockService";
import { MOCK_PURCHASES, MOCK_SALES } from "@/lib/mockData";

const USE_MOCK = process.env.USE_MOCK === "true";

export async function getProductStockAction(productId: string) {
  if (USE_MOCK) return { success: true, data: { available: 10, totalPurchase: 15, totalSale: 5 } };
  try {
    return { success: true, data: await getProductStock(productId) };
  } catch (error) {
    return { success: false, error: "Failed to fetch stock" };
  }
}

export async function addPurchase(data: any) {
  if (USE_MOCK) return { success: true };
  try {
    await connectDB();
    const purchase = new Purchase(data);
    await purchase.save();
    revalidatePath("/buy");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Purchase error:", error);
    return { success: false, error: "Failed to record purchase" };
  }
}

export async function addSale(data: any) {
  if (USE_MOCK) return { success: true, isExtraSold: false };
  try {
    await connectDB();
    
    // Check stock for isExtraSold flag
    const stock = await getProductStock(data.productId);
    const isExtraSold = data.quantity > stock.available;

    const sale = new Sale({
      ...data,
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

export async function getPurchases(fromDate?: string, toDate?: string) {
  if (USE_MOCK) return { success: true, data: MOCK_PURCHASES };
  try {
    await connectDB();
    const query: any = { isDeleted: false };
    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }
    const purchases = await Purchase.find(query)
      .populate("productId", "name unitType")
      .populate("vendorId", "name")
      .sort({ date: -1 });
    return { success: true, data: JSON.parse(JSON.stringify(purchases)) };
  } catch (error) {
    return { success: false, error: "Failed to fetch purchases" };
  }
}

export async function getSales(fromDate?: string, toDate?: string) {
  if (USE_MOCK) return { success: true, data: MOCK_SALES };
  try {
    await connectDB();
    const query: any = { isDeleted: false };
    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }
    const sales = await Sale.find(query)
      .populate("productId", "name unitType")
      .populate("customerId", "name")
      .sort({ date: -1 });
    return { success: true, data: JSON.parse(JSON.stringify(sales)) };
  } catch (error) {
    return { success: false, error: "Failed to fetch sales" };
  }
}
