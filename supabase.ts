
import { INITIAL_PRODUCTS, INITIAL_USERS } from './constants';
import { Product, User, Order, Role } from './types';

// Mock Supabase logic for demonstration as we cannot configure actual keys here
// In production, the user would provide SUPABASE_URL and SUPABASE_ANON_KEY
const getLocalData = <T,>(key: string, initial: T): T => {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : initial;
};

const saveLocalData = <T,>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const supabaseService = {
  getProducts: async (): Promise<Product[]> => {
    // Offline support: always sync products to local storage
    const products = getLocalData('pos_products', INITIAL_PRODUCTS);
    return products;
  },
  
  saveProduct: async (product: Product): Promise<void> => {
    const products = getLocalData('pos_products', INITIAL_PRODUCTS);
    const index = products.findIndex(p => p.id === product.id);
    if (index > -1) {
      products[index] = product;
    } else {
      products.push(product);
    }
    saveLocalData('pos_products', products);
  },

  deleteProduct: async (id: string): Promise<void> => {
    const products = getLocalData('pos_products', INITIAL_PRODUCTS);
    const filtered = products.filter(p => p.id !== id);
    saveLocalData('pos_products', filtered);
  },

  getUsers: async (): Promise<User[]> => {
    return getLocalData('pos_users', INITIAL_USERS);
  },

  saveUser: async (user: User): Promise<void> => {
    const users = getLocalData('pos_users', INITIAL_USERS);
    const index = users.findIndex(u => u.id === user.id);
    if (index > -1) {
      users[index] = user;
    } else {
      users.push(user);
    }
    saveLocalData('pos_users', users);
  },

  deleteUser: async (id: string): Promise<void> => {
    const users = getLocalData('pos_users', INITIAL_USERS);
    const filtered = users.filter(u => u.id !== id);
    saveLocalData('pos_users', filtered);
  },

  createOrder: async (order: Order): Promise<void> => {
    const orders = getLocalData('pos_orders', [] as Order[]);
    orders.unshift(order);
    saveLocalData('pos_orders', orders);

    // Update stocks
    const products = getLocalData('pos_products', INITIAL_PRODUCTS);
    order.items.forEach(item => {
      const p = products.find(prod => prod.id === item.id);
      if (p) p.stock -= item.quantity;
    });
    saveLocalData('pos_products', products);
  },

  getOrders: async (): Promise<Order[]> => {
    return getLocalData('pos_orders', [] as Order[]);
  }
};
