import React, { useState } from 'react';
import { Shield, Fingerprint, Lock, User, AlertCircle, LogIn } from 'lucide-react';

export default function Login() {
  const [authUserId, setAuthUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!authUserId.trim() || !password.trim()) {
      setError('Ingrese usuario y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auth_user_id: authUserId.trim(), password: password.trim() })
      });
      
      const json = await res.json();
      
      if (json.status === 'success') {
        localStorage.setItem('mock_user_id', json.data.auth_user_id);
        localStorage.setItem('siscc_user', JSON.stringify(json.data));
        window.location.reload();
      } else {
        setError(json.message || 'Credenciales inválidas.');
      }
    } catch (err) {
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center p-4">
      <div 
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl mb-4 shadow-lg shadow-blue-500/20">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">SICC</h1>
          <p className="text-xs text-gray-500 mt-1">Sistema de Intercompensación Cambiaria y Compensación</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <Fingerprint size={18} className="text-blue-400" />
            <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Iniciar Sesión</h2>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 text-red-400 text-xs">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">
                Usuario
              </label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  type="text"
                  value={authUserId}
                  onChange={(e) => setAuthUserId(e.target.value)}
                  placeholder="user_ejemplo"
                  className="w-full text-xs bg-[#161b22] border border-[#21262d] rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 font-mono transition-colors"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs bg-[#161b22] border border-[#21262d] rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 font-mono transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <LogIn size={14} />
                  Ingresar al Sistema
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#21262d]">
            <p className="text-[10px] text-gray-600 text-center">
              SICC v1.0 · Acceso restringido a personal autorizado
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
