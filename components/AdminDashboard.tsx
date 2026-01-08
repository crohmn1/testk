
import React, { useState, useEffect, useMemo } from 'react';
import { Product, User, Role, Order, SalesReport, Customer } from '../types';
import { supabaseService } from '../supabase';
import ProductForm from './ProductForm';
import UserForm from './UserForm';
import CustomerForm from './CustomerForm';

interface AdminDashboardProps {
  products: Product[];
  onProductsChange: () => void;
  orders: Order[];
  customers: Customer[];
  currentUser: User;
  onCustomersChange: () => void;
}

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'all';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ products, onProductsChange, orders, customers, currentUser, onCustomersChange }) => {
  const [activeTab, setActiveTab] = useState<'products' | 'users' | 'customers' | 'reports'>('products');
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('all');
  const [users, setUsers] = useState<User[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerFilterUser, setCustomerFilterUser] = useState('all');
  
  // Multi-select state
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [targetOwnerId, setTargetOwnerId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    supabaseService.getUsers().then(setUsers);
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [products, productSearch]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
                           c.phone.includes(customerSearch);
      const matchesUser = customerFilterUser === 'all' || c.created_by === customerFilterUser;
      return matchesSearch && matchesUser;
    });
  }, [customers, customerSearch, customerFilterUser]);

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      if (reportPeriod === 'daily') return orderDate >= startOfToday;
      if (reportPeriod === 'weekly') return orderDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (reportPeriod === 'monthly') return orderDate >= new Date(now.getFullYear(), now.getMonth(), 1);
      return true;
    });
  }, [orders, reportPeriod]);

  const stats = useMemo(() => {
    const report: SalesReport = {
      total_revenue: 0,
      order_count: filteredOrders.length,
      avg_order_value: 0,
      user_stats: {},
      categoryStats: {}
    };
    filteredOrders.forEach(o => {
      report.total_revenue += o.total_amount;
      report.user_stats[o.user_name] = (report.user_stats[o.user_name] || 0) + o.total_amount;
      o.items.forEach(item => {
        const prod = products.find(p => p.id === item.id);
        const cat = prod?.category || 'Uncategorized';
        report.categoryStats[cat] = (report.categoryStats[cat] || 0) + (item.price * item.quantity);
      });
    });
    report.avg_order_value = report.order_count > 0 ? report.total_revenue / report.order_count : 0;
    return report;
  }, [filteredOrders, products]);

  const handleDeleteProduct = async (id: string) => { if (confirm('Hapus produk ini?')) { await supabaseService.deleteProduct(id); onProductsChange(); } };
  const handleDeleteUser = async (id: string) => { if (confirm('Hapus user ini?')) { await supabaseService.deleteUser(id); setUsers(await supabaseService.getUsers()); } };
  const handleDeleteCustomer = async (id: string) => { if (confirm('Hapus member ini?')) { await supabaseService.deleteCustomer(id); onCustomersChange(); } };

  // Bulk Action Logic
  const handleToggleSelectAll = () => {
    if (selectedCustomerIds.length === filteredCustomers.length && filteredCustomers.length > 0) {
      setSelectedCustomerIds([]);
    } else {
      setSelectedCustomerIds(filteredCustomers.map(c => c.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedCustomerIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const onBulkDeleteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isProcessing || selectedCustomerIds.length === 0) return;
    
    if (window.confirm(`Hapus permanen ${selectedCustomerIds.length} member terpilih?`)) {
      setIsProcessing(true);
      try {
        await supabaseService.bulkDeleteCustomers(selectedCustomerIds);
        await onCustomersChange();
        setSelectedCustomerIds([]);
      } catch (error) {
        alert("Terjadi kesalahan saat menghapus.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const onBulkTransferSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isProcessing || !targetOwnerId) return;
    
    const newOwner = users.find(u => u.id === targetOwnerId);
    if (!newOwner) return;

    if (window.confirm(`Pindahkan kepemilikan ${selectedCustomerIds.length} member ke ${newOwner.name}?`)) {
      setIsProcessing(true);
      try {
        await supabaseService.bulkTransferCustomers(selectedCustomerIds, newOwner.id, newOwner.role);
        await onCustomersChange();
        setSelectedCustomerIds([]);
        setShowTransferModal(false);
        setTargetOwnerId('');
      } catch (error) {
        alert("Terjadi kesalahan saat memindahkan data.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <React.Fragment>
      <div className="flex flex-col gap-6 relative min-h-screen pb-48">
        {/* Header Pusat Manajemen */}
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-6 pb-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Pusat Manajemen</h2>
              <p className="text-xs text-gray-400 font-medium">Kelola inventaris, staff, member, dan pantau performa bisnis.</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full w-fit">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Administrator Mode</span>
            </div>
          </div>

          <div className="p-4 pt-4">
            <div className="bg-gray-100 p-1.5 rounded-2xl flex items-center relative h-12">
              <div 
                className="absolute bg-white rounded-xl shadow-md h-[calc(100%-12px)] transition-all duration-300 ease-out z-0"
                style={{ 
                  width: 'calc(25% - 8px)',
                  transform: `translateX(${
                      activeTab === 'products' ? '4px' : 
                      activeTab === 'users' ? 'calc(100% + 8px)' : 
                      activeTab === 'customers' ? 'calc(200% + 12px)' : 
                      'calc(300% + 16px)'
                  })`
                }}
              ></div>

              <button onClick={() => { setActiveTab('products'); setSelectedCustomerIds([]); }} className={`relative z-10 flex-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider transition-colors duration-300 ${activeTab === 'products' ? 'text-blue-600' : 'text-gray-400'}`}>
                <i className="fas fa-box"></i> <span className="hidden sm:inline">Produk</span>
              </button>
              <button onClick={() => { setActiveTab('users'); setSelectedCustomerIds([]); }} className={`relative z-10 flex-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider transition-colors duration-300 ${activeTab === 'users' ? 'text-blue-600' : 'text-gray-400'}`}>
                <i className="fas fa-user-shield"></i> <span className="hidden sm:inline">Staff</span>
              </button>
              <button onClick={() => { setActiveTab('customers'); setSelectedCustomerIds([]); }} className={`relative z-10 flex-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider transition-colors duration-300 ${activeTab === 'customers' ? 'text-blue-600' : 'text-gray-400'}`}>
                <i className="fas fa-users"></i> <span className="hidden sm:inline">Member</span>
              </button>
              <button onClick={() => { setActiveTab('reports'); setSelectedCustomerIds([]); }} className={`relative z-10 flex-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider transition-colors duration-300 ${activeTab === 'reports' ? 'text-blue-600' : 'text-gray-400'}`}>
                <i className="fas fa-chart-bar"></i> <span className="hidden sm:inline">Laporan</span>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {activeTab === 'products' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="relative flex-1 w-full">
                  <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                  <input type="text" placeholder="Cari di inventaris..." className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none text-sm shadow-sm" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
                </div>
                <button onClick={() => { setEditingProduct(null); setIsFormOpen(true); }} className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-200 active:scale-95 transition">
                  <i className="fas fa-plus-circle"></i> Tambah Produk
                </button>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                 <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead className="bg-gray-50/50 border-b">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Informasi Produk</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Harga Jual</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Stok</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredProducts.map(p => (
                          <tr key={p.id} className="hover:bg-gray-50/30 transition-colors">
                            <td className="px-6 py-4">
                              <span className="font-bold text-gray-800 block text-sm">{p.name}</span>
                              <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded uppercase">{p.category}</span>
                            </td>
                            <td className="px-6 py-4 text-xs font-black text-gray-600">Rp {p.price.toLocaleString()}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-2 py-1 rounded-md text-[10px] font-black ${p.stock < 10 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>{p.stock}</span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                              <button onClick={() => { setEditingProduct(p); setIsFormOpen(true); }} className="text-blue-500 hover:bg-blue-50 w-8 h-8 rounded-lg transition"><i className="fas fa-edit text-xs"></i></button>
                              <button onClick={() => handleDeleteProduct(p.id)} className="text-red-400 hover:bg-red-50 w-8 h-8 rounded-lg transition"><i className="fas fa-trash text-xs"></i></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
               <div className="flex justify-end">
                <button onClick={() => { setEditingUser(null); setIsFormOpen(true); }} className="w-full sm:w-auto bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-100">
                  <i className="fas fa-user-plus"></i> Tambah User Baru
                </button>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                 <table className="w-full text-left">
                    <thead className="bg-gray-50/50 border-b">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Staff</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {users.map(u => (
                        <tr key={u.id}>
                          <td className="px-6 py-4 font-bold text-sm text-gray-800">{u.name}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-black uppercase tracking-tight">{u.role}</span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                            <button onClick={() => { setEditingUser(u); setIsFormOpen(true); }} className="text-blue-500 hover:bg-blue-50 w-8 h-8 rounded-lg transition"><i className="fas fa-edit text-xs"></i></button>
                            <button onClick={() => handleDeleteUser(u.id)} className="text-red-400 hover:bg-red-50 w-8 h-8 rounded-lg transition"><i className="fas fa-trash text-xs"></i></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
              </div>
            </div>
          )}

          {activeTab === 'customers' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="relative flex-1 w-full">
                  <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                  <input type="text" placeholder="Cari member (Nama/HP)..." className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none text-sm shadow-sm" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <select 
                    className="flex-1 sm:flex-none border border-gray-200 rounded-2xl px-4 py-3 bg-white text-sm focus:outline-none font-bold text-gray-600 shadow-sm"
                    value={customerFilterUser}
                    onChange={(e) => setCustomerFilterUser(e.target.value)}
                  >
                    <option value="all">Semua Petugas</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                  <button onClick={() => { setEditingCustomer(null); setIsFormOpen(true); }} className="flex-1 sm:flex-none bg-amber-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm shadow-lg shadow-amber-100">
                    <i className="fas fa-user-plus"></i> <span className="whitespace-nowrap">Tambah Member</span>
                  </button>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                 <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead className="bg-gray-50/50 border-b">
                        <tr>
                          <th className="px-6 py-4 w-12">
                            <div className="flex items-center">
                              <input 
                                type="checkbox" 
                                className="w-5 h-5 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                                checked={filteredCustomers.length > 0 && selectedCustomerIds.length === filteredCustomers.length}
                                onChange={(e) => { e.stopPropagation(); handleToggleSelectAll(); }}
                              />
                            </div>
                          </th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Informasi Member</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total Belanja</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredCustomers.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-gray-300 italic text-sm">Member tidak ditemukan</td>
                          </tr>
                        ) : (
                          filteredCustomers.map(c => (
                            <tr key={c.id} className={`transition-colors cursor-pointer ${selectedCustomerIds.includes(c.id) ? 'bg-blue-50/50' : 'hover:bg-gray-50/30'}`} onClick={() => handleToggleSelectOne(c.id)}>
                              <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center">
                                  <input 
                                    type="checkbox" 
                                    className="w-5 h-5 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                                    checked={selectedCustomerIds.includes(c.id)}
                                    onChange={() => handleToggleSelectOne(c.id)}
                                  />
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="font-bold text-gray-800 block text-sm">{c.name}</span>
                                <span className="text-[10px] font-black text-gray-400">{c.phone}</span>
                                <div className="mt-1 flex items-center gap-1.5">
                                  <span className="text-[8px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-black uppercase">
                                    Didaftarkan Oleh: {users.find(u => u.id === c.created_by)?.name || 'Unknown'} ({c.created_by_role})
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right font-black text-gray-600 text-xs">Rp {c.total_spent.toLocaleString()}</td>
                              <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => { setEditingCustomer(c); setIsFormOpen(true); }} className="text-blue-500 hover:bg-blue-50 w-8 h-8 rounded-lg transition"><i className="fas fa-edit text-xs"></i></button>
                                <button onClick={() => handleDeleteCustomer(c.id)} className="text-red-400 hover:bg-red-50 w-8 h-8 rounded-lg transition"><i className="fas fa-trash text-xs"></i></button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                   </table>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
               <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-center gap-4 shadow-sm">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filter Periode:</span>
                <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
                  {(['all', 'daily', 'weekly', 'monthly'] as ReportPeriod[]).map((period) => (
                    <button key={period} onClick={() => setReportPeriod(period)} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${reportPeriod === period ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{period === 'all' ? 'Semua' : period === 'daily' ? 'Hari Ini' : period === 'weekly' ? '7 Hari' : 'Bulan Ini'}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 relative overflow-hidden group shadow-sm">
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-50 rounded-full opacity-40 group-hover:scale-110 transition duration-500"></div>
                  <div className="relative z-10">
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Total Pendapatan</p>
                    <p className="text-3xl font-black text-blue-700 mt-2">Rp {stats.total_revenue.toLocaleString()}</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 relative overflow-hidden group shadow-sm">
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-emerald-50 rounded-full opacity-40 group-hover:scale-110 transition duration-500"></div>
                  <div className="relative z-10">
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Jumlah Transaksi</p>
                    <p className="text-3xl font-black text-emerald-600 mt-2">{stats.order_count}</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 relative overflow-hidden group shadow-sm">
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-amber-50 rounded-full opacity-40 group-hover:scale-110 transition duration-500"></div>
                  <div className="relative z-10">
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Rata-rata / Nota</p>
                    <p className="text-3xl font-black text-amber-600 mt-2">Rp {Math.round(stats.avg_order_value).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RE-FIXED: Floating Bulk Action Bar - High Priority Layer */}
      {selectedCustomerIds.length > 0 && activeTab === 'customers' && (
        <div className="fixed bottom-28 md:bottom-10 left-1/2 -translate-x-1/2 z-[9999] w-[95%] max-w-2xl animate-in slide-in-from-bottom-12 duration-500 pointer-events-none">
          <div className="bg-gray-900 text-white rounded-[2.5rem] px-4 py-3 md:px-8 md:py-5 flex flex-col sm:flex-row items-center justify-between shadow-2xl border border-gray-800 backdrop-blur-xl bg-opacity-95 gap-4 pointer-events-auto">
             <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-900/40">
                    {isProcessing ? (
                      <i className="fas fa-spinner fa-spin text-xs"></i>
                    ) : (
                      <span className="text-xs md:text-sm font-black">{selectedCustomerIds.length}</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-blue-400">Member</p>
                    <p className="text-[8px] md:text-[10px] text-gray-400 font-bold uppercase tracking-tight">Terpilih</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedCustomerIds([]); }} 
                  className="text-gray-400 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors py-2 px-3 hover:bg-white/5 rounded-xl ml-2 pointer-events-auto"
                >
                  Batal
                </button>
             </div>

             <div className="flex items-center gap-2 w-full sm:w-auto pointer-events-auto">
                <button 
                  type="button"
                  disabled={isProcessing}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTransferModal(true); }}
                  className="flex-1 sm:flex-none bg-white text-gray-900 px-4 md:px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <i className="fas fa-exchange-alt"></i> Pindahkan
                </button>
                <button 
                  type="button"
                  disabled={isProcessing}
                  onClick={onBulkDeleteClick}
                  className="flex-1 sm:flex-none bg-red-600 text-white px-4 md:px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <i className="fas fa-trash"></i> Hapus
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Transfer Modal - Top Layer */}
      {showTransferModal && (
        <div className="fixed inset-0 z-[10000] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-[2rem] max-w-sm w-full p-8 animate-in fade-in zoom-in duration-300 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-black text-gray-800 mb-6 tracking-tight">Pindahkan Member</h2>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">Pindahkan {selectedCustomerIds.length} data member terpilih ke petugas penanggung jawab baru.</p>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Pilih Petugas Baru</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:outline-none font-bold text-sm"
                  value={targetOwnerId}
                  onChange={(e) => setTargetOwnerId(e.target.value)}
                >
                  <option value="">Pilih Staff...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTransferModal(false); setTargetOwnerId(''); }} 
                className="flex-1 px-4 py-3 border border-gray-200 text-gray-500 font-bold rounded-xl text-xs uppercase"
              >
                Batal
              </button>
              <button 
                type="button"
                onClick={onBulkTransferSubmit}
                disabled={!targetOwnerId || isProcessing}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-black disabled:opacity-30 transition flex items-center justify-center gap-2 text-xs uppercase shadow-lg shadow-blue-100"
              >
                {isProcessing && <i className="fas fa-spinner fa-spin"></i>}
                Pindahkan
              </button>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/60 flex items-center justify-center p-4 backdrop-blur-[2px]">
          <div className="bg-white rounded-[2rem] max-w-md w-full p-8 animate-in fade-in zoom-in duration-300 shadow-2xl">
            {activeTab === 'products' ? (
              <ProductForm product={editingProduct} onClose={() => setIsFormOpen(false)} onSave={async (p) => { await supabaseService.saveProduct(p); onProductsChange(); setIsFormOpen(false); }} />
            ) : activeTab === 'users' ? (
              <UserForm user={editingUser} onClose={() => setIsFormOpen(false)} onSave={async (u) => { await supabaseService.saveUser(u); setUsers(await supabaseService.getUsers()); setIsFormOpen(false); }} />
            ) : (
              <CustomerForm 
                customer={editingCustomer} 
                users={users}
                isAdmin={currentUser.role === Role.ADMIN}
                onClose={() => setIsFormOpen(false)} 
                onSave={async (c) => { 
                  if (!editingCustomer && !c.created_by) {
                    c.created_by = currentUser.id;
                    c.created_by_role = currentUser.role;
                  }
                  await supabaseService.saveCustomer(c); 
                  await onCustomersChange(); 
                  setIsFormOpen(false); 
                }} 
              />
            )}
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default AdminDashboard;
