import connectDB from "@/lib/mongodb";
import Purchase from "@/models/Purchase";
import Sale from "@/models/Sale";
import mongoose from "mongoose";

export async function getTotalPurchase(productId: string) {
  await connectDB();
  const id = new mongoose.Types.ObjectId(productId);
  const result = await Purchase.aggregate([
    { $match: { productId: id, isDeleted: false } },
    { $group: { _id: null, total: { $sum: "$quantity" } } }
  ]);
  return result[0]?.total || 0;
}

export async function getTotalSale(productId: string) {
  await connectDB();
  const id = new mongoose.Types.ObjectId(productId);
  const result = await Sale.aggregate([
    { $match: { productId: id, isDeleted: false } },
    { $group: { _id: null, total: { $sum: "$quantity" } } }
  ]);
  return result[0]?.total || 0;
}

export async function getCurrentStock(productId: string) {
  const purchased = await getTotalPurchase(productId);
  const sold = await getTotalSale(productId);
  
  let remaining = 0;
  let extraSold = 0;
  let status = "OK";

  if (sold > purchased) {
    status = "EXTRA_SOLD";
    extraSold = sold - purchased;
  } else if (purchased > sold) {
    status = "REMAINING";
    remaining = purchased - sold;
  }

  return {
    purchased,
    sold,
    remaining,
    extraSold,
    status
  };
}

// Keeping getProductStock for compatibility with existing components if needed
export async function getProductStock(productId: string) {
  const stock = await getCurrentStock(productId);
  return {
    totalPurchase: stock.purchased,
    totalSale: stock.sold,
    available: stock.remaining - stock.extraSold // This is effectively purchased - sold
  };
}
