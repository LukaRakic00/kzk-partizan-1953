'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LiveMatches from '@/components/LiveMatches';
import InteractiveBackground from '@/components/InteractiveBackground';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import CloudinaryImage from '@/components/CloudinaryImage';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Player, categoryLabels, categoryDescriptions } from '@/types';

export default function IgraciPage() {
  const [playersByCategory, setPlayersByCategory] = useState<{ [key: string]: Player[] }>({
    seniori: [],
    juniori: [],
    kadetkinje: [],
    pionirke: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    loadPlayers();
  }, [selectedYear]);

  useEffect(() => {
    // Handle hash navigation on mount
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.slice(1);
      if (hash && ['seniori', 'juniori', 'kadetkinje', 'pionirke'].includes(hash)) {
        setTimeout(() => {
          const element = document.getElementById(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 500);
      }
    }
  }, [loading]);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const categories = ['seniori', 'juniori', 'kadetkinje', 'pionirke'];
      const allPlayers: Player[] = [];
      
      // Load players for all categories
      for (const category of categories) {
        const data = await apiClient.getPlayers(selectedYear || undefined, category);
        allPlayers.push(...data);
      }
      
      // Group by category
      const grouped: { [key: string]: Player[] } = {
        seniori: [],
        juniori: [],
        kadetkinje: [],
        pionirke: [],
      };
      
      allPlayers.forEach((player) => {
        const category = player.category || 'seniori';
        if (grouped[category]) {
          grouped[category].push(player);
        }
      });
      
      setPlayersByCategory(grouped);
      
      // Extract unique years from all players
      const years = [...new Set(allPlayers.map((p: Player) => p.year))].sort((a, b) => b - a);
      setAvailableYears(years);
    } catch (error) {
      console.error('Error loading players:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative">
      {/* Interactive Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <InteractiveBackground />
      </div>

      <div className="relative z-10">
        <Navbar />

        <section className="pt-40 md:pt-48 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-playfair mb-4 sm:mb-6 uppercase tracking-wider text-white">
                IGRAČI
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                Naš tim košarkašica – snaga, talenat i posvećenost
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
            ) : (
              <div className="space-y-16">
                {(['seniori', 'juniori', 'kadetkinje', 'pionirke'] as const).map((category) => {
                  const players = playersByCategory[category] || [];
                  return (
                    <motion.div
                      key={category}
                      id={category}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="scroll-mt-32"
                    >
                      <div className="sticky top-24 z-40 bg-black/80 backdrop-blur-sm py-4 mb-8 border-b border-white/10 text-center">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-playfair mb-4 sm:mb-6 uppercase tracking-wider text-white">
                          {categoryLabels[category]}
                        </h2>
                        <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                          {categoryDescriptions[category]}
                        </p>
                      </div>

                      {players.length > 0 ? (
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
                                {player.image && typeof player.image === 'string' && player.image.trim() !== '' ? (
                                  player.image.includes('cloudinary.com') ? (
                                    <CloudinaryImage
                                      src={player.image}
                                      alt={`${player.name} ${player.surname}`}
                                      fill
                                      sizes="(max-width: 640px) 128px, (max-width: 768px) 160px, 192px"
                                      className="object-cover"
                                    />
                                  ) : (
                                    <Image
                                      src={player.image}
                                      alt={`${player.name} ${player.surname}`}
                                      fill
                                      sizes="(max-width: 640px) 128px, (max-width: 768px) 160px, 192px"
                                      className="object-cover"
                                      unoptimized
                                    />
                                  )
                                ) : (
                                  <Image
                                    src="/kzk_partizan.png"
                                    alt={`${player.name} ${player.surname}`}
                                    fill
                                    sizes="(max-width: 640px) 128px, (max-width: 768px) 160px, 192px"
                                    className="object-contain p-4"
                                    unoptimized
                                  />
                                )}
                              </div>
                              <div className="mb-2">
                                <div className="text-xl sm:text-2xl font-bold text-white mb-1">
                                  #{player.number}
                                </div>
                                <h3 className="text-lg sm:text-xl md:text-2xl font-bold font-playfair mb-2 text-white">
                                  {player.name} {player.surname}
                                </h3>
                                {player.position && (
                                  <p className="text-sm sm:text-base md:text-lg text-gray-300 mb-1">
                                    {player.position}
                                  </p>
                                )}
                                <p className="text-xs sm:text-sm text-gray-400">
                                  Sezona {player.year}/{player.year + 1}
                                </p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-10">
                          <p className="text-gray-400 text-lg">
                            {selectedYear
                              ? `Nema igrača za sezonu ${selectedYear}/${selectedYear + 1} u kategoriji ${categoryLabels[category]}`
                              : `Nema igrača u kategoriji ${categoryLabels[category]}`}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
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

