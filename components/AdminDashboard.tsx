
import React, { useState, useEffect, useMemo } from 'react';
import { Product, User, Role, Order, SalesReport, Customer } from '../types';
import { supabaseService } from '../supabase';
import ProductForm from './ProductForm';
import UserForm from './UserForm';
import CustomerForm from './CustomerForm';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell
} from 'recharts';

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
    };

    // Advanced User Stats Tracking
    const userPerf: { [name: string]: { revenue: number, count: number } } = {};
    const timeSeriesData: { [key: string]: number } = {};

    filteredOrders.forEach(o => {
      report.total_revenue += o.total_amount;
      report.user_stats[o.user_name] = (report.user_stats[o.user_name] || 0) + o.total_amount;
      
      if (!userPerf[o.user_name]) userPerf[o.user_name] = { revenue: 0, count: 0 };
      userPerf[o.user_name].revenue += o.total_amount;
      userPerf[o.user_name].count += 1;

      const dateKey = new Date(o.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      timeSeriesData[dateKey] = (timeSeriesData[dateKey] || 0) + o.total_amount;
    });

    report.avg_order_value = report.order_count > 0 ? report.total_revenue / report.order_count : 0;

    const chartData = Object.keys(timeSeriesData).map(key => ({
      name: key,
      revenue: timeSeriesData[key]
    })).reverse();

    const userChartData = Object.keys(userPerf).map(name => ({
      name: name.split(' ')[0], // Use first name for chart
      fullName: name,
      revenue: userPerf[name].revenue,
      orders: userPerf[name].count
    })).sort((a, b) => b.revenue - a.revenue);

    return { ...report, chartData, userChartData };
  }, [filteredOrders]);

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
    if (isProcessing || selectedCustomerIds.length === 0) return;
    if (window.confirm(`Hapus permanen ${selectedCustomerIds.length} member terpilih?`)) {
      setIsProcessing(true);
      try {
        await supabaseService.bulkDeleteCustomers(selectedCustomerIds);
        await onCustomersChange();
        setSelectedCustomerIds([]);
      } catch (error) {
        alert("Terjadi kesalahan.");
      } finally { setIsProcessing(false); }
    }
  };

  const onBulkTransferSubmit = async () => {
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
      } catch (error) {
        alert("Terjadi kesalahan.");
      } finally { setIsProcessing(false); }
    }
  };

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <React.Fragment>
      <div className="flex flex-col gap-6 relative min-h-screen pb-48">
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
                <button onClick={() => { setEditingProduct(null); setIsFormOpen(true); }} className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-200">
                  <i className="fas fa-plus-circle"></i> Tambah Produk
                </button>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Produk</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Harga</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Stok</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                      {filteredProducts.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4">
                            <span className="font-bold text-gray-800 block">{p.name}</span>
                            <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-black uppercase">{p.category}</span>
                          </td>
                          <td className="px-6 py-4 font-black text-gray-600">Rp {p.price.toLocaleString()}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-1 rounded text-[10px] font-black ${p.stock < 10 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>{p.stock}</span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-1">
                            <button onClick={() => { setEditingProduct(p); setIsFormOpen(true); }} className="text-blue-500 hover:bg-blue-50 w-8 h-8 rounded-lg transition"><i className="fas fa-edit"></i></button>
                            <button onClick={() => handleDeleteProduct(p.id)} className="text-red-400 hover:bg-red-50 w-8 h-8 rounded-lg transition"><i className="fas fa-trash"></i></button>
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
                <button onClick={() => { setEditingUser(null); setIsFormOpen(true); }} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 text-sm shadow-lg">
                  <i className="fas fa-user-plus"></i> Tambah Staff
                </button>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                 <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Staff</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                      {users.map(u => (
                        <tr key={u.id}>
                          <td className="px-6 py-4 font-bold text-gray-800">{u.name}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase tracking-tight">{u.role}</span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-1">
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
                  <input type="text" placeholder="Cari member..." className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none text-sm shadow-sm" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <select 
                    className="flex-1 sm:flex-none border border-gray-200 rounded-2xl px-4 py-3 bg-white text-sm focus:outline-none font-bold text-gray-600 shadow-sm"
                    value={customerFilterUser}
                    onChange={(e) => setCustomerFilterUser(e.target.value)}
                  >
                    <option value="all">Semua Petugas</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                  <button onClick={() => { setEditingCustomer(null); setIsFormOpen(true); }} className="bg-amber-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 text-sm shadow-lg shadow-amber-100">
                    <i className="fas fa-user-plus"></i> Member
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-4 w-12"><input type="checkbox" checked={filteredCustomers.length > 0 && selectedCustomerIds.length === filteredCustomers.length} onChange={handleToggleSelectAll} /></th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Informasi Member</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total Belanja</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                      {filteredCustomers.map(c => (
                        <tr key={c.id} className={selectedCustomerIds.includes(c.id) ? 'bg-blue-50/50' : ''}>
                          <td className="px-6 py-4"><input type="checkbox" checked={selectedCustomerIds.includes(c.id)} onChange={() => handleToggleSelectOne(c.id)} /></td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-gray-800 block">{c.name}</span>
                            <span className="text-[10px] font-black text-gray-400">{c.phone}</span>
                          </td>
                          <td className="px-6 py-4 text-right font-black text-gray-600">Rp {c.total_spent.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right space-x-1">
                            <button onClick={() => { setEditingCustomer(c); setIsFormOpen(true); }} className="text-blue-500 hover:bg-blue-50 w-8 h-8 rounded-lg transition"><i className="fas fa-edit"></i></button>
                            <button onClick={() => handleDeleteCustomer(c.id)} className="text-red-400 hover:bg-red-50 w-8 h-8 rounded-lg transition"><i className="fas fa-trash"></i></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
               {/* Report Filter & Export */}
               <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filter Periode:</span>
                  <div className="flex bg-gray-100 p-1 rounded-xl">
                    {(['all', 'daily', 'weekly', 'monthly'] as ReportPeriod[]).map((period) => (
                      <button key={period} onClick={() => setReportPeriod(period)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all ${reportPeriod === period ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>{period === 'all' ? 'Semua' : period === 'daily' ? 'Hari Ini' : period === 'weekly' ? '7 Hari' : 'Bulan Ini'}</button>
                    ))}
                  </div>
                </div>
                <button onClick={() => window.print()} className="w-full md:w-auto bg-gray-900 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
                  <i className="fas fa-file-export"></i> Cetak Laporan
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Pendapatan Kotor</p>
                  <p className="text-2xl font-black text-blue-700 mt-1">Rp {stats.total_revenue.toLocaleString()}</p>
                  <p className="text-[10px] text-emerald-500 font-bold mt-2"><i className="fas fa-caret-up mr-1"></i> Total Periode Terpilih</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Total Transaksi</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">{stats.order_count}</p>
                  <p className="text-[10px] text-gray-400 font-bold mt-2">Nota Penjualan Terbit</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Rata-rata Penjualan</p>
                  <p className="text-2xl font-black text-amber-600 mt-1">Rp {Math.round(stats.avg_order_value).toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400 font-bold mt-2">Nilai per Transaksi</p>
                </div>
              </div>

              {/* Sales Charts Section - Full Width */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-12 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Grafik Tren Penjualan</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.chartData}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                        <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} tickFormatter={(val) => `Rp ${val/1000}k`} />
                        <Tooltip 
                          contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px'}}
                          formatter={(val: number) => [`Rp ${val.toLocaleString()}`, 'Pendapatan']}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Staff Performance Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                 <div className="lg:col-span-12 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                      <div>
                        <h3 className="text-lg font-black text-gray-800 tracking-tight">Laporan Penjualan per User</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Analisis produktivitas dan kontribusi staff dalam periode ini.</p>
                      </div>
                      <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <i className="fas fa-users"></i> {stats.userChartData.length} User Aktif
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      {/* Bar Chart User Performance */}
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats.userChartData} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" hide />
                            <YAxis 
                              dataKey="name" 
                              type="category" 
                              fontSize={11} 
                              fontWeight="bold" 
                              tickLine={false} 
                              axisLine={false} 
                              tick={{fill: '#475569'}}
                            />
                            <Tooltip 
                              cursor={{fill: '#f8fafc'}}
                              contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px'}}
                              formatter={(val: number) => [`Rp ${val.toLocaleString()}`, 'Total Penjualan']}
                            />
                            <Bar 
                              dataKey="revenue" 
                              radius={[0, 12, 12, 0]} 
                              barSize={24}
                            >
                              {stats.userChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Performance Table */}
                      <div className="overflow-hidden border border-gray-100 rounded-3xl">
                        <table className="w-full text-left">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Nama Staff</th>
                              <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Nota</th>
                              <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Revenue</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y text-xs">
                            {stats.userChartData.map((user, i) => (
                              <tr key={user.fullName} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] text-white" style={{backgroundColor: COLORS[i % COLORS.length]}}>
                                      {user.name.charAt(0)}
                                    </div>
                                    <span className="font-bold text-gray-700">{user.fullName}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                   <span className="px-2.5 py-1 bg-gray-100 rounded-full font-black text-[10px] text-gray-500">{user.orders}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className="font-black text-blue-700">Rp {user.revenue.toLocaleString()}</span>
                                </td>
                              </tr>
                            ))}
                            {stats.userChartData.length === 0 && (
                              <tr>
                                <td colSpan={3} className="px-6 py-12 text-center text-gray-300 italic">Belum ada data penjualan per user</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedCustomerIds.length > 0 && activeTab === 'customers' && (
        <div className="fixed bottom-28 md:bottom-10 left-1/2 -translate-x-1/2 z-[9999] w-[95%] max-w-2xl animate-in slide-in-from-bottom-12 duration-500">
          <div className="bg-gray-900 text-white rounded-[2.5rem] px-4 py-3 md:px-8 md:py-5 flex items-center justify-between shadow-2xl border border-gray-800 backdrop-blur-xl bg-opacity-95">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-black">{selectedCustomerIds.length}</span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-black uppercase tracking-widest text-blue-400">Member Terpilih</p>
                  <button onClick={() => setSelectedCustomerIds([])} className="text-[9px] text-gray-400 font-bold uppercase hover:text-white transition">Batal Pilih</button>
                </div>
             </div>
             <div className="flex gap-2">
                <button onClick={() => setShowTransferModal(true)} className="bg-white text-gray-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95"><i className="fas fa-exchange-alt mr-2"></i> Pindahkan</button>
                <button onClick={onBulkDeleteClick} className="bg-red-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95"><i className="fas fa-trash mr-2"></i> Hapus</button>
             </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-[10000] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] max-w-sm w-full p-8 animate-in zoom-in duration-300 shadow-2xl">
            <h2 className="text-xl font-black text-gray-800 mb-6 tracking-tight">Pindahkan Member</h2>
            <div className="space-y-4 mb-8">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Pilih Petugas Baru</label>
              <select className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:outline-none font-bold text-sm" value={targetOwnerId} onChange={(e) => setTargetOwnerId(e.target.value)}>
                <option value="">Pilih Staff...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowTransferModal(false)} className="flex-1 px-4 py-3 border border-gray-200 text-gray-500 font-bold rounded-xl text-xs uppercase">Batal</button>
              <button onClick={onBulkTransferSubmit} disabled={!targetOwnerId || isProcessing} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase shadow-lg shadow-blue-100">Proses</button>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/60 flex items-center justify-center p-4 backdrop-blur-[2px]">
          <div className="bg-white rounded-[2rem] max-w-md w-full p-8 animate-in zoom-in duration-300 shadow-2xl overflow-y-auto max-h-[90vh]">
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
