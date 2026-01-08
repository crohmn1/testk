
import React, { useState, useEffect } from 'react';
import { Customer, User, Role } from '../types';

interface CustomerFormProps {
  customer: Customer | null;
  users?: User[]; // Untuk pilihan owner jika Admin
  isAdmin?: boolean;
  onClose: () => void;
  onSave: (c: Customer) => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, users = [], isAdmin = false, onClose, onSave }) => {
  const [formData, setFormData] = useState<Customer>(customer || {
    id: crypto.randomUUID(),
    name: '',
    phone: '',
    total_spent: 0,
    created_at: new Date().toISOString(),
    created_by: '',
    created_by_role: '' as any
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleOwnerChange = (userId: string) => {
    const selectedUser = users.find(u => u.id === userId);
    if (selectedUser) {
      setFormData({
        ...formData,
        created_by: selectedUser.id,
        created_by_role: selectedUser.role
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-black text-gray-800 mb-6 tracking-tight">{customer ? 'Edit Member' : 'Daftar Member Baru'}</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nama Member</label>
          <input required type="text" placeholder="Masukkan nama pelanggan..." className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:outline-none transition font-bold" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nomor HP</label>
          <input required type="tel" placeholder="081234567xxx" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:outline-none transition font-bold" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })} />
        </div>
        
        {/* Fitur Pindah Kepemilikan untuk Admin */}
        {isAdmin && (
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Petugas Penanggung Jawab</label>
            <select 
              className="w-full bg-blue-50/50 border border-blue-100 p-3 rounded-xl focus:outline-none transition font-bold text-blue-800"
              value={formData.created_by}
              onChange={(e) => handleOwnerChange(e.target.value)}
            >
              <option value="">Pilih Petugas...</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
            <p className="text-[8px] text-gray-400 mt-1 ml-1">* Hanya Admin yang dapat memindahkan kepemilikan data member.</p>
          </div>
        )}

        {customer && (
          <div className="pt-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Total Belanja (Rp)</label>
            <input disabled type="text" className="w-full bg-gray-100 border border-gray-200 p-3 rounded-xl font-bold opacity-60" value={formData.total_spent.toLocaleString()} />
          </div>
        )}
      </div>
      <div className="flex gap-3 pt-6">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-3 border border-gray-200 text-gray-500 font-bold rounded-xl">Batal</button>
        <button type="submit" className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-black">Simpan Member</button>
      </div>
    </form>
  );
};

export default CustomerForm;
