import mongoose, { Schema, model, models } from 'mongoose';
import { IVendor } from '@/types';

const VendorSchema = new Schema<IVendor>(
  {
    name: { type: String, required: true },
    contact: { type: String },
    address: { type: String },
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

const Vendor = models.Vendor || model<IVendor>('Vendor', VendorSchema);
export default Vendor;
