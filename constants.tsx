
import { Role, Product, User } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Premium Coffee Bean', category: 'Coffee', price: 150000, stock: 45, image_url: 'https://picsum.photos/seed/coffee/200' },
  { id: '2', name: 'Fresh Milk 1L', category: 'Dairy', price: 25000, stock: 120, image_url: 'https://picsum.photos/seed/milk/200' },
  { id: '3', name: 'Organic Matcha Powder', category: 'Tea', price: 210000, stock: 15, image_url: 'https://picsum.photos/seed/matcha/200' },
  { id: '4', name: 'Dark Chocolate Bar', category: 'Snacks', price: 45000, stock: 60, image_url: 'https://picsum.photos/seed/choc/200' },
  { id: '5', name: 'Eco-friendly Cup', category: 'Misc', price: 5000, stock: 500, image_url: 'https://picsum.photos/seed/cup/200' },
  { id: '6', name: 'Baguette', category: 'Bakery', price: 18000, stock: 30, image_url: 'https://picsum.photos/seed/bread/200' },
  { id: '7', name: 'Croissant', category: 'Bakery', price: 12000, stock: 40, image_url: 'https://picsum.photos/seed/croissant/200' },
  { id: '8', name: 'Espresso Machine Cleaner', category: 'Misc', price: 85000, stock: 20, image_url: 'https://picsum.photos/seed/cleaner/200' },
  { id: '9', name: 'Iced Tea Syrup', category: 'Beverage', price: 32000, stock: 85, image_url: 'https://picsum.photos/seed/syrup/200' },
  { id: '10', name: 'Paper Napkins (Pack)', category: 'Misc', price: 15000, stock: 150, image_url: 'https://picsum.photos/seed/napkin/200' },
  { id: '11', name: 'Caramel Sauce', category: 'Beverage', price: 42000, stock: 12, image_url: 'https://picsum.photos/seed/caramel/200' },
  { id: '12', name: 'Almond Milk', category: 'Dairy', price: 38000, stock: 24, image_url: 'https://picsum.photos/seed/almond/200' },
];

export const INITIAL_USERS: User[] = [
  { id: 'admin-1', name: 'System Admin', pin: '1234', role: Role.ADMIN },
  { id: 'cashier-1', name: 'Ani Kasir', pin: '0000', role: Role.KASIR },
  { id: 'sales-1', name: 'Budi Sales', pin: '1111', role: Role.SALES },
  { id: 'gudang-1', name: 'Gudang Master', pin: '2222', role: Role.GUDANG },
];

export const APP_CONFIG = {
  PAGE_SIZE: 10,
  HISTORY_LIMIT: 100,
};
