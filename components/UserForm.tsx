
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
    if (formData.pin.length !== 4) {
      alert('PIN harus 4 digit');
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">{user ? 'Edit' : 'Tambah'} User</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
        <input 
          required
          type="text" 
          className="w-full border p-2 rounded-lg"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">PIN (4 Digit)</label>
        <input 
          required
          type="password" 
          maxLength={4}
          placeholder="0000"
          className="w-full border p-2 rounded-lg tracking-[1em] text-center"
          value={formData.pin}
          onChange={e => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
        <select 
          className="w-full border p-2 rounded-lg"
          value={formData.role}
          onChange={e => setFormData({ ...formData, role: e.target.value as Role })}
        >
          {Object.values(Role).map(role => <option key={role} value={role}>{role}</option>)}
        </select>
      </div>

      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Batal</button>
        <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold">Simpan</button>
      </div>
    </form>
  );
};

export default UserForm;
