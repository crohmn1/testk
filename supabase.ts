
import { createClient } from 'https://esm.sh/@supabase/supabase-js@^2.39.7';
import { Product, User, Order } from './types';

// Ambil variabel environment dari Netlify/Process
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper untuk Offline Support
const updateLocalCache = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const supabaseService = {
  getProducts: async (): Promise<Product[]> => {
    try {
      const { data, error } = await supabase.from('products').select('*').order('name');
      if (error) throw error;
      updateLocalCache('pos_products', data);
      return data as Product[];
    } catch (err) {
      console.warn("Offline: Mengambil data produk dari cache.");
      const saved = localStorage.getItem('pos_products');
      return saved ? JSON.parse(saved) : [];
    }
  },
  
  saveProduct: async (product: Product): Promise<void> => {
    // Upsert: update jika ID ada, insert jika tidak ada
    const { error } = await supabase.from('products').upsert({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      image_url: product.image_url
    });
    if (error) throw error;
  },

  deleteProduct: async (id: string): Promise<void> => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  },

  getUsers: async (): Promise<User[]> => {
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      updateLocalCache('pos_users', data);
      return data as User[];
    } catch (err) {
      const saved = localStorage.getItem('pos_users');
      return saved ? JSON.parse(saved) : [];
    }
  },

  saveUser: async (user: User): Promise<void> => {
    const { error } = await supabase.from('users').upsert(user);
    if (error) throw error;
  },

  deleteUser: async (id: string): Promise<void> => {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
  },

  createOrder: async (order: Order): Promise<void> => {
    // 1. Simpan Order
    const { error: orderError } = await supabase.from('orders').insert({
      receipt_number: order.receipt_number,
      user_id: order.user_id,
      user_name: order.user_name,
      total_amount: order.total_amount,
      discount: order.discount,
      items: order.items,
      created_at: order.created_at
    });
    if (orderError) throw orderError;

    // 2. Update Stok di database untuk setiap item
    for (const item of order.items) {
      // Kita ambil stok terbaru dulu agar akurat
      const { data: p } = await supabase.from('products').select('stock').eq('id', item.id).single();
      if (p) {
        await supabase.from('products').update({ stock: p.stock - item.quantity }).eq('id', item.id);
      }
    }
  },

  getOrders: async (): Promise<Order[]> => {
    try {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      updateLocalCache('pos_orders', data);
      return data as Order[];
    } catch (err) {
      const saved = localStorage.getItem('pos_orders');
      return saved ? JSON.parse(saved) : [];
    }
  }
};
