import mongoose, { Schema, model, models } from 'mongoose';
import { IPurchase } from '@/types';

const PurchaseSchema = new Schema<IPurchase>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    quantity: { type: Number, required: true, min: 0.0001 },
    rate: { type: Number, required: true, min: 0.0001 },
    totalAmount: { type: Number },
    date: { type: Date, default: Date.now, index: true },
    notes: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Middleware to calculate totalAmount before saving
PurchaseSchema.pre('save', function() {
  this.totalAmount = this.quantity * this.rate;
});

const Purchase = models.Purchase || model<IPurchase>('Purchase', PurchaseSchema);
export default Purchase;
