'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LiveMatches from '@/components/LiveMatches';
import InteractiveBackground from '@/components/InteractiveBackground';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface Team {
  season?: string;
  title?: string;
  description?: string;
  teamImage?: string;
}

export default function TimPage() {
  const [teamData, setTeamData] = useState({
    season: '2024/25',
    title: 'Tim košarkaškog kluba partizan 1953 za 2024/25 godinu',
    description: 'Sa ponosom vam predstavljamo naš tim za 2024/25. godinu – snagu, strast i talenat koji će nas voditi ka novim pobedama!',
    teamImage: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const team = await apiClient.getTeam() as Team | null;
      if (team) {
        setTeamData({
          season: team.season || '2024/25',
          title: team.title || 'Tim košarkaškog kluba partizan 1953 za 2024/25 godinu',
          description: team.description || 'Sa ponosom vam predstavljamo naš tim za 2024/25. godinu – snagu, strast i talenat koji će nas voditi ka novim pobedama!',
          teamImage: team.teamImage || '',
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
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

      <section className="pt-32 md:pt-40 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="text-center py-20">
                <div className="text-gray-400">Učitavanje...</div>
              </div>
            ) : (
              <div className="space-y-16">
                {/* Tim Sekcija */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-playfair mb-4 sm:mb-6 uppercase tracking-wider text-white">
                    {teamData.title}
            </h1>
                  <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                    {teamData.description}
            </p>
          </motion.div>

                {/* Slika Tima */}
                {teamData.teamImage && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="relative w-full max-w-3xl mx-auto aspect-[16/9] rounded-lg overflow-hidden border border-white/10 shadow-xl"
                  >
                    <Image
                      src={teamData.teamImage}
                      alt="Tim"
                      fill
                      className="object-cover"
                    />
                  </motion.div>
                )}
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
