
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
  const [activeKey, setActiveKey] = useState<string | null>(null);

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

  const startPress = (key: string) => setActiveKey(key);
  const endPress = () => setActiveKey(null);

  // Base class tanpa pseudo-class hover/active/focus
  const baseNumClass = "h-14 text-xl font-black rounded-xl border border-transparent select-none touch-manipulation outline-none appearance-none flex items-center justify-center transition-transform duration-75";

  const renderButton = (label: string | React.ReactNode, id: string, onClick: () => void, extraClass: string = "") => {
    const isActive = activeKey === id;
    return (
      <button
        type="button"
        onMouseDown={() => startPress(id)}
        onMouseUp={endPress}
        onMouseLeave={endPress}
        onTouchStart={() => startPress(id)}
        onTouchEnd={endPress}
        onClick={(e) => {
          e.preventDefault();
          onClick();
        }}
        className={`${baseNumClass} ${extraClass} ${
          isActive 
            ? 'bg-blue-100 scale-90 text-blue-700' 
            : (extraClass.includes('text-red') || extraClass.includes('text-gray-400') ? 'bg-transparent' : 'bg-gray-50 text-gray-700')
        }`}
        style={{ WebkitTouchCallout: 'none' }}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl select-none">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Login Karyawan</h2>
        <p className="text-sm text-gray-500">Masukkan 5 digit PIN Anda</p>
      </div>

      <div className="flex justify-center gap-3 mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div 
            key={i} 
            className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
              pin.length >= i ? 'bg-blue-600 border-blue-600 scale-110 shadow-sm shadow-blue-200' : 'bg-gray-100 border-gray-300'
            }`}
          ></div>
        ))}
      </div>

      <div className="h-6 mb-4">
        {error && <p className="text-red-500 text-center text-sm font-bold animate-pulse">{error}</p>}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => 
          renderButton(num.toString(), num.toString(), () => handleKeyPress(num.toString()))
        )}
        
        {renderButton(
          "Batal", 
          "cancel", 
          onCancel, 
          "text-red-500 font-black text-[10px] uppercase tracking-widest"
        )}
        
        {renderButton("0", "0", () => handleKeyPress("0"))}
        
        {renderButton(
          <i className="fas fa-backspace"></i>, 
          "backspace", 
          handleBackspace, 
          "text-gray-400 text-xl"
        )}
      </div>

      <button 
        type="button"
        onClick={handleLoginAttempt}
        disabled={pin.length < 5}
        className={`w-full py-4 rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-2 select-none outline-none transition-all active:scale-95 ${
          pin.length === 5 
            ? 'bg-blue-600 text-white shadow-blue-100' 
            : 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none'
        }`}
      >
        <i className="fas fa-sign-in-alt"></i> LOGIN
      </button>
    </div>
  );
};

export default PinLogin;
