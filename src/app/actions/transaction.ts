"use server";

import { revalidatePath } from "next/cache";
import connectDB from "@/lib/mongodb";
import Purchase from "@/models/Purchase";
import Sale from "@/models/Sale";
import Vendor from "@/models/Vendor";
import Customer from "@/models/Customer";
import Product from "@/models/Product";
import { IPurchase, ISale } from "@/types";

import mongoose, { Types } from "mongoose";

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
      productId: new mongoose.Types.ObjectId(data.productId),
      lotName: data.lotName,
      date: { $gte: startOfDay, $lte: endOfDay },
      isDeleted: false
    });

    if (existingLot) {
      existingLot.quantity = Number(existingLot.quantity) + Number(data.quantity);
      if (data.rate !== undefined) {
        existingLot.rate = data.rate;
      }
      existingLot.notes = (existingLot.notes ? existingLot.notes + "; " : "") + (data.notes || "");
      await existingLot.save();
    } else {
      const purchase = new Purchase({
        ...data,
        productId: new mongoose.Types.ObjectId(data.productId),
        vendorId: new mongoose.Types.ObjectId(data.vendorId),
        date: purchaseDate
      });
      await purchase.save();
    }

    revalidatePath("/transactions");
    revalidatePath("/details");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Purchase error detail:", error);
    return { success: false, error: "Failed to record purchase" };
  }
}

/**
 * Adds a sale linked to a specific Lot (Purchase entry).
 */
export async function addSale(data: Partial<ISale> & { date: string | Date }) {
  try {
    console.log("addSale action received data:", data);
    await connectDB();

    if (!data.purchaseId || data.purchaseId === "") {
      console.error("addSale error: No purchaseId provided");
      return { success: false, error: "Please select a valid Batch/Lot" };
    }

    const lotId = new mongoose.Types.ObjectId(data.purchaseId);
    const lot = await Purchase.findById(lotId);
    if (!lot) return { success: false, error: "Lot not found" };

    const previousSales = await Sale.aggregate([
      { $match: { purchaseId: lot._id, isDeleted: false } },
      { $group: { _id: null, total: { $sum: "$quantity" } } }
    ]);

    const soldSoFar = previousSales[0]?.total || 0;
    const currentAvailable = lot.quantity - soldSoFar;

    // The sale quantity will deplete the currentAvailable
    const isExtraSold = Number(data.quantity) > currentAvailable;

    const sale = new Sale({
      ...data,
      productId: new mongoose.Types.ObjectId(data.productId),
      customerId: new mongoose.Types.ObjectId(data.customerId),
      purchaseId: lotId,
      date: new Date(data.date),
      isExtraSold
    });

    const savedSale = await sale.save();

    revalidatePath("/transactions");
    revalidatePath("/details");
    revalidatePath("/");

    return { success: true, isExtraSold, data: JSON.parse(JSON.stringify(savedSale)) };
  } catch (error) {
    console.error("Sale error detail:", error);
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
            .sort({ date: -1 })
            .lean();
            
        const lotsWithAvailable = await Promise.all(lots.map(async (lot: any) => {
            const sales = await Sale.aggregate([
                { $match: { purchaseId: lot._id, isDeleted: false } },
                { $group: { _id: null, total: { $sum: "$quantity" } } }
            ]);
            const soldSoFar = sales[0]?.total || 0;
            return {
                ...lot,
                _id: lot._id.toString(),
                availableQty: lot.quantity - soldSoFar
            };
        }));
            
        return { success: true, data: JSON.parse(JSON.stringify(lotsWithAvailable)) };
    } catch (error) {
        return { success: false, error: "Failed to fetch lots" };
    }
}

export async function getPurchases(fromDate?: string, toDate?: string) {
  try {
    await connectDB();
    const query: any = { isDeleted: false };
    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }
    const purchases = await Purchase.find(query)
      .populate("productId", "name unitType")
      .populate("vendorId", "name")
      .sort({ date: -1 })
      .lean();
    return { success: true, data: JSON.parse(JSON.stringify(purchases)) };
  } catch (error) {
    return { success: false, error: "Failed to fetch purchases" };
  }
}

export async function getSales(fromDate?: string, toDate?: string) {
  try {
    await connectDB();
    const query: any = { isDeleted: false };
    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }
    const sales = await Sale.find(query)
      .populate("productId", "name unitType")
      .populate("customerId", "name")
      .populate("purchaseId", "lotName")
      .sort({ date: -1 })
      .lean();
    return { success: true, data: JSON.parse(JSON.stringify(sales)) };
  } catch (error) {
    return { success: false, error: "Failed to fetch sales" };
  }
}
