export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'client' | 'vendor' | 'admin';
  createdAt: Date;
}

export interface Vendeur extends User {
  role: 'vendor';
  pavilion: string;
  room: string;
  isVerified: boolean;
  subscriptionStatus: 'active' | 'expired' | 'trial' | 'suspended';
  subscriptionEndDate: Date;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  stock: number;
  status: 'disponible' | 'epuise';
  vendorId: string;
  vendorName: string;
  vendorPhone: string;
  vendorPavilion: string;
  vendorRoom: string;
  isVendeurVerified: boolean;
  createdAt: Date;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  vendorId: string;
  products: CartItem[];
  message?: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}
