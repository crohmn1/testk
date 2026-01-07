
import React, { useState } from 'react';
import { CartItem } from '../types';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onSetQuantity: (id: string, value: number) => void;
  onRemove: (id: string) => void;
  onCheckout: (discount: number, buyerName?: string, buyerPhone?: string) => void;
  onReset: () => void;
}

const Cart: React.FC<CartProps> = ({ items, onUpdateQuantity, onSetQuantity, onRemove, onCheckout, onReset }) => {
  const [discountPercent, setDiscountPercent] = useState(0);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [showBuyerForm, setShowBuyerForm] = useState(false);
  
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const total = Math.max(0, subtotal - discountAmount);

  const handleCheckout = () => {
    onCheckout(discountAmount, buyerName, buyerPhone);
    // Reset form after checkout
    setBuyerName('');
    setBuyerPhone('');
    setDiscountPercent(0);
    setShowBuyerForm(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border h-full flex flex-col overflow-hidden max-h-[85vh]">
      <div className="p-4 bg-gray-50 border-b flex justify-between items-center shrink-0">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <i className="fas fa-shopping-basket text-blue-600"></i> Keranjang
        </h2>
        {items.length > 0 && (
          <button 
            onClick={onReset} 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-red-500 bg-red-50 hover:bg-red-100 transition active:scale-95 border border-red-100"
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
              <div key={item.id} className="flex items-center gap-4 pb-3 border-b border-gray-50 last:border-0 group">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-800 truncate text-xs md:text-sm leading-tight">{item.name}</h4>
                  <p className="text-blue-600 font-black text-[10px] md:text-xs mt-0.5">Rp{item.price.toLocaleString('id-ID')}</p>
                </div>
                
                <div className="flex items-center gap-0.5 bg-gray-50 rounded-xl p-0.5 h-fit shrink-0 border border-gray-100 ml-auto">
                  <button 
                    onClick={() => onUpdateQuantity(item.id, -1)} 
                    className="w-7 h-7 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-lg transition text-gray-400 hover:text-red-500"
                  >
                    <i className="fas fa-minus text-[8px]"></i>
                  </button>
                  
                  <input 
                    type="number"
                    inputMode="numeric"
                    className="w-8 bg-transparent text-center font-black text-xs md:text-sm focus:outline-none text-gray-700"
                    value={item.quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val >= 0) {
                        onSetQuantity(item.id, val);
                      } else if (e.target.value === '') {
                        onSetQuantity(item.id, 0);
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '' || parseInt(e.target.value) === 0) {
                        onSetQuantity(item.id, 1);
                      }
                    }}
                  />
                  
                  <button 
                    onClick={() => onUpdateQuantity(item.id, 1)} 
                    className="w-7 h-7 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-lg transition text-gray-400 hover:text-blue-600"
                  >
                    <i className="fas fa-plus text-[8px]"></i>
                  </button>
                </div>

                <button 
                  onClick={() => onRemove(item.id)} 
                  className="text-gray-300 hover:text-red-500 transition pl-1 pr-0 shrink-0"
                  title="Hapus"
                >
                  <i className="fas fa-times-circle text-base"></i>
                </button>
              </div>
            ))}

            {/* Buyer Info Toggle */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button 
                onClick={() => setShowBuyerForm(!showBuyerForm)}
                className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition"
              >
                <span><i className="fas fa-user-tag mr-2"></i> {showBuyerForm ? 'Sembunyikan Data Pembeli' : 'Tambah Data Pembeli'}</span>
                <i className={`fas fa-chevron-${showBuyerForm ? 'up' : 'down'}`}></i>
              </button>
              
              {showBuyerForm && (
                <div className="space-y-3 mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100 animate-in slide-in-from-top-2 duration-200">
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Nama Pembeli</label>
                    <input 
                      type="text"
                      placeholder="Masukkan nama..."
                      className="w-full bg-white border border-gray-200 px-3 py-2 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Nomor HP</label>
                    <input 
                      type="tel"
                      placeholder="0812..."
                      className="w-full bg-white border border-gray-200 px-3 py-2 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="p-4 bg-white border-t border-gray-100 space-y-4 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] shrink-0">
        <div className="space-y-2">
          <div className="flex justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Subtotal</span>
            <span>Rp {subtotal.toLocaleString()}</span>
          </div>
          
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Potongan/Diskon (%)</span>
            <div className="relative w-24">
              <input 
                type="number" 
                inputMode="numeric"
                placeholder="0"
                max="100"
                min="0"
                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-right text-xs font-black text-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none transition pr-7"
                value={discountPercent || ''}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val >= 0 && val <= 100) setDiscountPercent(val);
                }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-red-400 pointer-events-none">%</span>
            </div>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-red-400 text-[10px] font-medium italic">
              <span>Nilai Diskon</span>
              <span>- Rp {discountAmount.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-dashed border-gray-200 flex justify-between items-center">
          <span className="font-black text-gray-800 text-sm uppercase tracking-tighter">Total Bayar</span>
          <span className="text-2xl font-black text-blue-700">Rp {total.toLocaleString()}</span>
        </div>

        <button 
          disabled={items.length === 0}
          onClick={handleCheckout}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 shadow-lg shadow-blue-100 transition disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-95"
        >
          <i className="fas fa-print"></i> 
          <span>SELESAI & CETAK</span>
        </button>
      </div>
    </div>
  );
};

export default Cart;
