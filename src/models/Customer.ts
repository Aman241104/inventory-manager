import mongoose, { Schema, model, models } from 'mongoose';
import { ICustomer } from '@/types';

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true },
    contact: { type: String },
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

const Customer = models.Customer || model<ICustomer>('Customer', CustomerSchema);
export default Customer;
