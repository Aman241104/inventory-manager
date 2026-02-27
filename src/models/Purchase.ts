import mongoose, { Schema, model, models } from 'mongoose';
import { IPurchase } from '@/types';

const PurchaseSchema = new Schema<IPurchase>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    vendorNames: [{ type: String }],
    vendorIds: [{ type: Schema.Types.ObjectId, ref: 'Vendor' }],
    lotName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0.0001 },
    rate: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number },
    date: { type: Date, default: Date.now, index: true },
    notes: { type: String },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Optimize for dashboard and report fetching
PurchaseSchema.index({ productId: 1, date: -1, isDeleted: 1 });
PurchaseSchema.index({ date: 1, isDeleted: 1 });

// Middleware to calculate totalAmount before saving
PurchaseSchema.pre('save', function () {
  this.totalAmount = this.quantity * this.rate;
});

if (mongoose.models.Purchase) {
  delete mongoose.models.Purchase;
}
const Purchase = model<IPurchase>('Purchase', PurchaseSchema);
export default Purchase;
