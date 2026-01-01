
import React, { useState, useEffect, useMemo } from 'react';
import { Product, User, Role, Order, SalesReport } from '../types';
import { supabaseService } from '../supabase';
import ProductForm from './ProductForm';
import UserForm from './UserForm';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AdminDashboardProps {
  products: Product[];
  onProductsChange: () => void;
  orders: Order[];
}

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'all';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ products, onProductsChange, orders }) => {
  const [activeTab, setActiveTab] = useState<'products' | 'users' | 'reports'>('products');
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('all');
  const [users, setUsers] = useState<User[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    supabaseService.getUsers().then(setUsers);
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [products, productSearch]);

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      if (reportPeriod === 'daily') {
        return orderDate >= startOfToday;
      }
      if (reportPeriod === 'weekly') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return orderDate >= oneWeekAgo;
      }
      if (reportPeriod === 'monthly') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return orderDate >= startOfMonth;
      }
      return true;
    });
  }, [orders, reportPeriod]);

  const stats = useMemo(() => {
    const report: SalesReport = {
      total_revenue: 0,
      order_count: filteredOrders.length,
      avg_order_value: 0,
      user_stats: {}
    };

    const categoryStats: { [cat: string]: number } = {};

    filteredOrders.forEach(o => {
      report.total_revenue += o.total_amount;
      report.user_stats[o.user_name] = (report.user_stats[o.user_name] || 0) + o.total_amount;
      
      o.items.forEach(item => {
        const prod = products.find(p => p.id === item.id);
        const cat = prod?.category || 'Uncategorized';
        categoryStats[cat] = (categoryStats[cat] || 0) + (item.price * item.quantity);
      });
    });

    report.avg_order_value = report.order_count > 0 ? report.total_revenue / report.order_count : 0;
    return { ...report, categoryStats };
  }, [filteredOrders, products]);

  const chartData = useMemo(() => {
    return Object.entries(stats.user_stats).map(([name, value]) => ({ name, value }));
  }, [stats]);

  const categoryData = useMemo(() => {
    return Object.entries(stats.categoryStats).map(([name, value]) => ({ name, value }));
  }, [stats]);

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Hapus produk ini?')) {
      await supabaseService.deleteProduct(id);
      onProductsChange();
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Hapus user ini?')) {
      await supabaseService.deleteUser(id);
      setUsers(await supabaseService.getUsers());
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="flex flex-col gap-6">
      {/* Header Manajemen & Tab Navigation */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight">Pusat Manajemen</h2>
            <p className="text-xs text-gray-400 font-medium">Kelola produk, pengguna, dan tinjau laporan penjualan.</p>
          </div>
          <div className="flex p-1 bg-gray-100 rounded-xl md:w-auto">
            <button 
              onClick={() => setActiveTab('products')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${activeTab === 'products' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
            >
              <i className="fas fa-boxes"></i> Produk
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${activeTab === 'users' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
            >
              <i className="fas fa-users"></i> User
            </button>
            <button 
              onClick={() => setActiveTab('reports')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${activeTab === 'reports' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
            >
              <i className="fas fa-chart-line"></i> Laporan
            </button>
          </div>
        </div>
      </div>

      {/* Konten Aktif */}
      <div className="space-y-6">
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="relative flex-1 w-full">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <input 
                  type="text" 
                  placeholder="Cari produk di manajemen..." 
                  className="w-full pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>
              <button 
                onClick={() => { setEditingProduct(null); setIsFormOpen(true); }}
                className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition active:scale-95 text-sm"
              >
                <i className="fas fa-plus"></i> Tambah Produk
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Desktop View Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Produk</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Kategori</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Harga</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Stok</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredProducts.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-800 block">{p.name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded uppercase tracking-tighter">{p.category}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-black">Rp {p.price.toLocaleString()}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-black ${p.stock < 10 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                          <button onClick={() => { setEditingProduct(p); setIsFormOpen(true); }} className="text-blue-500 hover:bg-blue-50 p-2 rounded-xl transition" title="Edit"><i className="fas fa-edit"></i></button>
                          <button onClick={() => handleDeleteProduct(p.id)} className="text-red-400 hover:bg-red-50 p-2 rounded-xl transition" title="Hapus"><i className="fas fa-trash"></i></button>
                        </td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-16 text-center text-gray-300 italic text-sm">Belum ada produk untuk ditampilkan.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile View Cards */}
              <div className="md:hidden divide-y divide-gray-50">
                {filteredProducts.length > 0 ? filteredProducts.map(p => (
                  <div key={p.id} className="p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="max-w-[70%]">
                        <h4 className="font-bold text-gray-800 text-sm leading-snug">{p.name}</h4>
                        <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase tracking-widest inline-block mt-1">{p.category}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-md text-[10px] font-black ${p.stock < 10 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                        Stok: {p.stock}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-t border-gray-50 pt-3 mt-1">
                      <p className="text-blue-700 font-black text-base">Rp {p.price.toLocaleString()}</p>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingProduct(p); setIsFormOpen(true); }} className="bg-blue-50 text-blue-500 w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 transition shadow-sm border border-blue-100">
                          <i className="fas fa-edit text-sm"></i>
                        </button>
                        <button onClick={() => handleDeleteProduct(p.id)} className="bg-red-50 text-red-400 w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 transition shadow-sm border border-red-100">
                          <i className="fas fa-trash text-sm"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="p-16 text-center text-gray-300 italic text-sm">Produk tidak ditemukan.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button 
                onClick={() => { setEditingUser(null); setIsFormOpen(true); }}
                className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-green-700 flex items-center justify-center gap-2 shadow-lg shadow-green-100 transition active:scale-95 text-sm"
              >
                <i className="fas fa-user-plus"></i> Tambah User
              </button>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Karyawan</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Hak Akses / Role</th>
                      <th className="hidden sm:table-cell px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">PIN</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xs">
                               {u.name.charAt(0)}
                             </div>
                             <span className="font-bold text-gray-800 text-sm">{u.name}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tight ${
                            u.role === Role.ADMIN ? 'bg-purple-100 text-purple-600' : 
                            u.role === Role.KASIR ? 'bg-blue-100 text-blue-600' : 
                            u.role === Role.GUDANG ? 'bg-teal-100 text-teal-600' :
                            'bg-orange-100 text-orange-600'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="hidden sm:table-cell px-6 py-4 text-center">
                          <span className="text-gray-300 font-mono tracking-widest">••••</span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                          <button onClick={() => { setEditingUser(u); setIsFormOpen(true); }} className="text-blue-500 hover:bg-blue-50 p-2 rounded-xl transition"><i className="fas fa-edit text-sm"></i></button>
                          <button onClick={() => handleDeleteUser(u.id)} className="text-red-400 hover:bg-red-50 p-2 rounded-xl transition"><i className="fas fa-trash text-sm"></i></button>
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
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center gap-4">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filter Laporan:</span>
              <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
                {(['all', 'daily', 'weekly', 'monthly'] as ReportPeriod[]).map((period) => (
                  <button
                    key={period}
                    onClick={() => setReportPeriod(period)}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition ${
                      reportPeriod === period 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {period === 'all' ? 'Semua' : period === 'daily' ? 'Hari Ini' : period === 'weekly' ? '7 Hari' : 'Bulan Ini'}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition duration-300">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-50 rounded-full opacity-40 group-hover:scale-125 transition duration-700"></div>
                <div className="relative z-10">
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Total Pendapatan</p>
                  <p className="text-3xl font-black text-blue-700 mt-2">Rp {stats.total_revenue.toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition duration-300">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-emerald-50 rounded-full opacity-40 group-hover:scale-125 transition duration-700"></div>
                <div className="relative z-10">
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Jumlah Transaksi</p>
                  <p className="text-3xl font-black text-emerald-600 mt-2">{stats.order_count}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition duration-300">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-amber-50 rounded-full opacity-40 group-hover:scale-125 transition duration-700"></div>
                <div className="relative z-10">
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Rata-rata / Nota</p>
                  <p className="text-3xl font-black text-amber-600 mt-2">Rp {Math.round(stats.avg_order_value).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                    <i className="fas fa-user-tag text-blue-500"></i> Penjualan per User
                  </h3>
                </div>
                <div className="h-[280px]">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                        <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                        <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => `Rp${val/1000}k`} tick={{fill: '#94a3b8'}} />
                        <Tooltip 
                          cursor={{fill: '#f1f5f9'}}
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                          formatter={(value) => `Rp ${Number(value).toLocaleString()}`}
                        />
                        <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-300 text-xs italic bg-gray-50 rounded-2xl border border-dashed border-gray-100">Data belum tersedia</div>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                    <i className="fas fa-tags text-blue-500"></i> Penjualan per Kategori
                  </h3>
                </div>
                <div className="h-[280px]">
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f8fafc" />
                        <XAxis type="number" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => `Rp${val/1000}k`} tick={{fill: '#94a3b8'}} />
                        <YAxis dataKey="name" type="category" fontSize={10} axisLine={false} tickLine={false} width={70} tick={{fill: '#64748b', fontWeight: 'bold'}} />
                        <Tooltip 
                          cursor={{fill: '#f1f5f9'}}
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                          formatter={(value) => `Rp ${Number(value).toLocaleString()}`}
                        />
                        <Bar dataKey="value" fill="#10b981" radius={[0, 6, 6, 0]} barSize={30}>
                           {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-300 text-xs italic bg-gray-50 rounded-2xl border border-dashed border-gray-100">Data belum tersedia</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Form Dialog Overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-[2px]">
          <div className="bg-white rounded-[2rem] max-w-md w-full p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            {activeTab === 'products' ? (
              <ProductForm 
                product={editingProduct} 
                onClose={() => setIsFormOpen(false)} 
                onSave={async (p) => {
                  await supabaseService.saveProduct(p);
                  onProductsChange();
                  setIsFormOpen(false);
                }}
              />
            ) : (
              <UserForm 
                user={editingUser} 
                onClose={() => setIsFormOpen(false)} 
                onSave={async (u) => {
                  await supabaseService.saveUser(u);
                  setUsers(await supabaseService.getUsers());
                  setIsFormOpen(false);
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
