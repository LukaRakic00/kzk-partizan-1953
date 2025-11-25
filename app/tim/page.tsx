'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LiveMatches from '@/components/LiveMatches';
import InteractiveBackground from '@/components/InteractiveBackground';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface Management {
  _id: string;
  name: string;
  position: string;
  image?: string;
  order: number;
}

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
  const [management, setManagement] = useState<Management[]>([]);
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
      const mgmt = await apiClient.getManagement();
      setManagement(mgmt.sort((a, b) => a.order - b.order));
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

      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
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

                {/* Rukovodstvo Sekcija */}
                {management.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-16 sm:mt-20"
                      >
                    <div className="text-center mb-8 sm:mb-12">
                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-playfair uppercase tracking-wider text-white mb-4">
                        RUKOVODSTVO ŽENSKOG KOŠARKAŠKOG KLUBA PARTIZAN 1953
                      </h2>
                      <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
                        Sa zadovoljstvom vam predstavljamo rukovodstvo našeg kluba – ljude posvećene viziji, razvoju i uspehu KŽK Partizan!
                      </p>
                              </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 sm:gap-8">
                      {management.map((member, index) => (
                          <motion.div
                          key={member._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                          className="flex flex-col items-center text-center"
                          >
                          <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-white/20 shadow-xl mb-4 sm:mb-6">
                            {member.image ? (
                                <Image
                                src={member.image}
                                alt={member.name}
                                  fill
                                className="object-cover"
                                />
                              ) : (
                              <div className="w-full h-full bg-white/10 flex items-center justify-center">
                                <span className="text-gray-500 text-sm sm:text-base">Slika</span>
                                </div>
                              )}
                            </div>
                          <h3 className="text-lg sm:text-xl md:text-2xl font-bold font-playfair mb-2 text-white">
                            {member.name}
                              </h3>
                          <p className="text-sm sm:text-base md:text-lg text-gray-300">
                            {member.position}
                          </p>
                          </motion.div>
                        ))}
                      </div>
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

