
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

// Metadata for RBAC support in Customer management (points removed)
export interface Customer {
  id: string;
  name: string;
  phone: string;
  total_spent: number;
  created_at: string;
  created_by: string;      // ID User pembuat
  created_by_role: Role;   // Role pembuat
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
  customer_id?: string; // Link to customer table if member
}

export interface SalesReport {
  total_revenue: number;
  order_count: number;
  avg_order_value: number;
  user_stats: { [userName: string]: number };
}
