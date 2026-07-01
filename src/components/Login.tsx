import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Lock, User, TrendingUp } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Enforce exact credentials
    setTimeout(() => {
      if (username === 'ehsan' && password === 'ehsan@26') {
        onLoginSuccess();
      } else {
        setError('نام کاربری یا رمز عبور اشتباه است / Invalid credentials');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div id="login-container" className="min-h-screen bg-[#0a0a0b] flex flex-col items-center justify-center relative overflow-hidden px-4 font-sans selection:bg-blue-500 selection:text-white">
      {/* Decorative ambient gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="w-full max-w-md bg-[#16161a] border border-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl relative z-10"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl mb-4 text-blue-400 shadow-lg shadow-blue-500/5">
            <TrendingUp size={28} />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight" dir="rtl">
            سامانه نظارت هوشمند حاکمیت شرکتی
          </h2>
          <p className="text-sm text-neutral-400 mt-1 font-mono">
            Bank Sepah Investment Management
          </p>
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-4" />
          <p className="text-xs text-blue-400 font-semibold" dir="rtl">
            پنل مدیران عامل ارشد و مدیران هلدینگ
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-mono text-neutral-400 mb-1.5 uppercase tracking-wider" htmlFor="username">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                <User size={18} />
              </span>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0b] border border-white/10 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-mono"
                placeholder="Enter 'ehsan'"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-neutral-400 mb-1.5 uppercase tracking-wider" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                <Lock size={18} />
              </span>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0b] border border-white/10 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-mono"
                placeholder="Enter 'ehsan@26'"
                required
              />
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-3 bg-red-950/30 border border-red-900/50 text-red-400 text-xs rounded-lg text-center font-medium"
              dir="rtl"
            >
              {error}
            </motion.div>
          )}

          <button
            id="login-submit"
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-lg shadow-lg shadow-blue-500/15 hover:shadow-blue-500/25 active:translate-y-px transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck size={18} />
                <span dir="rtl">ورود امن به سامانه</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-neutral-500">
            SECURE ACCESS PORTAL &bull; 256-BIT ENCRYPTION
          </p>
        </div>
      </motion.div>
    </div>
  );
}
