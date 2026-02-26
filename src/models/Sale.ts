import mongoose, { Schema, model, models } from 'mongoose';
import { ISale } from '@/types';

const SaleSchema = new Schema<ISale>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    purchaseId: { type: Schema.Types.ObjectId, ref: 'Purchase', required: true, index: true },
    quantity: { type: Number, required: true, min: 0.0001 },
    rate: { type: Number, required: true, min: 0.0001 },
    totalAmount: { type: Number },
    date: { type: Date, default: Date.now, index: true },
    notes: { type: String },
    isExtraSold: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Middleware to calculate totalAmount before saving
SaleSchema.pre('save', function() {
  this.totalAmount = this.quantity * this.rate;
});

const Sale = models.Sale || model<ISale>('Sale', SaleSchema);
export default Sale;
