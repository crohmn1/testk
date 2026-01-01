
import React, { useState } from 'react';
import { CartItem } from '../types';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: (discount: number) => void;
  onReset: () => void;
}

const Cart: React.FC<CartProps> = ({ items, onUpdateQuantity, onRemove, onCheckout, onReset }) => {
  const [discount, setDiscount] = useState(0);
  
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = Math.max(0, subtotal - discount);

  return (
    <div className="bg-white rounded-2xl shadow-lg border h-full flex flex-col overflow-hidden max-h-[85vh]">
      <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <i className="fas fa-shopping-basket text-blue-600"></i> Keranjang
        </h2>
        <button onClick={onReset} className="text-xs text-red-500 hover:underline">Reset</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
            <i className="fas fa-box-open text-4xl mb-4"></i>
            <p>Belum ada item</p>
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className="flex gap-3 pb-4 border-b">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 line-clamp-1">{item.name}</h4>
                <p className="text-blue-600 font-bold">Rp {item.price.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button onClick={() => onUpdateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded transition">
                  <i className="fas fa-minus text-xs"></i>
                </button>
                <span className="w-6 text-center font-bold">{item.quantity}</span>
                <button onClick={() => onUpdateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded transition">
                  <i className="fas fa-plus text-xs"></i>
                </button>
              </div>
              <button onClick={() => onRemove(item.id)} className="text-gray-300 hover:text-red-500 transition px-2">
                <i className="fas fa-trash-alt"></i>
              </button>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-gray-50 border-t space-y-3">
        <div className="flex justify-between text-gray-600 text-sm">
          <span>Subtotal</span>
          <span>Rp {subtotal.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-gray-600">Diskon</span>
          <div className="relative w-32">
            <span className="absolute left-2 top-2 text-xs text-gray-400">Rp</span>
            <input 
              type="number" 
              className="w-full pl-8 pr-2 py-1 border rounded text-right text-sm"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="pt-2 border-t flex justify-between items-center">
          <span className="font-bold text-gray-800">Total</span>
          <span className="text-2xl font-black text-blue-700">Rp {total.toLocaleString()}</span>
        </div>
        <button 
          disabled={items.length === 0}
          onClick={() => onCheckout(discount)}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          <i className="fas fa-print"></i> Bayar & Cetak
        </button>
      </div>
    </div>
  );
};

export default Cart;
