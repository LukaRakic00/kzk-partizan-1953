'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LiveMatches from '@/components/LiveMatches';
import InteractiveBackground from '@/components/InteractiveBackground';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useParams } from 'next/navigation';

interface Player {
  _id: string;
  name: string;
  surname: string;
  position: string;
  number: number;
  year: number;
  image?: string;
  bio?: string;
  category?: string;
}

const categoryLabels: { [key: string]: string } = {
  seniori: 'SENIORI',
  pionirke: 'PIONIRKE',
  juniori: 'JUNIORI',
};

const categoryDescriptions: { [key: string]: string } = {
  seniori: 'Naša seniorska ekipa – iskustvo, snaga i liderstvo',
  pionirke: 'Mlade talente koje grade budućnost kluba',
  juniori: 'Najmlađi članovi našeg tima – budućnost košarke',
};

export default function IgraciCategoryPage() {
  const params = useParams();
  const category = params.category as string;
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    if (category) {
      loadPlayers();
    }
  }, [category, selectedYear]);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getPlayers(selectedYear || undefined, category);
      setPlayers(data);
      
      // Extract unique years from players
      const years = [...new Set(data.map((p: Player) => p.year))].sort((a, b) => b - a);
      setAvailableYears(years);
    } catch (error) {
      console.error('Error loading players:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!category || !['seniori', 'pionirke', 'juniori'].includes(category)) {
    return (
      <main className="min-h-screen relative">
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <InteractiveBackground />
        </div>
        <div className="relative z-10">
          <Navbar />
          <section className="pt-32 md:pt-40 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto text-center">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-playfair mb-4 text-white">
                Kategorija nije pronađena
              </h1>
              <Link
                href="/igraci"
                className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Nazad na Igrači</span>
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative">
      {/* Interactive Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <InteractiveBackground />
      </div>

      <div className="relative z-10">
        <Navbar />

        <section className="pt-32 md:pt-40 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Back Button */}
            <Link
              href="/tim"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-8 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Nazad na Tim</span>
            </Link>

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-playfair mb-4 sm:mb-6 uppercase tracking-wider text-white">
                {categoryLabels[category] || category.toUpperCase()}
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                {categoryDescriptions[category] || 'Naš tim košarkašica – snaga, talenat i posvećenost'}
              </p>
            </motion.div>

            {/* Year Filter */}
            {availableYears.length > 0 && (
              <div className="flex flex-wrap justify-center gap-3 mb-12">
                <button
                  onClick={() => setSelectedYear(null)}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    selectedYear === null
                      ? 'bg-white/20 border-white/40 text-white'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  Sve sezone
                </button>
                {availableYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`px-4 py-2 rounded-lg border transition-all ${
                      selectedYear === year
                        ? 'bg-white/20 border-white/40 text-white'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {year}/{year + 1}
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="text-center py-20">
                <div className="text-gray-400">Učitavanje...</div>
              </div>
            ) : players.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 sm:gap-8">
                {players.map((player, index) => (
                  <motion.div
                    key={player._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex flex-col items-center text-center"
                  >
                    <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-lg overflow-hidden border-4 border-white/20 shadow-xl mb-4 sm:mb-6">
                      {player.image ? (
                        <Image
                          src={player.image}
                          alt={`${player.name} ${player.surname}`}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-white/10 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-3xl sm:text-4xl font-bold text-white mb-1">
                              #{player.number}
                            </div>
                            <span className="text-gray-500 text-xs sm:text-sm">Slika</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mb-2">
                      <div className="text-xl sm:text-2xl font-bold text-white mb-1">
                        #{player.number}
                      </div>
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold font-playfair mb-2 text-white">
                        {player.name} {player.surname}
                      </h3>
                      <p className="text-sm sm:text-base md:text-lg text-gray-300 mb-1">
                        {player.position}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-400">
                        Sezona {player.year}/{player.year + 1}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-gray-400 text-lg">
                  {selectedYear
                    ? `Nema igrača za sezonu ${selectedYear}/${selectedYear + 1} u kategoriji ${categoryLabels[category]}`
                    : `Nema igrača u kategoriji ${categoryLabels[category]}`}
                </p>
              </div>
            )}
          </div>
        </section>

        <LiveMatches />
        <Footer />
      </div>
    </main>
  );
}

