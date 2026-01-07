
import React, { useState, useEffect, useRef } from 'react';
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
  
  // States for Smart Auto-Hide
  const [isDockVisible, setIsDockVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  // Handle Smart Auto-Hide Logic
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const currentScrollY = scrollContainerRef.current.scrollTop;
    const scrollDiff = currentScrollY - lastScrollY.current;

    // Selalu tampilkan jika di paling atas
    if (currentScrollY < 10) {
      setIsDockVisible(true);
    } 
    // Sembunyikan jika scroll ke bawah lebih dari 10px
    else if (scrollDiff > 10 && isDockVisible) {
      setIsDockVisible(false);
    } 
    // Tampilkan jika scroll ke atas lebih dari 10px
    else if (scrollDiff < -10 && !isDockVisible) {
      setIsDockVisible(true);
    }

    lastScrollY.current = currentScrollY;
  };

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

  const handleCheckout = async (discount: number = 0, buyerName?: string, buyerPhone?: string) => {
    if (!user || cart.length === 0) return;

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) - discount;
    const date = new Date();
    
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
      created_at: new Date().toISOString(),
      buyer_name: buyerName || undefined,
      buyer_phone: buyerPhone || undefined
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
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <header className="bg-white border-b shrink-0 z-40 px-3 py-2.5 md:px-4 md:py-3 shadow-sm no-print">
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

      <main 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto p-3 md:p-6 no-print scroll-smooth"
      >
        <div className="max-w-7xl mx-auto">
          {view === 'catalog' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 pb-20 md:pb-0">
              <div className={canUseCart ? 'lg:col-span-8 order-2 lg:order-1' : 'lg:col-span-12'}>
                <Catalog products={products} onAddToCart={addToCart} user={user} />
              </div>
              {canUseCart && (
                <div className="lg:col-span-4 lg:sticky lg:top-0 h-fit order-1 lg:order-2">
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
            <div className="pb-24 md:pb-0">
              <AdminDashboard 
                products={products} 
                onProductsChange={async () => setProducts(await supabaseService.getProducts())}
                orders={orders}
              />
            </div>
          )}
          {view === 'history' && user && (
            <div className="pb-24 md:pb-0">
              <History orders={orders} user={user} onViewOrder={setShowReceipt} />
            </div>
          )}
        </div>
      </main>

      {/* Floating Pill Dock Navigation with Smart Auto-Hide */}
      {user && (
        <div 
          className={`md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-50 no-print px-4 w-auto transition-all duration-500 ease-in-out ${
            isDockVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-24 opacity-0 scale-90'
          }`}
        >
          <div className="bg-white/80 backdrop-blur-xl p-1.5 rounded-full flex items-center gap-1 shadow-[0_15px_40px_rgba(37,99,235,0.15)] border border-white">
            <button 
              onClick={() => { setView('catalog'); scrollContainerRef.current?.scrollTo(0,0); }}
              className={`relative flex items-center justify-center h-12 rounded-full transition-all duration-500 overflow-hidden ${
                view === 'catalog' 
                  ? 'bg-blue-600 text-white px-6 w-auto shadow-lg shadow-blue-400/20' 
                  : 'text-blue-300/60 w-12 hover:text-blue-600'
              }`}
            >
              <i className="fas fa-th-large text-lg shrink-0"></i>
              <span className={`ml-2 text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all duration-300 ${view === 'catalog' ? 'opacity-100' : 'opacity-0 w-0 absolute'}`}>
                Katalog
              </span>
            </button>
            
            <button 
              onClick={() => { setView('history'); scrollContainerRef.current?.scrollTo(0,0); }}
              className={`relative flex items-center justify-center h-12 rounded-full transition-all duration-500 overflow-hidden ${
                view === 'history' 
                  ? 'bg-blue-600 text-white px-6 w-auto shadow-lg shadow-blue-400/20' 
                  : 'text-blue-300/60 w-12 hover:text-blue-600'
              }`}
            >
              <i className="fas fa-history text-lg shrink-0"></i>
              <span className={`ml-2 text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all duration-300 ${view === 'history' ? 'opacity-100' : 'opacity-0 w-0 absolute'}`}>
                Riwayat
              </span>
            </button>
            
            {user.role === Role.ADMIN && (
              <button 
                onClick={() => { setView('admin'); scrollContainerRef.current?.scrollTo(0,0); }}
                className={`relative flex items-center justify-center h-12 rounded-full transition-all duration-500 overflow-hidden ${
                  view === 'admin' 
                    ? 'bg-blue-600 text-white px-6 w-auto shadow-lg shadow-blue-400/20' 
                    : 'text-blue-300/60 w-12 hover:text-blue-600'
                }`}
              >
                <i className="fas fa-cog text-lg shrink-0"></i>
                <span className={`ml-2 text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all duration-300 ${view === 'admin' ? 'opacity-100' : 'opacity-0 w-0 absolute'}`}>
                  Admin
                </span>
              </button>
            )}
          </div>
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

      <div id="print-area" className="hidden">
        {showReceipt && <Receipt order={showReceipt} />}
      </div>
    </div>
  );
};

export default App;
