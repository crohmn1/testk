
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
  const [viewingProductName, setViewingProductName] = useState<string | null>(null);

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

  const isButtonDisabled = !user || user.role === Role.GUDANG;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Search and Filters - Static */}
      <div className="bg-white p-3 md:p-4 rounded-xl border flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <i className="fas fa-search absolute left-3 top-2.5 text-gray-400 text-sm"></i>
          <input 
            type="text" 
            placeholder="Cari produk..." 
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none text-sm"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select 
            className="flex-1 md:flex-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none text-sm"
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
            className={`flex-1 md:flex-none px-3 py-2 rounded-lg border flex items-center justify-center gap-2 text-sm ${sortStock !== 'none' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}
          >
            <i className="fas fa-layer-group"></i> 
            Stok {sortStock === 'asc' ? '↑' : sortStock === 'desc' ? '↓' : ''}
          </button>
        </div>
      </div>

      {/* Product List - KEPT INTERACTION AS PER REQUEST */}
      <div className="bg-white rounded-xl border shadow-sm divide-y">
        {paginated.length > 0 ? (
          paginated.map(p => (
            <div 
              key={p.id} 
              className="p-3 md:p-4 flex items-center justify-between hover:bg-gray-50 transition gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight">
                    {p.category}
                  </span>
                  {p.stock <= 0 && (
                    <span className="bg-gray-200 text-gray-500 text-[9px] px-1.5 py-0.5 rounded font-bold">
                      Habis
                    </span>
                  )}
                </div>
                <h3 
                  onClick={() => setViewingProductName(p.name)}
                  className="font-bold text-gray-800 text-sm md:text-base truncate leading-tight cursor-help hover:text-blue-600 transition"
                >
                  {p.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    p.stock <= 0 ? 'bg-red-50 text-red-400' : 
                    p.stock <= 5 ? 'bg-orange-50 text-orange-500' : 
                    'bg-green-50 text-green-600'
                  }`}>
                    Stok: {p.stock}
                  </span>
                </div>
              </div>

              <div className="w-24 sm:w-32 text-right shrink-0">
                <p className="text-blue-700 font-black text-sm md:text-lg whitespace-nowrap">
                  Rp{p.price.toLocaleString('id-ID')}
                </p>
              </div>

              <div className="shrink-0 ml-1">
                <button 
                  disabled={isButtonDisabled || p.stock <= 0}
                  onClick={() => onAddToCart(p)}
                  className={`flex items-center justify-center rounded-lg font-bold transition ${
                    isButtonDisabled ? 'bg-gray-100 text-gray-300 cursor-not-allowed' :
                    p.stock <= 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 
                    'bg-blue-600 text-white hover:bg-blue-700 active:scale-90'
                  } w-9 h-9 md:w-auto md:h-10 md:px-4`}
                >
                  <i className="fas fa-plus text-sm"></i>
                  <span className="hidden md:inline ml-2 text-sm">Tambah</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-gray-400">
            <i className="fas fa-search text-3xl mb-2 block"></i>
            <p className="text-sm font-medium">Produk tidak ditemukan</p>
          </div>
        )}
      </div>

      {/* Pagination - Static */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4 pb-8">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-20"
          >
            <i className="fas fa-chevron-left text-xs"></i>
          </button>
          
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1">
             <span className="text-xs font-bold text-gray-400 px-1">{page}</span>
             <span className="text-xs text-gray-300">/</span>
             <span className="text-xs font-bold text-gray-600 px-1">{totalPages}</span>
          </div>

          <button 
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-20"
          >
            <i className="fas fa-chevron-right text-xs"></i>
          </button>
        </div>
      )}

      {/* Name Viewer Popup - Static */}
      {viewingProductName && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full animate-in zoom-in duration-200">
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Nama Produk Lengkap:</h4>
            <p className="text-xl font-bold text-gray-800 leading-tight mb-6">{viewingProductName}</p>
            <button 
              onClick={() => setViewingProductName(null)}
              className="w-full bg-gray-100 text-gray-800 py-3 rounded-xl font-bold"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Catalog;
