// Type definitions for RWA - safe to import in client components
// This file contains only types, no MongoDB imports

export interface Asset {
  assetId: string;
  name: string;
  location: string;
  totalShares: number;
  availableShares: number;
  pricePerShare: number; // in APT
  description: string;
  status: 'ACTIVE' | 'SOLD_OUT' | 'DELISTED';
  imageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Holding {
  userId: string;
  assetId: string;
  quantity: number;
  purchasePrice: number;
  purchaseDate: Date;
  transactionHash: string;
  _id?: string;
}

export interface Transaction {
  assetId: string;
  buyerUserId: string;
  quantity: number;
  totalPrice: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  transactionHash?: string;
  createdAt: Date;
  _id?: string;
}

