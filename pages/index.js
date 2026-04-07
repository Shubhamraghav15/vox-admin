import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Lock, Award, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if already logged in
    if (typeof window !== 'undefined') {
      const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
      if (isLoggedIn === 'true') {
        router.push('/dashboard');
      }
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/login', { password });
      if (response.data.success) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('isAdminLoggedIn', 'true');
          router.push('/dashboard');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 bg-[#111] rounded-3xl flex items-center justify-center mb-6 mx-auto border border-[#222] shadow-[0_0_30px_rgba(255,106,0,0.1)]">
            <Award className="w-10 h-10 text-[#ff6a00]" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">VOX ADMIN</h1>
          <p className="text-gray-500 text-sm font-medium uppercase tracking-widest">Control Panel Access</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-[#111] p-10 rounded-[2.5rem] border border-[#222] shadow-2xl"
        >
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">
                Admin Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-600 group-focus-within:text-[#ff6a00] transition-colors" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0a0a0a] border border-[#222] text-white text-lg rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-[#ff6a00] focus:ring-4 focus:ring-[#ff6a00]/10 transition-all placeholder:text-gray-800"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 bg-red-950/20 border border-red-900/30 text-red-400 p-4 rounded-2xl text-sm font-medium"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#ff6a00] hover:bg-[#ff7a1a] disabled:opacity-50 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-[0_10px_30px_rgba(255,106,0,0.2)] group"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  ENTER DASHBOARD
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        <p className="text-center mt-10 text-gray-600 text-xs font-medium">
          Authorized personnel only. All access attempts are logged.
        </p>
      </div>
    </div>
  );
}
