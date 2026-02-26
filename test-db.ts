import mongoose from "mongoose";

async function run() {
  const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/inventory-manger";

  // Need to dynamically import dot env since NEXT runs it
  require("dotenv").config({ path: ".env.local" });

  await mongoose.connect(process.env.MONGODB_URI || MONGODB_URI);

  // Define a generic schema to just read the collection
  const SaleSchema = new mongoose.Schema({}, { strict: false, collection: 'sales' });
  const Sale = mongoose.models.Sale || mongoose.model('Sale', SaleSchema);

  const sales = await Sale.find({});
  console.log("Found", sales.length, "sales.");
  sales.forEach(s => {
    console.log(JSON.stringify(s, null, 2));
  });
  process.exit(0);
}
run().catch(console.error);
