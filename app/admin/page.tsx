'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';
import { Users, Newspaper, Image as ImageIcon, BookOpen, TrendingUp, Sparkles, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    players: 0,
    news: 0,
    galleries: 0,
    history: 0,
  });
  const [loading, setLoading] = useState(true);
  const [wabaUpdating, setWabaUpdating] = useState(false);
  const [wabaLastUpdate, setWabaLastUpdate] = useState<string | null>(null);
  const [wabaStatus, setWabaStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    loadStats();
    loadWabaStatus();
  }, []);

  const loadStats = async () => {
    try {
      const [players, news, galleries, history] = await Promise.all([
        apiClient.getPlayers(),
        apiClient.getNews(),
        apiClient.getGalleries(),
        apiClient.getHistory(),
      ]);

      setStats({
        players: players.length,
        news: news.length,
        galleries: galleries.length,
        history: history.length,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWabaStatus = async () => {
    try {
      const response = await fetch('/api/waba/standings');
      if (response.ok) {
        const data = await response.json();
        if (data.lastUpdated) {
          setWabaLastUpdate(data.lastUpdated);
        }
      }
    } catch (error) {
      console.error('Error loading WABA status:', error);
    }
  };

  const handleWabaUpdate = async () => {
    try {
      setWabaUpdating(true);
      setWabaStatus('idle');
      
      const response = await fetch('/api/waba/init', {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Greška pri ažuriranju WABA lige');
      }

      const data = await response.json();
      
      setWabaStatus('success');
      setWabaLastUpdate(new Date().toISOString());
      toast.success(`WABA liga uspešno ažurirana! Učitano ${data.standings?.length || 0} timova.`);
      
      setTimeout(() => {
        setWabaStatus('idle');
      }, 3000);
    } catch (error: any) {
      console.error('Error updating WABA:', error);
      setWabaStatus('error');
      toast.error(error.message || 'Greška pri ažuriranju WABA lige');
      
      setTimeout(() => {
        setWabaStatus('idle');
      }, 5000);
    } finally {
      setWabaUpdating(false);
    }
  };

  const statCards = [
    { 
      label: 'Igrači', 
      value: stats.players, 
      icon: Users, 
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    { 
      label: 'Vesti', 
      value: stats.news, 
      icon: Newspaper, 
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    { 
      label: 'Galerije', 
      value: stats.galleries, 
      icon: ImageIcon, 
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20'
    },
    { 
      label: 'Istorijat', 
      value: stats.history, 
      icon: BookOpen, 
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20'
    },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 md:gap-4"
      >
        <div className="w-1 h-8 md:h-12 bg-gradient-to-b from-white to-transparent"></div>
        <div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-playfair mb-1 md:mb-2 tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-gray-400 font-montserrat text-xs md:text-sm uppercase tracking-wider">
            Dobrodošli u kontrolnu tablu
          </p>
        </div>
      </motion.div>

      {loading ? (
        <div className="text-center py-12 md:py-20">
          <div className="inline-block animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-t-2 border-b-2 border-white mb-4"></div>
          <div className="text-gray-400 font-montserrat text-sm md:text-base">Učitavanje podataka...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`${stat.bgColor} border ${stat.borderColor} rounded-lg p-4 md:p-6 hover:scale-[1.02] md:hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden`}
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                     style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
                ></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <div className={`w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon size={24} className="md:w-7 md:h-7 text-white" />
                    </div>
                    <Sparkles className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block" size={20} />
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl md:text-4xl font-bold font-playfair text-white group-hover:text-white transition-colors">
                      {stat.value}
                    </div>
                    <div className="text-gray-300 text-xs md:text-sm font-montserrat uppercase tracking-wider font-medium">
                      {stat.label}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* WABA Liga Ažuriranje Sekcija */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-lg"
      >
        <div className="mb-4">
          <h2 className="text-xl sm:text-2xl font-bold font-playfair uppercase tracking-wider mb-2">
            WABA Liga Ažuriranje
          </h2>
          <p className="text-gray-400 text-sm">
            Ažuriraj podatke WABA lige iz baze podataka. Scraping može potrajati 10-30 sekundi.
          </p>
          {wabaLastUpdate && (
            <p className="text-gray-500 text-xs mt-2">
              Poslednje ažuriranje: {new Date(wabaLastUpdate).toLocaleString('sr-RS')}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleWabaUpdate}
            disabled={wabaUpdating}
            className={`px-6 py-3 font-semibold uppercase tracking-wider transition-all flex items-center gap-2 ${
              wabaStatus === 'success'
                ? 'bg-green-500 text-white'
                : wabaStatus === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-white text-black hover:bg-gray-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {wabaUpdating ? (
              <>
                <RefreshCw className="animate-spin" size={20} />
                <span>Ažuriranje...</span>
              </>
            ) : wabaStatus === 'success' ? (
              <>
                <CheckCircle2 size={20} />
                <span>Uspešno Ažurirano</span>
              </>
            ) : wabaStatus === 'error' ? (
              <>
                <AlertCircle size={20} />
                <span>Greška</span>
              </>
            ) : (
              <>
                <RefreshCw size={20} />
                <span>Ažuriraj WABA Ligu</span>
              </>
            )}
          </button>
          
          {wabaUpdating && (
            <div className="text-gray-400 text-sm">
              Molimo sačekajte, scraping je u toku...
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 md:mt-12 p-4 md:p-6 bg-white/5 border border-white/10 rounded-lg"
      >
        <h2 className="text-lg md:text-xl font-playfair font-semibold mb-3 md:mb-4">Brzi pregled</h2>
        <p className="text-gray-400 font-montserrat text-xs md:text-sm leading-relaxed">
          Koristite meni sa leve strane za navigaciju kroz različite sekcije admin panela. 
          Možete upravljati igračima, vestima, galerijama, istorijatom kluba i još mnogo toga.
        </p>
      </motion.div>
    </div>
  );
}

