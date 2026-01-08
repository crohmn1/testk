
import React, { useState, useMemo } from 'react';
import { CartItem, Customer, User } from '../types';
import CustomerForm from './CustomerForm';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onSetQuantity: (id: string, value: number) => void;
  onRemove: (id: string) => void;
  onCheckout: (discount: number, buyerName?: string, buyerPhone?: string, customerId?: string) => void;
  onReset: () => void;
  customers: Customer[];
  onSaveCustomer: (c: Customer) => void;
  currentUser: User;
}

const Cart: React.FC<CartProps> = ({ items, onUpdateQuantity, onSetQuantity, onRemove, onCheckout, onReset, customers, onSaveCustomer, currentUser }) => {
  const [discountPercent, setDiscountPercent] = useState(0);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showBuyerForm, setShowBuyerForm] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const total = Math.max(0, subtotal - discountAmount);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return [];
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
      c.phone.includes(customerSearch)
    ).slice(0, 5);
  }, [customers, customerSearch]);

  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    setBuyerName(c.name);
    setBuyerPhone(c.phone);
    setCustomerSearch('');
  };

  const handleCheckout = () => {
    onCheckout(discountAmount, buyerName, buyerPhone, selectedCustomer?.id);
    setBuyerName('');
    setBuyerPhone('');
    setSelectedCustomer(null);
    setDiscountPercent(0);
    setShowBuyerForm(false);
  };

  return (
    <div className="bg-white rounded-2xl border h-full flex flex-col overflow-hidden max-h-[85vh]">
      <div className="p-4 bg-gray-50 border-b flex justify-between items-center shrink-0">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <i className="fas fa-shopping-basket text-blue-600"></i> Keranjang
        </h2>
        {items.length > 0 && (
          <button 
            onClick={onReset} 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-red-500 bg-red-50 border border-red-100"
          >
            <i className="fas fa-trash-alt"></i> Kosongkan
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-gray-300 h-full min-h-[100px] border border-dashed border-gray-100 rounded-xl">
            <p className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2 opacity-60">
              <i className="fas fa-box-open text-xs"></i> Keranjang Kosong
            </p>
          </div>
        ) : (
          <>
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-4 pb-3 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-800 truncate text-xs md:text-sm leading-tight">{item.name}</h4>
                  <p className="text-blue-600 font-black text-[10px] md:text-xs mt-0.5">Rp{item.price.toLocaleString('id-ID')}</p>
                </div>
                
                <div className="flex items-center gap-0.5 bg-gray-50 rounded-xl p-0.5 h-fit shrink-0 border border-gray-100 ml-auto">
                  <button onClick={() => onUpdateQuantity(item.id, -1)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400">
                    <i className="fas fa-minus text-[8px]"></i>
                  </button>
                  <input type="number" inputMode="numeric" className="w-8 bg-transparent text-center font-black text-xs md:text-sm focus:outline-none text-gray-700" value={item.quantity} onChange={(e) => { const val = parseInt(e.target.value); if (!isNaN(val) && val >= 0) onSetQuantity(item.id, val); }} />
                  <button onClick={() => onUpdateQuantity(item.id, 1)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400">
                    <i className="fas fa-plus text-[8px]"></i>
                  </button>
                </div>

                <button onClick={() => onRemove(item.id)} className="text-gray-300 pl-1 pr-0 shrink-0"><i className="fas fa-times-circle text-base"></i></button>
              </div>
            ))}

            <div className="mt-4 pt-4 border-t border-gray-100">
              {selectedCustomer ? (
                <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Member Terpilih</p>
                    <p className="text-sm font-black text-amber-900">{selectedCustomer.name}</p>
                    <p className="text-[10px] text-amber-700">HP: {selectedCustomer.phone}</p>
                  </div>
                  <button onClick={() => { setSelectedCustomer(null); setBuyerName(''); setBuyerPhone(''); }} className="text-amber-400 hover:text-amber-600">
                    <i className="fas fa-times-circle"></i>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowBuyerForm(!showBuyerForm)}
                  className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-2 rounded-lg"
                >
                  <span><i className="fas fa-user-tag mr-2"></i> {showBuyerForm ? 'Sembunyikan Data Pembeli' : 'Tambah Data Pembeli'}</span>
                  <i className={`fas fa-chevron-${showBuyerForm ? 'up' : 'down'}`}></i>
                </button>
              )}
              
              {showBuyerForm && !selectedCustomer && (
                <div className="space-y-3 mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100 animate-in slide-in-from-top-2 duration-200">
                  <div className="relative">
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Cari / Input Member</label>
                    <div className="flex gap-2">
                       <input 
                        type="text" 
                        placeholder="Nama atau HP..." 
                        className="flex-1 bg-white border border-gray-200 px-3 py-2 rounded-lg text-xs font-bold outline-none" 
                        value={customerSearch} 
                        onChange={(e) => { setCustomerSearch(e.target.value); setBuyerName(e.target.value); }} 
                      />
                      <button 
                        onClick={() => setIsAddingCustomer(true)}
                        className="bg-emerald-50 text-emerald-600 px-3 py-2 rounded-lg text-xs font-black"
                        title="Daftar Member Baru"
                      >
                        <i className="fas fa-plus"></i>
                      </button>
                    </div>

                    {filteredCustomers.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden divide-y">
                        {filteredCustomers.map(c => (
                          <button 
                            key={c.id} 
                            onClick={() => handleSelectCustomer(c)}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 transition"
                          >
                            <p className="text-xs font-black text-gray-800">{c.name}</p>
                            <p className="text-[10px] text-gray-400">{c.phone}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Nomor HP</label>
                    <input type="tel" placeholder="0812..." className="w-full bg-white border border-gray-200 px-3 py-2 rounded-lg text-xs font-bold outline-none" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="p-4 bg-white border-t border-gray-100 space-y-4 shrink-0">
        <div className="space-y-2">
          <div className="flex justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Subtotal</span>
            <span>Rp {subtotal.toLocaleString()}</span>
          </div>
          
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Potongan Manual (%)</span>
            <div className="relative w-24">
              <input type="number" inputMode="numeric" placeholder="0" max="100" min="0" className="w-full px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-right text-xs font-black text-red-500 focus:outline-none pr-7" value={discountPercent || ''} onChange={(e) => { const val = Number(e.target.value); if (val >= 0 && val <= 100) setDiscountPercent(val); }} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-red-400 pointer-events-none">%</span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-dashed border-gray-200 flex justify-between items-center">
          <div>
            <span className="font-black text-gray-800 text-sm uppercase tracking-tighter block">Total Bayar</span>
          </div>
          <span className="text-2xl font-black text-blue-700">Rp {total.toLocaleString()}</span>
        </div>

        <button 
          disabled={items.length === 0}
          onClick={handleCheckout}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          <i className="fas fa-print"></i> 
          <span>SELESAI & CETAK</span>
        </button>
      </div>

      {isAddingCustomer && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-[2px]">
          <div className="bg-white rounded-[2rem] max-w-md w-full p-8 animate-in fade-in zoom-in duration-300 shadow-2xl">
             <CustomerForm 
              customer={null} 
              onClose={() => setIsAddingCustomer(false)} 
              onSave={(c) => { 
                c.created_by = currentUser.id;
                c.created_by_role = currentUser.role;
                onSaveCustomer(c); 
                handleSelectCustomer(c);
                setIsAddingCustomer(false); 
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
