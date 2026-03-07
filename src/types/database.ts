// Database types matching our Supabase schema
export type AppRole = 'client' | 'vendor' | 'admin';
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'suspended';
export type OrderStatus = 'pending' | 'completed' | 'cancelled';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  created_at: string;
}

export interface VendorProfile {
  id: string;
  user_id: string;
  shop_name: string;
  pavilion: string;
  room: string;
  phone: string;
  description: string | null;
  is_verified: boolean;
  subscription_status: SubscriptionStatus;
  subscription_start_date: string;
  subscription_end_date: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  vendor_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  vendor?: VendorProfile;
  category?: Category;
}

export interface Order {
  id: string;
  client_id: string;
  vendor_id: string;
  status: OrderStatus;
  total_amount: number;
  message: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  vendor?: VendorProfile;
  client?: Profile;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
  // Joined data
  product?: Product;
}

export interface Favorite {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}
