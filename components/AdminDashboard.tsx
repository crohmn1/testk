
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

  useEffect(() => {
    supabaseService.getUsers().then(setUsers);
  }, []);

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
        // Find product to get category (simulated since CartItem doesn't have it)
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
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button 
          onClick={() => setActiveTab('products')}
          className={`px-5 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${activeTab === 'products' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
          <i className="fas fa-boxes"></i> Produk
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-5 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
          <i className="fas fa-users"></i> User
        </button>
        <button 
          onClick={() => setActiveTab('reports')}
          className={`px-5 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${activeTab === 'reports' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
          <i className="fas fa-chart-line"></i> Laporan
        </button>
      </div>

      {activeTab === 'products' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
            <h2 className="text-xl font-bold text-gray-800">Manajemen Produk</h2>
            <button 
              onClick={() => { setEditingProduct(null); setIsFormOpen(true); }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 flex items-center gap-2 shadow-sm transition"
            >
              <i className="fas fa-plus"></i> Tambah Produk
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Produk</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Kategori</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Harga</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Stok</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-800 block">{p.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{p.category}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">Rp {p.price.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${p.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => { setEditingProduct(p); setIsFormOpen(true); }} className="text-blue-600 hover:bg-blue-50 w-8 h-8 rounded-full transition" title="Edit"><i className="fas fa-edit"></i></button>
                      <button onClick={() => handleDeleteProduct(p.id)} className="text-red-600 hover:bg-red-50 w-8 h-8 rounded-full transition" title="Hapus"><i className="fas fa-trash"></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
            <h2 className="text-xl font-bold text-gray-800">Manajemen Pengguna</h2>
            <button 
              onClick={() => { setEditingUser(null); setIsFormOpen(true); }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 flex items-center gap-2 shadow-sm transition"
            >
              <i className="fas fa-user-plus"></i> Tambah User
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Nama</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Akses PIN</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-semibold text-gray-800">{u.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        u.role === Role.ADMIN ? 'bg-purple-100 text-purple-600' : 
                        u.role === Role.KASIR ? 'bg-blue-100 text-blue-600' : 
                        u.role === Role.GUDANG ? 'bg-teal-100 text-teal-600' :
                        'bg-orange-100 text-orange-600'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-gray-300 font-mono tracking-widest text-lg">••••</span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => { setEditingUser(u); setIsFormOpen(true); }} className="text-blue-600 hover:bg-blue-50 w-8 h-8 rounded-full transition"><i className="fas fa-edit"></i></button>
                      <button onClick={() => handleDeleteUser(u.id)} className="text-red-600 hover:bg-red-50 w-8 h-8 rounded-full transition"><i className="fas fa-trash"></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Period Filter */}
          <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center gap-4">
            <span className="text-sm font-bold text-gray-500 uppercase">Periode Laporan:</span>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              {(['all', 'daily', 'weekly', 'monthly'] as ReportPeriod[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setReportPeriod(period)}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${
                    reportPeriod === period 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {period === 'all' ? 'Semua' : period === 'daily' ? 'Hari Ini' : period === 'weekly' ? 'Minggu Ini' : 'Bulan Ini'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <i className="fas fa-wallet text-5xl text-blue-600"></i>
              </div>
              <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Omzet</p>
              <p className="text-3xl font-black text-blue-700 mt-2">Rp {stats.total_revenue.toLocaleString()}</p>
              <div className="mt-2 text-xs text-gray-400">Total pendapatan kotor</div>
            </div>
            <div className="bg-white p-6 rounded-xl border shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <i className="fas fa-shopping-cart text-5xl text-green-600"></i>
              </div>
              <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Transaksi</p>
              <p className="text-3xl font-black text-green-600 mt-2">{stats.order_count}</p>
              <div className="mt-2 text-xs text-gray-400">Jumlah nota terbit</div>
            </div>
            <div className="bg-white p-6 rounded-xl border shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <i className="fas fa-chart-pie text-5xl text-orange-600"></i>
              </div>
              <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Rata-rata Nota</p>
              <p className="text-3xl font-black text-orange-600 mt-2">Rp {Math.round(stats.avg_order_value).toLocaleString()}</p>
              <div className="mt-2 text-xs text-gray-400">Nilai belanja rata-rata</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <i className="fas fa-user-tag text-blue-600"></i> Penjualan per Karyawan
              </h3>
              <div className="h-[300px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" fontSize={12} axisLine={false} tickLine={false} />
                      <YAxis fontSize={12} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value) => `Rp ${Number(value).toLocaleString()}`}
                      />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 italic">Tidak ada data untuk periode ini</div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <i className="fas fa-tags text-blue-600"></i> Penjualan per Kategori
              </h3>
              <div className="h-[300px]">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                      <XAxis type="number" fontSize={12} axisLine={false} tickLine={false} />
                      <YAxis dataKey="name" type="category" fontSize={12} axisLine={false} tickLine={false} width={100} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value) => `Rp ${Number(value).toLocaleString()}`}
                      />
                      <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]}>
                         {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 italic">Tidak ada data untuk periode ini</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Dialog */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
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
