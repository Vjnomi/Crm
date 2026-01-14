
import React, { useState } from 'react';
import { User } from '../types';

interface RoleSwitcherProps {
  users: User[];
  currentUser: User | null;
  onSwitch: (user: User) => void;
}

const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ users, currentUser, onSwitch }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-[200]">
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-72 bg-white rounded-[2rem] shadow-2xl border border-slate-200 p-6 animate-in slide-in-from-bottom-4 duration-300">
          <div className="mb-4 flex justify-between items-center">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Persona Switcher</h4>
            <button onClick={() => setIsOpen(false)} className="text-slate-300 hover:text-slate-600">✕</button>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {users.map(user => (
              <button
                key={user.id}
                onClick={() => {
                  onSwitch(user);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                  currentUser?.id === user.id 
                    ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                    : 'border-slate-100 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${
                  currentUser?.id === user.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {user.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className={`text-[11px] font-black uppercase truncate ${currentUser?.id === user.id ? 'text-primary' : 'text-slate-700'}`}>
                    {user.name}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate">
                    {user.customRoleId?.replace('r-acme-', '').replace('r-', '').toUpperCase() || user.role}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl hover:scale-110 active:scale-95 transition-all border-4 border-white group"
      >
        <span className="group-hover:rotate-12 transition-transform">👤</span>
      </button>
    </div>
  );
};

export default RoleSwitcher;
