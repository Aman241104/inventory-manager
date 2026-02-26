import { Document, Types } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  unitType: 'Box' | 'Kg' | 'Lot';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVendor extends Document {
  name: string;
  contact: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICustomer extends Document {
  name: string;
  contact: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPurchase extends Document {
  productId: Types.ObjectId | any;
  vendorId: Types.ObjectId | any;
  lotName: string; // e.g., "Batch 1", "Lot A"
  quantity: number;
  rate: number;
  totalAmount: number;
  date: string | Date;
  notes?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISale extends Document {
  productId: Types.ObjectId | any;
  customerId: Types.ObjectId | any;
  purchaseId: Types.ObjectId | any; // Reference to the specific Batch/Lot
  quantity: number;
  rate: number;
  totalAmount: number;
  date: string | Date;
  notes?: string;
  isExtraSold: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILotSummary {
  lotId: string;
  productName: string;
  unitType: string;
  lotName: string;
  date: string;
  totalPurchased: number;
  sales: {
    customerName: string;
    quantity: number;
    date: string;
  }[];
  remainingStock: number;
  status: 'OK' | 'REMAINING' | 'EXTRA_SOLD';
}
