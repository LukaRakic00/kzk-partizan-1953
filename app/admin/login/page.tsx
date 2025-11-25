'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Lock, User } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Proveri da li je korisnik već prijavljen
    const token = localStorage.getItem('auth-token');
    if (token) {
      router.push('/admin');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiClient.login(formData.username, formData.password);
      
      // Sačekaj da se cookie postavi
      await new Promise(resolve => setTimeout(resolve, 100));
      
      toast.success('Uspešno ste se prijavili!');
      
      // Koristimo window.location.href da bi se cookie pročitao
      // Ovo će napraviti full page reload što će omogućiti middleware-u da pročita cookie
      window.location.href = '/admin';
    } catch (error: any) {
      toast.error(error.message || 'Greška pri prijavi');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-white to-gray-300 rounded-2xl flex items-center justify-center shadow-2xl"
          >
            <Lock className="text-black" size={40} />
          </motion.div>
          <h1 className="text-5xl font-bold font-playfair mb-3 tracking-tight">
            Admin Panel
          </h1>
          <p className="text-gray-400 font-montserrat text-sm uppercase tracking-wider">
            Prijavite se za pristup
          </p>
        </div>

        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onSubmit={handleSubmit}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 space-y-6 shadow-2xl"
        >
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-3 font-montserrat text-gray-300 uppercase tracking-wider">
              Korisničko Ime
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                id="username"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full bg-white/5 border border-white/10 px-4 pl-12 py-4 text-white font-montserrat focus:outline-none focus:border-white focus:bg-white/10 transition-all rounded-lg"
                placeholder="Unesite korisničko ime"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-3 font-montserrat text-gray-300 uppercase tracking-wider">
              Lozinka
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                id="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-white/5 border border-white/10 px-4 pl-12 py-4 text-white font-montserrat focus:outline-none focus:border-white focus:bg-white/10 transition-all rounded-lg"
                placeholder="Unesite lozinku"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-white to-gray-100 text-black px-6 py-4 font-bold font-montserrat uppercase tracking-wider hover:from-gray-100 hover:to-white transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                Prijava...
              </span>
            ) : (
              'Prijavi Se'
            )}
          </button>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-6"
        >
          <p className="text-gray-500 text-xs font-montserrat">
            KŽK Partizan © 2024
          </p>
        </motion.div>
      </motion.div>
    </main>
  );
}

