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
  productId: Types.ObjectId;
  vendorId: Types.ObjectId;
  quantity: number;
  rate: number;
  totalAmount: number;
  date: Date;
  notes?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISale extends Document {
  productId: Types.ObjectId;
  customerId: Types.ObjectId;
  quantity: number;
  rate: number;
  totalAmount: number;
  date: Date;
  notes?: string;
  isExtraSold: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
