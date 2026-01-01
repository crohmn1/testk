
import React, { useState, useMemo } from 'react';
import { Order, User, Role } from '../types';

interface HistoryProps {
  orders: Order[];
  user: User;
  onViewOrder: (order: Order) => void;
}

const History: React.FC<HistoryProps> = ({ orders, user, onViewOrder }) => {
  const [filterDate, setFilterDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
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

    // Filter by receipt number (Search)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(o => o.receipt_number.toLowerCase().includes(query));
    }

    return result.slice(0, 100); // Limit to 100
  }, [orders, user, filterDate, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-col md:flex-row gap-4 items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">
          Riwayat {user.role !== Role.ADMIN && user.role !== Role.GUDANG && '(Milik Saya)'}
        </h2>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-48 md:w-64">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input 
              type="text" 
              placeholder="Cari Nota..." 
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input 
              type="date" 
              className="w-full sm:w-auto border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-xs font-black text-gray-400 uppercase tracking-widest">No. Nota</th>
                <th className="px-6 py-3 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Total</th>
                <th className="px-6 py-3 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-gray-400 italic text-sm">Tidak ada riwayat</td>
                </tr>
              ) : (
                filtered.map(o => (
                  <tr 
                    key={o.id} 
                    onClick={() => onViewOrder(o)}
                    className="hover:bg-blue-50/50 cursor-pointer transition group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-blue-600 group-hover:text-blue-700">{o.receipt_number}</span>
                        <span className="text-[10px] text-gray-400 font-medium md:hidden">{new Date(o.created_at).toLocaleDateString('id-ID')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-gray-700 text-[11px] md:text-xs whitespace-nowrap">
                        Rp {o.total_amount.toLocaleString('id-ID')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="bg-blue-50 text-blue-600 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition">
                        <i className="fas fa-eye text-xs"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">
        <i className="fas fa-info-circle mr-1"></i> Klik baris untuk detail & cetak
      </p>
    </div>
  );
};

export default History;
