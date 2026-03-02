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
export async function addPurchase(data: Partial<IPurchase> & { date: string | Date; vendorId?: string; targetLotId?: string }) {
  try {
    await connectDB();

    const [year, month, day] = data.date.toString().split('-').map(Number);
    const purchaseDate = new Date(Date.UTC(year, month - 1, day));
    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    // Get vendor info
    const vendor = data.vendorId ? await Vendor.findById(data.vendorId) : null;
    const vendorName = vendor ? vendor.name : "Unknown Vendor";

    if (data.targetLotId) {
      // Logic for adding to an SPECIFIC existing lot (Explicit Merge)
      const existingLot = await Purchase.findById(data.targetLotId);
      if (!existingLot) return { success: false, error: "Target batch not found" };

      // Calculate weighted average rate
      const totalQty = existingLot.quantity + Number(data.quantity);
      const weightedRate = ((existingLot.quantity * existingLot.rate) + (Number(data.quantity) * Number(data.rate))) / totalQty;

      existingLot.quantity = totalQty;
      existingLot.remainingQty = existingLot.remainingQty + Number(data.quantity);
      existingLot.rate = Number(weightedRate.toFixed(2));
      existingLot.notes = (existingLot.notes ? existingLot.notes + "; " : "") + 
                         `[APPEND]: Added ${data.quantity} units @ ₹${data.rate}. ` + (data.notes || "");
      
      // Add vendor if new
      if (data.vendorId && !existingLot.vendorIds.some((id: any) => id.toString() === data.vendorId)) {
        existingLot.vendorIds.push(new mongoose.Types.ObjectId(data.vendorId));
        existingLot.vendorNames.push(vendorName);
      }
      await existingLot.save();
    } else {
      // Find existing lot for same product on the same day (Auto-Clubbing)
      const existingLot = await Purchase.findOne({
        productId: new mongoose.Types.ObjectId(data.productId),
        date: { $gte: startOfDay, $lte: endOfDay },
        isDeleted: false
      });

      if (existingLot) {
        // Clubbing logic: Add quantity, update rate (Weighted average for auto-clubbing too)
        const totalQty = existingLot.quantity + Number(data.quantity);
        const weightedRate = ((existingLot.quantity * existingLot.rate) + (Number(data.quantity) * Number(data.rate))) / totalQty;

        existingLot.quantity = totalQty;
        existingLot.remainingQty = existingLot.remainingQty + Number(data.quantity);
        existingLot.rate = Number(weightedRate.toFixed(2));

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
        const dateStr = `${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`;
        const lotName = `${productPrefix}-${dateStr}`;

        const purchase = new Purchase({
          ...data,
          productId: new mongoose.Types.ObjectId(data.productId),
          vendorIds: data.vendorId ? [new mongoose.Types.ObjectId(data.vendorId)] : [],
          vendorNames: vendor ? [vendorName] : [],
          lotName: lotName,
          remainingQty: Number(data.quantity),
          date: purchaseDate
        });
        await purchase.save();
      }
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
    
    // Bug 1.4: Use findOneAndUpdate atomically to decrement remainingQty
    // and get the state BEFORE decrement to check if extra sold
    const lot = await Purchase.findOneAndUpdate(
      { _id: lotId },
      { $inc: { remainingQty: -Number(data.quantity) } },
      { new: false } // We want the state BEFORE the decrement to calculate available
    );

    if (!lot) return { success: false, error: "Lot not found" };

    // If remainingQty before this sale was less than the requested quantity, it's an extra sale
    const isExtraSold = lot.remainingQty < Number(data.quantity);

    const [year, month, day] = data.date.toString().split('-').map(Number);
    const saleDate = new Date(Date.UTC(year, month - 1, day));

    const sale = new Sale({
      ...data,
      productId: new mongoose.Types.ObjectId(data.productId),
      customerId: new mongoose.Types.ObjectId(data.customerId),
      purchaseId: lotId,
      date: saleDate,
      isExtraSold
    });

    const savedSale = await sale.save();

    revalidatePath("/transactions");
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

    // If quantity is changing, we need to adjust the lot's remainingQty
    if (data.quantity !== undefined) {
      const oldSale = await Sale.findById(id);
      if (oldSale) {
        const diff = Number(data.quantity) - oldSale.quantity;
        await Purchase.findByIdAndUpdate(oldSale.purchaseId, {
          $inc: { remainingQty: -diff }
        });
      }
    }

    const updateData: any = { ...data };

    if (data.productId) updateData.productId = new mongoose.Types.ObjectId(data.productId);
    if (data.customerId) updateData.customerId = new mongoose.Types.ObjectId(data.customerId);
    if (data.purchaseId) updateData.purchaseId = new mongoose.Types.ObjectId(data.purchaseId);
    if (data.date) updateData.date = new Date(data.date);

    // Bug 1.1 Fix: Manually recalculate totalAmount since findByIdAndUpdate bypasses middleware
    if (data.quantity !== undefined || data.rate !== undefined) {
      const current = await Sale.findById(id);
      if (current) {
        const q = data.quantity !== undefined ? Number(data.quantity) : current.quantity;
        const r = data.rate !== undefined ? Number(data.rate) : current.rate;
        updateData.totalAmount = q * r;
      }
    }

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
    const oldPurchase = await Purchase.findById(id);
    const updateData: any = { ...data };

    if (oldPurchase && data.quantity !== undefined && data.quantity !== oldPurchase.quantity) {
      const qtyDiff = Number(data.quantity) - oldPurchase.quantity;
      updateData.remainingQty = oldPurchase.remainingQty + qtyDiff;
    }

    if (data.productId) updateData.productId = new mongoose.Types.ObjectId(data.productId);
    if (data.date) updateData.date = new Date(data.date);

    // Bug 1.1 Fix: Recalculate totalAmount
    if (data.quantity !== undefined || data.rate !== undefined) {
      const current = await Purchase.findById(id);
      if (current) {
        const q = data.quantity !== undefined ? Number(data.quantity) : current.quantity;
        const r = data.rate !== undefined ? Number(data.rate) : current.rate;
        updateData.totalAmount = q * r;
      }
    }

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

    // Zero out the remainingQty on the lot
    await Purchase.findByIdAndUpdate(lotId, { remainingQty: 0 });

    revalidatePath("/details"); revalidatePath("/");
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
        
        // Bug 1.4: Use atomic update to prevent race conditions even in bulk
        const lot = await Purchase.findOneAndUpdate(
          { _id: lotId },
          { $inc: { remainingQty: -Number(data.quantity) } },
          { new: false }
        );

        if (!lot) continue;

        const isExtraSold = lot.remainingQty < Number(data.quantity);
        const [year, month, day] = data.date.toString().split('-').map(Number);
        const saleDate = new Date(Date.UTC(year, month - 1, day));

        const sale = new Sale({
          ...data,
          productId: new mongoose.Types.ObjectId(data.productId),
          customerId: new mongoose.Types.ObjectId(data.customerId),
          purchaseId: lotId,
          date: saleDate,
          isExtraSold
        });

        const savedSale = await sale.save();
        results.push(savedSale);
      } else {
        // Handle Buy (Purchase)
        const [year, month, day] = data.date.toString().split('-').map(Number);
        const purchaseDate = new Date(Date.UTC(year, month - 1, day));
        const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

        const vendor = data.vendorId ? await Vendor.findById(data.vendorId) : null;
        const vendorName = vendor ? vendor.name : "Unknown Vendor";

        const existingLot = await Purchase.findOne({
          productId: new mongoose.Types.ObjectId(data.productId),
          date: { $gte: startOfDay, $lte: endOfDay },
          isDeleted: false
        });
        if (existingLot) {
          existingLot.quantity = Number(existingLot.quantity) + Number(data.quantity);
          existingLot.remainingQty = Number(existingLot.remainingQty) + Number(data.quantity);
          if (data.rate !== undefined) existingLot.rate = data.rate;
          if (data.vendorId && !existingLot.vendorIds.some((id: any) => id.toString() === data.vendorId)) {
            existingLot.vendorIds.push(new mongoose.Types.ObjectId(data.vendorId));
            existingLot.vendorNames.push(vendorName);
          }
          results.push(await existingLot.save());
        } else {
          const product = await Product.findById(data.productId);
          const productPrefix = product ? product.name.substring(0, 3).toUpperCase() : "LOT";
          const dateStr = `${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`;
          const lotName = `${productPrefix}-${dateStr}`;

          const purchase = new Purchase({
            ...data,
            productId: new mongoose.Types.ObjectId(data.productId),
            vendorIds: data.vendorId ? [new mongoose.Types.ObjectId(data.vendorId)] : [],
            vendorNames: vendor ? [vendorName] : [],
            lotName: lotName,
            remainingQty: Number(data.quantity),
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

/**
 * Merges source lot into target lot.
 * Recalculates weighted average rate and moves all sales.
 */
export async function mergeLotsAction(sourceId: string, targetId: string) {
  try {
    await connectDB();

    const source = await Purchase.findById(sourceId);
    const target = await Purchase.findById(targetId);

    if (!source || !target) return { success: false, error: "One or both lots not found" };
    if (source.productId.toString() !== target.productId.toString()) {
      return { success: false, error: "Cannot merge different products" };
    }

    // 1. Calculate weighted average rate
    const totalQty = source.quantity + target.quantity;
    const weightedRate = ((source.quantity * source.rate) + (target.quantity * target.rate)) / totalQty;

    // 2. Reparent all sales from source to target
    await Sale.updateMany(
      { purchaseId: source._id, isDeleted: false },
      { purchaseId: target._id }
    );

    // 3. Update Target with combined values
    target.quantity = totalQty;
    target.remainingQty = target.remainingQty + source.remainingQty;
    target.rate = Number(weightedRate.toFixed(2));
    target.notes = (target.notes ? target.notes + "\n" : "") + 
                   `[MERGE]: Combined with ${source.lotName} (${source.quantity} units @ ₹${source.rate})`;
    
    // Add unique vendor IDs from source to target
    source.vendorIds.forEach((sid: any) => {
      if (!target.vendorIds.some((tid: any) => tid.toString() === sid.toString())) {
        target.vendorIds.push(sid);
      }
    });
    
    source.vendorNames.forEach((name: string) => {
      if (!target.vendorNames.includes(name)) {
        target.vendorNames.push(name);
      }
    });

    await target.save();

    // 4. Soft delete source
    source.isDeleted = true;
    source.notes = (source.notes ? source.notes + "\n" : "") + `[MERGE]: Merged into ${target.lotName}`;
    await source.save();

    revalidatePath("/");
    revalidatePath("/details");
    revalidatePath("/transactions");
    return { success: true };
  } catch (error) {
    console.error("Merge error:", error);
    return { success: false, error: "Failed to merge batches" };
  }
}

