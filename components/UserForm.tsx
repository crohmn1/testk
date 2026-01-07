
import React, { useState } from 'react';
import { User, Role } from '../types';

interface UserFormProps {
  user: User | null;
  onClose: () => void;
  onSave: (u: User) => void;
}

const UserForm: React.FC<UserFormProps> = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState<User>(user || {
    id: crypto.randomUUID(),
    name: '',
    pin: '',
    role: Role.KASIR
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.pin.length < 4 || formData.pin.length > 12) {
      alert('PIN harus berukuran 4 sampai 12 digit');
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-black text-gray-800 mb-6 tracking-tight">{user ? 'Edit Profil User' : 'Tambah User Baru'}</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nama Lengkap</label>
          <input required type="text" placeholder="Contoh: Budi Santoso" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:outline-none transition font-bold" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">PIN Keamanan (4-12 Digit)</label>
          <input required type="password" maxLength={12} inputMode="numeric" placeholder="••••" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl tracking-[0.5em] text-center font-black focus:outline-none transition" value={formData.pin} onChange={e => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })} />
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Role / Hak Akses</label>
          <select className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:outline-none transition font-bold" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as Role })}>
            {Object.values(Role).map(role => <option key={role} value={role}>{role}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-6">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-3 border border-gray-200 text-gray-500 font-bold rounded-xl">Batal</button>
        <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-black">Simpan User</button>
      </div>
    </form>
  );
};

export default UserForm;
