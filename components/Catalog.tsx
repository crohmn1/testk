
import React, { useState, useMemo } from 'react';
import { Product, User, Role } from '../types';
import { APP_CONFIG } from '../constants';

interface CatalogProps {
  products: Product[];
  onAddToCart: (p: Product) => void;
  user: User | null;
}

const Catalog: React.FC<CatalogProps> = ({ products, onAddToCart, user }) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Semua');
  const [sortStock, setSortStock] = useState<'none' | 'asc' | 'desc'>('none');
  const [page, setPage] = useState(1);

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['Semua', ...Array.from(cats)];
  }, [products]);

  const filtered = useMemo(() => {
    let result = products.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (category === 'Semua' || p.category === category)
    );

    if (sortStock === 'asc') result.sort((a, b) => a.stock - b.stock);
    if (sortStock === 'desc') result.sort((a, b) => b.stock - a.stock);

    return result;
  }, [products, search, category, sortStock]);

  const paginated = useMemo(() => {
    const start = (page - 1) * APP_CONFIG.PAGE_SIZE;
    return filtered.slice(start, start + APP_CONFIG.PAGE_SIZE);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / APP_CONFIG.PAGE_SIZE);

  // Helper to check if button should be disabled
  const isButtonDisabled = !user || user.role === Role.GUDANG;

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
          <input 
            type="text" 
            placeholder="Cari produk..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select 
            className="flex-1 md:flex-none bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none"
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <button 
            onClick={() => {
              setSortStock(prev => prev === 'none' ? 'asc' : prev === 'asc' ? 'desc' : 'none');
              setPage(1);
            }}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg border flex items-center justify-center gap-2 transition ${sortStock !== 'none' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}
          >
            <i className="fas fa-layer-group"></i> 
            Stok {sortStock === 'asc' ? '↑' : sortStock === 'desc' ? '↓' : ''}
          </button>
        </div>
      </div>

      {/* Product List */}
      <div className="space-y-3">
        {paginated.length > 0 ? (
          paginated.map(p => (
            <div 
              key={p.id} 
              className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold uppercase">
                    {p.category}
                  </span>
                  {p.stock <= 5 && p.stock > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded font-bold">
                      Stok Tipis
                    </span>
                  )}
                  {p.stock <= 0 && (
                    <span className="bg-gray-500 text-white text-[10px] px-2 py-0.5 rounded font-bold">
                      Habis
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-gray-800 text-lg leading-tight">{p.name}</h3>
                <p className="text-gray-400 text-xs mt-1">Stok tersedia: <span className="font-semibold text-gray-600">{p.stock}</span></p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 sm:min-w-[200px]">
                <p className="text-blue-700 font-black text-xl">
                  Rp {p.price.toLocaleString()}
                </p>
                <button 
                  disabled={isButtonDisabled || p.stock <= 0}
                  onClick={() => onAddToCart(p)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition h-11 ${
                    isButtonDisabled ? 'bg-gray-100 text-gray-300 cursor-not-allowed opacity-60' :
                    p.stock <= 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 
                    'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                  }`}
                  title={user?.role === Role.GUDANG ? "Role Gudang tidak memiliki akses transaksi" : ""}
                >
                  <i className="fas fa-cart-plus"></i>
                  <span className="hidden sm:inline text-sm">Tambah</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white border rounded-xl p-12 text-center text-gray-400">
            <i className="fas fa-search text-4xl mb-3 block"></i>
            <p>Produk tidak ditemukan</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8 pb-10">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="p-2 w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center disabled:opacity-30 hover:bg-white transition"
          >
            <i className="fas fa-chevron-left text-sm"></i>
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`w-8 h-8 rounded-lg text-sm font-bold transition ${
                  page === pageNum 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>
          <button 
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="p-2 w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center disabled:opacity-30 hover:bg-white transition"
          >
            <i className="fas fa-chevron-right text-sm"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default Catalog;
