import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Vendor from "@/models/Vendor";
import Customer from "@/models/Customer";
import Purchase from "@/models/Purchase";
import Sale from "@/models/Sale";

export default async function ConnectionTestPage() {
  let status = "Checking...";
  let details = {};

  try {
    await connectDB();
    const [pCount, vCount, cCount, buyCount, sCount] = await Promise.all([
      Product.countDocuments(),
      Vendor.countDocuments(),
      Customer.countDocuments(),
      Purchase.countDocuments(),
      Sale.countDocuments()
    ]);

    status = "Connected Successfully!";
    details = {
      products: pCount,
      vendors: vCount,
      customers: cCount,
      purchases: buyCount,
      sales: sCount
    };
  } catch (error: any) {
    status = "Connection Failed";
    details = { error: error.message };
  }

  return (
    <div className="p-10 space-y-6">
      <h1 className={`text-3xl font-bold ${status.includes("Successfully") ? "text-emerald-600" : "text-rose-600"}`}>
        {status}
      </h1>
      
      <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl font-mono text-sm shadow-xl">
        <pre>{JSON.stringify(details, null, 2)}</pre>
      </div>

      <div className="text-slate-500 italic">
        This page verifies that the MongoDB cluster is reachable and that all models are properly defined.
      </div>
    </div>
  );
}
