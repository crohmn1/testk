
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
    if (pin.length < 12) {
      setPin(prev => prev + num);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleCancelAction = () => {
    setPin('');
    setError('');
    onCancel();
  };

  const handleLoginAttempt = () => {
    if (pin.length < 4) {
      setError('PIN MINIMAL 4 DIGIT');
      return;
    }

    const foundUser = users.find(u => u.pin === pin);
    if (foundUser) {
      onLogin(foundUser);
      setPin('');
      const modal = document.getElementById('login-modal') as HTMLDialogElement;
      if (modal) modal.close();
    } else {
      setError('PIN TIDAK VALID');
      setPin('');
    }
  };

  const startPress = (key: string) => setActiveKey(key);
  const endPress = () => setActiveKey(null);

  // Tombol statis tanpa trace klik
  const baseNumClass = "h-12 md:h-16 landscape:h-10 text-xl font-black rounded-[1.2rem] border border-gray-100 select-none touch-manipulation outline-none appearance-none flex items-center justify-center";

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
            ? 'bg-blue-600 text-white border-blue-600' 
            : (extraClass.includes('text-red') ? 'bg-red-50 border-red-100' : extraClass.includes('text-gray-400') ? 'bg-transparent border-transparent' : 'bg-white text-gray-700')
        }`}
        style={{ WebkitTouchCallout: 'none' }}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="bg-white flex flex-col landscape:flex-row min-h-fit overflow-hidden">
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 landscape:from-gray-50 landscape:to-gray-50 landscape:w-[240px] p-5 md:p-12 landscape:p-4 flex flex-col items-center justify-center text-center shrink-0">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none landscape:hidden">
          <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-white"></div>
          <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-white"></div>
        </div>

        <div className="relative z-10 w-14 h-14 landscape:w-11 landscape:h-11 bg-white/20 backdrop-blur-md rounded-2xl landscape:rounded-xl flex items-center justify-center mb-3 landscape:mb-2 border border-white/30 landscape:border-blue-100 landscape:bg-blue-600">
          <i className="fas fa-shield-halved text-white text-2xl landscape:text-lg"></i>
        </div>
        
        <div className="relative z-10 landscape:hidden mb-2">
          <h2 className="text-xl font-black text-white tracking-tight uppercase italic leading-none">SmartAccess</h2>
          <p className="text-[8px] text-blue-100 font-bold tracking-[0.2em] uppercase opacity-70">Secure Terminal</p>
        </div>

        <p className="hidden landscape:block text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mb-3">Security Check</p>

        <div className="relative z-10 bg-black/10 landscape:bg-transparent p-3 landscape:p-0 rounded-xl border border-white/10 landscape:border-0 mb-1">
          <div className="grid grid-cols-6 gap-2.5 landscape:gap-2 w-fit mx-auto h-6 items-center">
            {Array.from({ length: 12 }).map((_, i) => (
              <div 
                key={i} 
                className={`w-2.5 h-2.5 landscape:w-2 landscape:h-2 rounded-full border-2 transition-all duration-300 ${
                  i < pin.length 
                    ? 'bg-white border-white scale-110 landscape:bg-blue-600 landscape:border-blue-600' 
                    : 'bg-transparent border-white/20 landscape:border-gray-200'
                }`}
              ></div>
            ))}
          </div>
        </div>

        <div className="relative z-10 h-5 flex items-center justify-center">
          {error ? (
            <p className="text-white landscape:text-red-500 text-[9px] font-black uppercase tracking-widest animate-shake bg-red-500/60 landscape:bg-transparent px-3 py-0.5 rounded-full">{error}</p>
          ) : (
            <p className="text-[8px] text-blue-100 landscape:text-gray-400 font-bold uppercase tracking-[0.1em]">
              {pin.length > 0 ? `${pin.length} / 12 DIGIT` : 'ENTER AUTHORIZATION PIN'}
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 p-5 md:p-12 landscape:p-5 bg-white">
        <div className="grid grid-cols-3 gap-2.5 md:gap-4 landscape:gap-2 mb-5 landscape:mb-4 max-w-[320px] mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => 
            renderButton(num.toString(), num.toString(), () => handleKeyPress(num.toString()))
          )}
          
          {renderButton(
            <span className="text-[10px] font-black tracking-widest">CANCEL</span>, 
            "cancel", 
            handleCancelAction, 
            "text-red-500 border-red-50"
          )}
          
          {renderButton("0", "0", () => handleKeyPress("0"))}
          
          {renderButton(
            <i className="fas fa-backspace text-lg"></i>, 
            "backspace", 
            handleBackspace, 
            "text-gray-300 border-transparent"
          )}
        </div>

        <div className="max-w-[320px] mx-auto">
          <button 
            type="button"
            onClick={handleLoginAttempt}
            disabled={pin.length < 4}
            className={`w-full py-4 landscape:py-3 rounded-2xl landscape:rounded-xl font-black text-sm tracking-[0.2em] flex items-center justify-center gap-3 select-none outline-none ${
              pin.length >= 4 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            }`}
          >
            AUTHORIZE
          </button>
        </div>
      </div>
    </div>
  );
};

export default PinLogin;
