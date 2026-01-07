
import React, { useState } from 'react';
import { Product } from '../types';

interface ProductFormProps {
  product: Product | null;
  onClose: () => void;
  onSave: (p: Product) => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onClose, onSave }) => {
  const [formData, setFormData] = useState<Product>(product || {
    id: crypto.randomUUID(),
    name: '',
    category: '',
    price: 0,
    stock: 0,
    image_url: 'https://picsum.photos/seed/' + Math.random() + '/200'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">{product ? 'Edit' : 'Tambah'} Produk</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk</label>
        <input required type="text" className="w-full border p-2 rounded-lg" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
        <input required type="text" className="w-full border p-2 rounded-lg" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp)</label>
          <input required type="number" inputMode="numeric" className="w-full border p-2 rounded-lg" value={formData.price === 0 ? '' : formData.price} placeholder="0" onChange={e => setFormData({ ...formData, price: e.target.value === '' ? 0 : Number(e.target.value) })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stok</label>
          <input required type="number" inputMode="numeric" className="w-full border p-2 rounded-lg" value={formData.stock === 0 ? '' : formData.stock} placeholder="0" onChange={e => setFormData({ ...formData, stock: e.target.value === '' ? 0 : Number(e.target.value) })} />
        </div>
      </div>
      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg">Batal</button>
        <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold">Simpan</button>
      </div>
    </form>
  );
};

export default ProductForm;
