
import React from 'react';
import { Order } from '../types';

interface ReceiptProps {
  order: Order;
}

const Receipt: React.FC<ReceiptProps> = ({ order }) => {
  const dateStr = new Date(order.created_at).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const subtotal = order.total_amount + order.discount;
  const discountPercent = subtotal > 0 ? Math.round((order.discount / subtotal) * 100) : 0;

  return (
    <div className="text-gray-800 font-mono text-sm leading-tight p-2">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold uppercase">NOTA</h2>
      </div>

      <div className="border-b border-dashed py-3 space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Nota:</span>
          <span className="font-bold">{order.receipt_number}</span>
        </div>
        <div className="flex justify-between">
          <span>Kasir:</span>
          <span>{order.user_name}</span>
        </div>
        <div className="flex justify-between">
          <span>Tanggal:</span>
          <span>{dateStr}</span>
        </div>
        
        {/* Buyer Info */}
        {(order.buyer_name || order.buyer_phone) && (
          <div className="mt-2 pt-2 border-t border-gray-100 border-dotted">
            {order.buyer_name && (
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span className="font-bold">{order.buyer_name}</span>
              </div>
            )}
            {order.buyer_phone && (
              <div className="flex justify-between">
                <span>No. HP:</span>
                <span>{order.buyer_phone}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <table className="w-full my-4 text-xs">
        <thead className="border-b border-gray-200">
          <tr>
            <th className="text-left py-2 font-normal">Item</th>
            <th className="text-center py-2 font-normal">Qty</th>
            <th className="text-right py-2 font-normal">Sub</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {order.items.map((item, idx) => (
            <tr key={idx}>
              <td className="py-2">
                <p className="font-semibold">{item.name}</p>
                <p className="text-[10px] text-gray-500">Rp {item.price.toLocaleString()}</p>
              </td>
              <td className="text-center py-2">{item.quantity}</td>
              <td className="text-right py-2">Rp {(item.price * item.quantity).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-dashed pt-3 space-y-1">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>Rp {subtotal.toLocaleString()}</span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Diskon ({discountPercent}%)</span>
            <span>- Rp {order.discount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg pt-2">
          <span>TOTAL</span>
          <span>Rp {order.total_amount.toLocaleString()}</span>
        </div>
      </div>

      <div className="text-center mt-8 pt-4 border-t border-gray-100">
        <p className="text-[10px] text-gray-500">Terima kasih telah berbelanja!</p>
      </div>
    </div>
  );
};

export default Receipt;
