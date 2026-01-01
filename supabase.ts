
import { createClient } from '@supabase/supabase-js';
import { Product, User, Order } from './types';
import { INITIAL_PRODUCTS, INITIAL_USERS } from './constants';

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

const isSupabaseReady = SUPABASE_URL !== '' && SUPABASE_ANON_KEY !== '';
const supabase = isSupabaseReady ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const updateLocalCache = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const getLocalCache = (key: string) => {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : null;
};

// Inisialisasi data awal jika localStorage masih kosong
const initStorage = () => {
  if (!localStorage.getItem('pos_products')) {
    updateLocalCache('pos_products', INITIAL_PRODUCTS);
  }
  if (!localStorage.getItem('pos_users')) {
    updateLocalCache('pos_users', INITIAL_USERS);
  }
  if (!localStorage.getItem('pos_orders')) {
    updateLocalCache('pos_orders', []);
  }
};

initStorage();

export const supabaseService = {
  getProducts: async (): Promise<Product[]> => {
    if (!supabase) return getLocalCache('pos_products') || [];
    try {
      const { data, error } = await supabase.from('products').select('*').order('name');
      if (error) throw error;
      updateLocalCache('pos_products', data);
      return data as Product[];
    } catch (err) {
      return getLocalCache('pos_products') || [];
    }
  },
  
  saveProduct: async (product: Product): Promise<void> => {
    if (!supabase) {
      const prods = getLocalCache('pos_products') || [];
      const index = prods.findIndex((p: any) => p.id === product.id);
      if (index > -1) prods[index] = product;
      else prods.push(product);
      updateLocalCache('pos_products', prods);
      return;
    }
    const { error } = await supabase.from('products').upsert(product);
    if (error) throw error;
  },

  deleteProduct: async (id: string): Promise<void> => {
    if (!supabase) {
      const prods = (getLocalCache('pos_products') || []).filter((p: any) => p.id !== id);
      updateLocalCache('pos_products', prods);
      return;
    }
    await supabase.from('products').delete().eq('id', id);
  },

  getUsers: async (): Promise<User[]> => {
    if (!supabase) return getLocalCache('pos_users') || [];
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      updateLocalCache('pos_users', data);
      return data as User[];
    } catch (err) {
      return getLocalCache('pos_users') || [];
    }
  },

  saveUser: async (user: User): Promise<void> => {
    if (!supabase) {
      const users = getLocalCache('pos_users') || [];
      const index = users.findIndex((u: any) => u.id === user.id);
      if (index > -1) users[index] = user;
      else users.push(user);
      updateLocalCache('pos_users', users);
      return;
    }
    await supabase.from('users').upsert(user);
  },

  deleteUser: async (id: string): Promise<void> => {
    if (!supabase) {
      const users = (getLocalCache('pos_users') || []).filter((u: any) => u.id !== id);
      updateLocalCache('pos_users', users);
      return;
    }
    await supabase.from('users').delete().eq('id', id);
  },

  createOrder: async (order: Order): Promise<void> => {
    // Update stok lokal
    const prods = getLocalCache('pos_products') || [];
    order.items.forEach(item => {
      const pIndex = prods.findIndex((p: any) => p.id === item.id);
      if (pIndex > -1) prods[pIndex].stock -= item.quantity;
    });
    updateLocalCache('pos_products', prods);

    const orders = getLocalCache('pos_orders') || [];
    orders.unshift(order);
    updateLocalCache('pos_orders', orders);

    if (!supabase) return;

    try {
      const { error } = await supabase.from('orders').insert(order);
      if (error) throw error;
      
      for (const item of order.items) {
        const { data: p } = await supabase.from('products').select('stock').eq('id', item.id).single();
        if (p) {
          await supabase.from('products').update({ stock: p.stock - item.quantity }).eq('id', item.id);
        }
      }
    } catch (e) {
      console.error("Order saved locally, sync failed", e);
    }
  },

  getOrders: async (): Promise<Order[]> => {
    if (!supabase) return getLocalCache('pos_orders') || [];
    try {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      updateLocalCache('pos_orders', data);
      return data as Order[];
    } catch (err) {
      return getLocalCache('pos_orders') || [];
    }
  }
};
