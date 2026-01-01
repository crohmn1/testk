
import React, { useState, useMemo } from 'react';
import { Order, User, Role } from '../types';

interface HistoryProps {
  orders: Order[];
  user: User;
  onViewOrder: (order: Order) => void;
}

const History: React.FC<HistoryProps> = ({ orders, user, onViewOrder }) => {
  const [filterDate, setFilterDate] = useState('');
  
  const filtered = useMemo(() => {
    let result = orders;
    
    // Filter by role: Admin and Gudang see all, others see only theirs
    const canSeeAll = user.role === Role.ADMIN || user.role === Role.GUDANG;
    
    if (!canSeeAll) {
      result = result.filter(o => o.user_id === user.id);
    }

    // Filter by date
    if (filterDate) {
      result = result.filter(o => o.created_at.startsWith(filterDate));
    }

    return result.slice(0, 100); // Limit to 100
  }, [orders, user, filterDate]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-col md:flex-row gap-4 items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">
          Riwayat Pesanan {user.role !== Role.ADMIN && user.role !== Role.GUDANG && '(Milik Saya)'}
        </h2>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-500">Filter Tanggal:</label>
          <input 
            type="date" 
            className="border border-gray-200 rounded-lg px-4 py-2 bg-gray-50"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">No. Nota</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Total</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400 italic">Tidak ada riwayat ditemukan</td>
                </tr>
              ) : (
                filtered.map(o => (
                  <tr 
                    key={o.id} 
                    onClick={() => onViewOrder(o)}
                    className="hover:bg-blue-50/50 cursor-pointer transition group"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-blue-600 group-hover:text-blue-700">{o.receipt_number}</td>
                    <td className="px-6 py-4 text-gray-600">{new Date(o.created_at).toLocaleDateString('id-ID')}</td>
                    <td className="px-6 py-4 text-gray-600">{o.user_name}</td>
                    <td className="px-6 py-4 text-gray-600">{o.items.length} item</td>
                    <td className="px-6 py-4 text-right font-black text-gray-800">Rp {o.total_amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-gray-400 group-hover:text-blue-600 transition">
                        <i className="fas fa-eye"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-center text-xs text-gray-400 italic mt-2">
        <i className="fas fa-info-circle mr-1"></i> Klik pada baris pesanan untuk melihat detail dan cetak nota.
      </p>
    </div>
  );
};

export default History;
