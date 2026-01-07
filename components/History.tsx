
import React, { useState, useMemo } from 'react';
import { Order, User, Role } from '../types';

interface HistoryProps {
  orders: Order[];
  user: User;
  onViewOrder: (order: Order) => void;
}

const History: React.FC<HistoryProps> = ({ orders, user, onViewOrder }) => {
  const [filterDate, setFilterDate] = useState('');
  const [filterUser, setFilterUser] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);
  
  const staffList = useMemo(() => {
    const names = new Set(orders.map(o => o.user_name));
    return Array.from(names).sort();
  }, [orders]);

  const filtered = useMemo(() => {
    let result = orders;
    const canSeeAll = user.role === Role.ADMIN || user.role === Role.GUDANG;
    if (!canSeeAll) result = result.filter(o => o.user_id === user.id);
    if (canSeeAll && filterUser !== 'all') result = result.filter(o => o.user_name === filterUser);
    if (filterDate) result = result.filter(o => o.created_at.split('T')[0] === filterDate);
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(o => o.receipt_number.toLowerCase().includes(query) || (o.buyer_name && o.buyer_name.toLowerCase().includes(query)));
    }
    return result;
  }, [orders, user, filterDate, filterUser, searchQuery]);

  const displayData = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  const handleLoadMore = () => setVisibleCount(prev => prev + 20);

  const handleReset = () => {
    setFilterDate('');
    setFilterUser('all');
    setSearchQuery('');
    setVisibleCount(20);
  };

  const isFiltered = filterDate || searchQuery || (filterUser !== 'all');
  const canSeeStaffFilter = user.role === Role.ADMIN || user.role === Role.GUDANG;

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-gray-800">
            Riwayat {!canSeeStaffFilter && '(Milik Saya)'}
          </h2>
          {isFiltered && (
            <p className="text-[10px] text-blue-600 font-bold uppercase mt-1">
              <i className="fas fa-filter mr-1"></i> Filter Aktif
            </p>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-48 md:w-64">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input 
              type="text" 
              placeholder="Cari Nota / Nama..." 
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none text-sm"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(20); }}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {canSeeStaffFilter && (
              <select 
                className="flex-1 sm:flex-none border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-sm focus:outline-none font-medium"
                value={filterUser}
                onChange={(e) => { setFilterUser(e.target.value); setVisibleCount(20); }}
              >
                <option value="all">Semua Karyawan</option>
                {staffList.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            )}
            <input 
              type="date" 
              className="flex-1 sm:flex-none border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-sm focus:outline-none font-medium"
              value={filterDate}
              onChange={(e) => { setFilterDate(e.target.value); setVisibleCount(20); }}
            />
            {isFiltered && (
              <button onClick={handleReset} className="p-2.5 text-red-500 bg-red-50 rounded-lg" title="Reset Filter">
                <i className="fas fa-times-circle"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-xs font-black text-gray-400 uppercase tracking-widest">No. Nota & Pembeli</th>
                <th className="px-6 py-3 text-xs font-black text-gray-400 uppercase tracking-widest">Petugas</th>
                <th className="px-6 py-3 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Total</th>
                <th className="px-6 py-3 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {displayData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic text-sm">
                    {isFiltered ? 'Tidak ada data yang cocok dengan filter' : 'Tidak ada riwayat'}
                  </td>
                </tr>
              ) : (
                displayData.map(o => (
                  <tr key={o.id} onClick={() => onViewOrder(o)} className="hover:bg-blue-50/50 cursor-pointer transition group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-blue-600 group-hover:text-blue-700">{o.receipt_number}</span>
                        {o.buyer_name && <span className="text-[10px] font-bold text-gray-600 mt-1 flex items-center gap-1"><i className="fas fa-user text-[8px]"></i> {o.buyer_name}</span>}
                        <span className="text-[9px] text-gray-400 font-medium mt-0.5">{new Date(o.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {new Date(o.created_at).toLocaleDateString('id-ID')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-[10px] font-black">{o.user_name.charAt(0)}</div>
                        <span className="text-[11px] font-bold text-gray-700">{o.user_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right"><span className="font-bold text-gray-700 text-[11px] md:text-xs whitespace-nowrap">Rp {o.total_amount.toLocaleString('id-ID')}</span></td>
                    <td className="px-6 py-4 text-center"><button className="bg-blue-50 text-blue-600 w-8 h-8 rounded-lg flex items-center justify-center"><i className="fas fa-eye text-xs"></i></button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-gray-50 border-t flex flex-col items-center gap-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{filtered.length > 0 ? `Menampilkan ${displayData.length} dari ${filtered.length} Transaksi` : '0 Transaksi ditemukan'}</p>
          {visibleCount < filtered.length && (
            <button onClick={handleLoadMore} className="px-6 py-2 bg-white border border-gray-200 rounded-full text-xs font-bold text-blue-600 flex items-center gap-2">
              Tampilkan Lebih Banyak <i className="fas fa-chevron-down text-[10px]"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
