export interface CartItem {
  // id?: number; // Removed as not in proto, and not a primary key for an item in a cart
  productId: string; // Changed to string to match proto
  quantity: number;
  // Denormalized product data, matching cart.proto
  name: string;
  priceCents: number;
  imageUrl: string;
}

export interface Cart {
  id: number;
  userId: number;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}

// CartDetails can now just extend Cart, as CartItem is already enriched
export interface CartDetails extends Cart {
  totalPriceCents: number; // Renamed to match cents convention
  subtotalCents: number;
  totalDiscountCents: number;
  totalTaxCents: number;
}
