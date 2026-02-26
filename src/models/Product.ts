import mongoose, { Schema, model, models } from 'mongoose';
import { IProduct } from '@/types';

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, index: true },
    unitType: { type: String, enum: ['Box', 'Kg', 'Lot'], required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Product = models.Product || model<IProduct>('Product', ProductSchema);
export default Product;
