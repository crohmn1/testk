
export enum Role {
  ADMIN = 'Admin',
  KASIR = 'Kasir',
  SALES = 'Sales',
  GUDANG = 'Gudang'
}

export interface User {
  id: string;
  name: string;
  pin: string;
  role: Role;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image_url: string;
}

export interface CartItem extends Pick<Product, 'id' | 'name' | 'price'> {
  quantity: number;
}

export interface Order {
  id: string;
  receipt_number: string;
  user_id: string;
  user_name: string;
  total_amount: number;
  discount: number;
  items: CartItem[];
  created_at: string;
  buyer_name?: string;
  buyer_phone?: string;
}

export interface SalesReport {
  total_revenue: number;
  order_count: number;
  avg_order_value: number;
  user_stats: { [userName: string]: number };
}
