
import React, { useState } from 'react';
import { Lock, User, Rocket, AlertCircle } from 'lucide-react';

interface AdminLoginProps {
  onLogin: (user: string, pass: string) => void;
  error?: string | null;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className="min-h-[100dvh] bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="p-8 pb-10 bg-blue-600 text-white text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
          <div className="bg-white/20 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md relative z-10">
            <Rocket className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold relative z-10">Dgital Soluctions</h2>
          <p className="text-blue-100 text-[10px] md:text-xs uppercase font-bold tracking-widest mt-1 relative z-10 opacity-80">Acesso Administrativo</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-3 text-red-600 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">E-mail ou Usuário</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                placeholder="Ex: admin"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] text-sm mt-2"
          >
            Entrar no CRM
          </button>
          
          <div className="pt-4 text-center">
            <p className="text-[9px] text-gray-400 uppercase font-bold tracking-[0.2em]">
              Dgital Soluctions & SQLite Cloud
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
