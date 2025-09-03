// Order and payment related types

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded';
export type PaymentMethod = 'stripe' | 'paypal' | 'bank_transfer' | 'cash';
export type ItemType = 'course' | 'content' | 'book';
export type AccessType = 'lifetime' | 'subscription' | 'rental';

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method?: PaymentMethod;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  stripe_payment_intent_id?: string;
  stripe_session_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  order_items?: OrderItem[];
  user?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_type: ItemType;
  item_id: string;
  item_title: string;
  quantity: number;
  price: number;
  discount_amount: number;
  total: number;
  created_at: string;
  
  // Relations
  order?: Order;
  course?: any;
  content?: any;
}

export interface UserPurchase {
  id: string;
  user_id: string;
  item_type: ItemType;
  item_id: string;
  order_id?: string;
  purchase_date: string;
  expiry_date?: string;
  access_type: AccessType;
  is_active: boolean;
  created_at: string;
  
  // Relations
  order?: Order;
  course?: any;
  content?: any;
}

export interface ShoppingCartItem {
  id: string;
  user_id: string;
  item_type: ItemType;
  item_id: string;
  quantity: number;
  added_at: string;
  
  // Relations
  course?: any;
  content?: any;
}

// Checkout related types
export interface CheckoutSession {
  items: CheckoutItem[];
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  currency: string;
  payment_method?: PaymentMethod;
}

export interface CheckoutItem {
  item_type: ItemType;
  item_id: string;
  item_title: string;
  price: number;
  quantity: number;
  discount_amount: number;
  total: number;
}

// Price display helpers
export interface PriceDisplay {
  amount: number;
  currency: string;
  formatted: string;
  has_discount: boolean;
  discount_percentage?: number;
  original_price?: number;
  sale_price?: number;
}