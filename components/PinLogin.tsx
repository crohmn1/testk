
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { supabaseService } from '../supabase';

interface PinLoginProps {
  onLogin: (user: User) => void;
  onCancel: () => void;
}

const PinLogin: React.FC<PinLoginProps> = ({ onLogin, onCancel }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    supabaseService.getUsers().then(setUsers);
  }, []);

  const handleKeyPress = (num: string) => {
    if (pin.length < 5) {
      setPin(prev => prev + num);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleLoginAttempt = () => {
    if (pin.length < 5) {
      setError('PIN harus 5 digit');
      return;
    }

    const foundUser = users.find(u => u.pin === pin);
    if (foundUser) {
      onLogin(foundUser);
      setPin('');
      const modal = document.getElementById('login-modal') as HTMLDialogElement;
      if (modal) modal.close();
    } else {
      setError('PIN tidak valid');
      setPin('');
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Login Karyawan</h2>
        <p className="text-sm text-gray-500">Masukkan 5 digit PIN Anda</p>
      </div>

      <div className="flex justify-center gap-3 mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div 
            key={i} 
            className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
              pin.length >= i ? 'bg-blue-600 border-blue-600 scale-110' : 'bg-gray-100 border-gray-300'
            }`}
          ></div>
        ))}
      </div>

      <div className="h-6 mb-4">
        {error && <p className="text-red-500 text-center text-sm font-bold animate-pulse">{error}</p>}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleKeyPress(num.toString())}
            className="h-14 bg-gray-50 hover:bg-blue-50 text-xl font-black text-gray-700 rounded-xl transition-all active:scale-90 border border-transparent hover:border-blue-200"
          >
            {num}
          </button>
        ))}
        <button
          onClick={onCancel}
          className="h-14 text-red-500 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-red-50 active:scale-95"
        >
          Batal
        </button>
        <button
          onClick={() => handleKeyPress('0')}
          className="h-14 bg-gray-50 hover:bg-blue-50 text-xl font-black text-gray-700 rounded-xl active:scale-90 border border-transparent hover:border-blue-200"
        >
          0
        </button>
        <button
          onClick={handleBackspace}
          className="h-14 text-gray-400 text-xl rounded-xl hover:bg-gray-100 active:scale-95"
        >
          <i className="fas fa-backspace"></i>
        </button>
      </div>

      <button 
        onClick={handleLoginAttempt}
        disabled={pin.length < 5}
        className={`w-full py-4 rounded-2xl font-black text-lg transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${
          pin.length === 5 
            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100' 
            : 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none'
        }`}
      >
        <i className="fas fa-sign-in-alt"></i> LOGIN
      </button>
    </div>
  );
};

export default PinLogin;
