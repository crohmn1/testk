
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
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleLoginAttempt = () => {
    const foundUser = users.find(u => u.pin === pin);
    if (foundUser) {
      onLogin(foundUser);
      setPin('');
      (document.getElementById('login-modal') as any).close();
    } else {
      setError('PIN tidak valid');
      setPin('');
    }
  };

  useEffect(() => {
    if (pin.length === 4) {
      // Auto attempt on 4 digits
      setTimeout(handleLoginAttempt, 100);
    }
  }, [pin]);

  return (
    <div className="bg-white p-6 rounded-2xl">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Login Karyawan</h2>
        <p className="text-sm text-gray-500">Masukkan 4 digit PIN Anda</p>
      </div>

      <div className="flex justify-center gap-3 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i} 
            className={`w-4 h-4 rounded-full border-2 transition-all ${
              pin.length >= i ? 'bg-blue-600 border-blue-600 scale-110' : 'bg-gray-100 border-gray-300'
            }`}
          ></div>
        ))}
      </div>

      {error && <p className="text-red-500 text-center text-sm mb-4 font-medium">{error}</p>}

      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleKeyPress(num.toString())}
            className="h-14 bg-gray-50 hover:bg-blue-50 text-xl font-bold rounded-xl transition-colors active:scale-95"
          >
            {num}
          </button>
        ))}
        <button
          onClick={onCancel}
          className="h-14 text-red-500 font-semibold rounded-xl hover:bg-red-50"
        >
          Batal
        </button>
        <button
          onClick={() => handleKeyPress('0')}
          className="h-14 bg-gray-50 hover:bg-blue-50 text-xl font-bold rounded-xl active:scale-95"
        >
          0
        </button>
        <button
          onClick={handleBackspace}
          className="h-14 text-gray-400 text-xl rounded-xl hover:bg-gray-100"
        >
          <i className="fas fa-backspace"></i>
        </button>
      </div>
    </div>
  );
};

export default PinLogin;
