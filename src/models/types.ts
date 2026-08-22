export interface Seller {
  id: string;
  name: string;
  code?: string;
  status: 'active' | 'inactive';
}

export interface Grade {
  id: string;
  name: string;
  price: number;
  badge?: string;
  color?: string;
}

export interface WeightEntry {
  gradeId: string;
  gradeName: string;
  price: number;
  weight: number;
  subtotal: number;
}

export interface DailyEntry {
  id: string;
  date: string; // "YYYY-MM-DD"
  sellerId: string;
  sellerName: string;
  entries: WeightEntry[];
  totalWeight: number;
  grandTotal: number;
  note?: string;
  createdAt: string; // ISO string
}
