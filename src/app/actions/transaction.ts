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
 * Adds a purchase. Automatically clubs purchases for the same product on the same day 
 * into one Batch/Lot.
 */
export async function addPurchase(data: Partial<IPurchase> & { date: string | Date; vendorId?: string }) {
  try {
    await connectDB();

    const purchaseDate = new Date(data.date);
    const startOfDay = new Date(purchaseDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(purchaseDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get vendor info
    const vendor = data.vendorId ? await Vendor.findById(data.vendorId) : null;
    const vendorName = vendor ? vendor.name : "Unknown Vendor";

    // Find existing lot for same product on the same day
    const existingLot = await Purchase.findOne({
      productId: new mongoose.Types.ObjectId(data.productId),
      date: { $gte: startOfDay, $lte: endOfDay },
      isDeleted: false
    });

    if (existingLot) {
      // Clubbing logic: Add quantity, update rate (maybe weighted average or just latest?)
      // User requested "clubbing" so they see 100 total.
      existingLot.quantity = Number(existingLot.quantity) + Number(data.quantity);
      
      // Update rate to the latest one
      if (data.rate !== undefined) {
        existingLot.rate = data.rate;
      }

      // Add vendor if not already present
      if (data.vendorId && !existingLot.vendorIds.some((id: any) => id.toString() === data.vendorId)) {
        existingLot.vendorIds.push(new mongoose.Types.ObjectId(data.vendorId));
        existingLot.vendorNames.push(vendorName);
      }

      existingLot.notes = (existingLot.notes ? existingLot.notes + "; " : "") + (data.notes || "");
      await existingLot.save();
    } else {
      // Auto-generate lot name: LOT-[YYYYMMDD]-[PRODUCT_CODE]
      const product = await Product.findById(data.productId);
      const productPrefix = product ? product.name.substring(0, 3).toUpperCase() : "LOT";
      const dateStr = startOfDay.toISOString().split('T')[0].replace(/-/g, '');
      const lotName = `${productPrefix}-${dateStr}`;

      const purchase = new Purchase({
        ...data,
        productId: new mongoose.Types.ObjectId(data.productId),
        vendorIds: data.vendorId ? [new mongoose.Types.ObjectId(data.vendorId)] : [],
        vendorNames: vendor ? [vendorName] : [],
        lotName: lotName,
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
      { $match: { purchaseId: new mongoose.Types.ObjectId(lot._id), isDeleted: false } },
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

        revalidatePath("/details");
        revalidatePath("/");
        return { success: true, isExtraSold, data: JSON.parse(JSON.stringify(savedSale)) };
      } catch (error) {
        console.error("Sale error detail:", error);
        return { success: false, error: "Failed to record sale" };
      }
    }
    
    export async function updateSale(id: string, data: Partial<ISale>) {
      try {
        await connectDB();
        const updateData: any = { ...data };
        
        if (data.productId) updateData.productId = new mongoose.Types.ObjectId(data.productId);
        if (data.customerId) updateData.customerId = new mongoose.Types.ObjectId(data.customerId);
        if (data.purchaseId) updateData.purchaseId = new mongoose.Types.ObjectId(data.purchaseId);
        if (data.date) updateData.date = new Date(data.date);
    
        await Sale.findByIdAndUpdate(id, updateData);
        
        revalidatePath("/transactions");
        revalidatePath("/details");
        revalidatePath("/");
        return { success: true };
      } catch (error) {
        console.error("Update sale error:", error);
        return { success: false, error: "Failed to update sale" };
      }
    }

    export async function updatePurchase(id: string, data: Partial<IPurchase> & { vendorId?: string }) {
      try {
        await connectDB();
        const updateData: any = { ...data };
        
        if (data.productId) updateData.productId = new mongoose.Types.ObjectId(data.productId);
        if (data.date) updateData.date = new Date(data.date);
        
        // If someone still passes vendorId, we treat it as vendorIds: [vendorId]
        if ((data as any).vendorId) {
          updateData.vendorIds = [new mongoose.Types.ObjectId((data as any).vendorId)];
          delete updateData.vendorId;
        }
    
        await Purchase.findByIdAndUpdate(id, updateData);
        
            revalidatePath("/transactions");
            revalidatePath("/details");
            revalidatePath("/");
            return { success: true };
          } catch (error) {
            console.error("Update purchase error:", error);
            return { success: false, error: "Failed to update batch" };
          }
        }
        
        /**
         * Automatically clears remaining stock as spoilage/damage.
         */
        export async function writeOffLot(lotId: string) {
          try {
            await connectDB();
            
            const lot = await Purchase.findById(lotId);
            if (!lot) return { success: false, error: "Lot not found" };
        
            // Calculate current available
            const previousSales = await Sale.aggregate([
              { $match: { purchaseId: new mongoose.Types.ObjectId(lotId), isDeleted: false } },
              { $group: { _id: null, total: { $sum: "$quantity" } } }
            ]);
            const soldSoFar = previousSales[0]?.total || 0;
            const remaining = lot.quantity - soldSoFar;
        
            if (remaining <= 0) return { success: false, error: "No stock to write off" };
        
            // Ensure a "SPOILAGE" customer exists
            let spoilageCustomer = await Customer.findOne({ name: "SPOILAGE / LOSS" });
            if (!spoilageCustomer) {
              spoilageCustomer = await Customer.create({ 
                name: "SPOILAGE / LOSS", 
                contact: "INTERNAL",
                isActive: true 
              });
            }
        
            const sale = new Sale({
              productId: lot.productId,
              customerId: spoilageCustomer._id,
              purchaseId: lot._id,
              quantity: remaining,
              rate: 0,
              date: new Date(),
              notes: "Automatic write-off for damaged/rotten goods",
              isExtraSold: false
            });
        
            await sale.save();
        
                revalidatePath("/details");
                revalidatePath("/");
                return { success: true };
              } catch (error) {
                console.error("Write off error:", error);
                return { success: false, error: "Failed to write off stock" };
              }
            }
            
            /**
             * Bulk add transactions (Sales or Purchases) for high-volume traders.
             */
            export async function bulkAddTransactions(entries: any[]) {
              try {
                await connectDB();
                
                const results = [];
                for (const data of entries) {
                  if (data.type === "sell") {
                    const lotId = new mongoose.Types.ObjectId(data.purchaseId);
                    const lot = await Purchase.findById(lotId);
                    
                    if (!lot) continue;
            
                    const previousSales = await Sale.aggregate([
                      { $match: { purchaseId: lot._id, isDeleted: false } },
                      { $group: { _id: null, total: { $sum: "$quantity" } } }
                    ]);
            
                    const soldSoFar = previousSales[0]?.total || 0;
                    const currentAvailable = lot.quantity - soldSoFar;
                    const isExtraSold = Number(data.quantity) > currentAvailable;
            
                    const sale = new Sale({
                      ...data,
                      productId: new mongoose.Types.ObjectId(data.productId),
                      customerId: new mongoose.Types.ObjectId(data.customerId),
                      purchaseId: lotId,
                      date: new Date(data.date),
                      isExtraSold
                    });
            
                    results.push(await sale.save());
                  } else {
                    // Handle Buy (Purchase)
                    const purchaseDate = new Date(data.date);
                    const startOfDay = new Date(purchaseDate);
                    startOfDay.setHours(0, 0, 0, 0);
                    const endOfDay = new Date(purchaseDate);
                    endOfDay.setHours(23, 59, 59, 999);
            
                            const vendor = data.vendorId ? await Vendor.findById(data.vendorId) : null;
                            const vendorName = vendor ? vendor.name : "Unknown Vendor";
                    
                            const existingLot = await Purchase.findOne({
                              productId: new mongoose.Types.ObjectId(data.productId),
                              date: { $gte: startOfDay, $lte: endOfDay },
                              isDeleted: false
                            });            
                    if (existingLot) {
                      existingLot.quantity = Number(existingLot.quantity) + Number(data.quantity);
                      if (data.rate !== undefined) existingLot.rate = data.rate;
                      if (data.vendorId && !existingLot.vendorIds.some((id: any) => id.toString() === data.vendorId)) {
                        existingLot.vendorIds.push(new mongoose.Types.ObjectId(data.vendorId));
                        existingLot.vendorNames.push(vendorName);
                      }
                      results.push(await existingLot.save());
                    } else {
                      const product = await Product.findById(data.productId);
                      const productPrefix = product ? product.name.substring(0, 3).toUpperCase() : "LOT";
                      const dateStr = startOfDay.toISOString().split('T')[0].replace(/-/g, '');
                      const lotName = `${productPrefix}-${dateStr}`;
            
                      const purchase = new Purchase({
                        ...data,
                        productId: new mongoose.Types.ObjectId(data.productId),
                        vendorIds: data.vendorId ? [new mongoose.Types.ObjectId(data.vendorId)] : [],
                        vendorNames: vendor ? [vendorName] : [],
                        lotName: lotName,
                        date: purchaseDate
                      });
                      results.push(await purchase.save());
                    }
                  }
                }
            
                revalidatePath("/transactions");
                revalidatePath("/details");
                revalidatePath("/");
                return { success: true, count: results.length };
              } catch (error) {
                console.error("Bulk transaction error:", error);
                return { success: false, error: "Failed to process bulk entries" };
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
                { $match: { purchaseId: new mongoose.Types.ObjectId(lot._id), isDeleted: false } },
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
      .populate("vendorIds", "name")
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
