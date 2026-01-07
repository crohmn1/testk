
import React, { useState, useEffect, useMemo } from 'react';
import { Role, User, Product, CartItem, Order } from './types';
import { supabaseService } from './supabase';
import { APP_CONFIG } from './constants';
import PinLogin from './components/PinLogin';
import Catalog from './components/Catalog';
import Cart from './components/Cart';
import AdminDashboard from './components/AdminDashboard';
import History from './components/History';
import Receipt from './components/Receipt';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'catalog' | 'admin' | 'history'>('catalog');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showReceipt, setShowReceipt] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [prods, ords] = await Promise.all([
        supabaseService.getProducts(),
        supabaseService.getOrders()
      ]);
      setProducts(prods);
      setOrders(ords);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleLogin = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setView('catalog');
  };

  const handleLogout = () => {
    setUser(null);
    setView('catalog');
    setCart([]);
  };

  const addToCart = (product: Product) => {
    if (!user || user.role === Role.GUDANG) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const setManualQuantity = (id: string, value: number) => {
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: value } : item
    ));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckout = async (discount: number = 0) => {
    if (!user || cart.length === 0) return;

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) - discount;
    const date = new Date();
    
    // Format: DDMMYYYYxxxx
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear().toString();
    const random = Math.floor(1000 + Math.random() * 9000);
    const receiptNum = `${d}${m}${y}${random}`;

    const newOrder: Order = {
      id: crypto.randomUUID(),
      receipt_number: receiptNum,
      user_id: user.id,
      user_name: user.name,
      total_amount: total,
      discount: discount,
      items: [...cart],
      created_at: new Date().toISOString()
    };

    await supabaseService.createOrder(newOrder);
    setOrders(prev => [newOrder, ...prev]);
    setProducts(await supabaseService.getProducts());
    setShowReceipt(newOrder);
    setCart([]);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-opacity-20 border-t-blue-600 mb-4"></div>
        <p className="text-gray-400 font-bold text-sm tracking-widest uppercase animate-pulse">Memuat SmartPOS...</p>
      </div>
    );
  }

  const canUseCart = user && user.role !== Role.GUDANG;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pb-20 md:pb-0">
      <header className="bg-white border-b sticky top-0 z-40 px-3 py-2.5 md:px-4 md:py-3 shadow-sm no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg md:text-2xl font-black text-blue-700 flex items-center gap-2 tracking-tight">
              <i className="fas fa-cash-register"></i> <span>SmartPOS</span>
            </h1>
            
            {user && (
              <nav className="hidden md:flex gap-1 ml-6">
                <button 
                  onClick={() => setView('catalog')}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition ${view === 'catalog' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  Katalog
                </button>
                <button 
                  onClick={() => setView('history')}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition ${view === 'history' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  Riwayat
                </button>
                {user.role === Role.ADMIN && (
                  <button 
                    onClick={() => setView('admin')}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition ${view === 'admin' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    Manajemen
                  </button>
                )}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!user ? (
              <button 
                onClick={() => (document.getElementById('login-modal') as any).showModal()}
                className="bg-blue-600 text-white px-4 py-1.5 md:px-6 md:py-2 rounded-full font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2 text-sm"
              >
                <i className="fas fa-lock text-xs"></i> Login
              </button>
            ) : (
              <div className="flex items-center gap-2 md:gap-4">
                <div className="text-right flex flex-col items-end">
                  <p className="font-bold text-gray-800 text-xs md:text-sm leading-tight">{user.name.split(' ')[0]}</p>
                  <p className="text-[8px] md:text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">{user.role}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="text-red-600 bg-red-50 p-2 md:px-3 md:py-2 rounded-lg hover:bg-red-100 transition font-bold text-xs"
                  title="Logout"
                >
                  <i className="fas fa-sign-out-alt"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-3 md:p-6 no-print">
        <div className="max-w-7xl mx-auto">
          {view === 'catalog' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
              <div className={canUseCart ? 'lg:col-span-8 order-2 lg:order-1' : 'lg:col-span-12'}>
                <Catalog products={products} onAddToCart={addToCart} user={user} />
              </div>
              {canUseCart && (
                <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit order-1 lg:order-2">
                  <Cart 
                    items={cart} 
                    onUpdateQuantity={updateCartQuantity} 
                    onSetQuantity={setManualQuantity}
                    onRemove={removeFromCart} 
                    onCheckout={handleCheckout}
                    onReset={() => setCart([])}
                  />
                </div>
              )}
            </div>
          )}
          {view === 'admin' && user?.role === Role.ADMIN && (
            <AdminDashboard 
              products={products} 
              onProductsChange={async () => setProducts(await supabaseService.getProducts())}
              orders={orders}
            />
          )}
          {view === 'history' && user && (
            <History orders={orders} user={user} onViewOrder={setShowReceipt} />
          )}
        </div>
      </main>

      {user && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-8 py-3 flex justify-between items-center z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] no-print">
          <button 
            onClick={() => setView('catalog')}
            className={`flex flex-col items-center gap-1 ${view === 'catalog' ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <i className="fas fa-th-large text-lg"></i>
            <span className="text-[9px] font-bold">Katalog</span>
          </button>
          <button 
            onClick={() => setView('history')}
            className={`flex flex-col items-center gap-1 ${view === 'history' ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <i className="fas fa-history text-lg"></i>
            <span className="text-[9px] font-bold">Riwayat</span>
          </button>
          {user.role === Role.ADMIN && (
            <button 
              onClick={() => setView('admin')}
              className={`flex flex-col items-center gap-1 ${view === 'admin' ? 'text-blue-600' : 'text-gray-400'}`}
            >
              <i className="fas fa-cog text-lg"></i>
              <span className="text-[9px] font-bold">Menu</span>
            </button>
          )}
        </div>
      )}

      <dialog id="login-modal" className="modal p-0 rounded-2xl shadow-2xl backdrop:bg-black/60 no-print">
        <div className="w-[320px] md:w-[400px]">
          <PinLogin onLogin={handleLogin} onCancel={() => (document.getElementById('login-modal') as any).close()} />
        </div>
      </dialog>

      {showReceipt && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 no-print">
          <div className="bg-white rounded-xl max-w-[340px] w-full p-5 shadow-2xl animate-in zoom-in duration-200">
            <div className="max-h-[70vh] overflow-y-auto">
              <Receipt order={showReceipt} />
            </div>
            <div className="mt-6 flex gap-2">
              <button 
                onClick={() => window.print()}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition text-sm"
              >
                Cetak Nota
              </button>
              <button 
                onClick={() => setShowReceipt(null)}
                className="flex-1 border border-gray-300 py-3 rounded-lg font-bold text-gray-600 hover:bg-gray-50 transition text-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Area Khusus Print */}
      <div id="print-area" className="hidden">
        {showReceipt && <Receipt order={showReceipt} />}
      </div>
    </div>
  );
};

export default App;