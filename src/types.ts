// ... (previous types)

export interface Party {
  id: string;
  title: string;
  date: Timestamp;
  location: string;
  organizerId: string;
  organizer: string;
  participants: Participant[];
  products: Product[];
  messages: Message[];
  createdAt: Timestamp;
  totalAmount?: number;
  status: 'upcoming' | 'in_payment' | 'in_preorder' | 'trying' | 'finalizing' | 'completed';
  payments: Payment[];
  appliedCoupon?: string;
}

export interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  images: string[];
  description: string;
  vendor: string;
  productType: string;
  selectedVariant: {
    size: string;
    color: string;
  };
  addedBy: string;
  addedAt: Timestamp;
  status?: 'pending' | 'kept' | 'returned';
}