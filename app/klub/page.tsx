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
  type: 'upravni_odbor' | 'menadzment' | 'rukovodstvo';
  order: number;
}

interface Team {
  season?: string;
  title?: string;
  description?: string;
  upravniOdborImage?: string;
  menadzmentImage?: string;
  rukovodstvoImage?: string;
}

export default function KlubPage() {
  const [teamData, setTeamData] = useState<Team>({});
  const [upravniOdbor, setUpravniOdbor] = useState<Management[]>([]);
  const [menadzment, setMenadzment] = useState<Management[]>([]);
  const [rukovodstvo, setRukovodstvo] = useState<Management[]>([]);
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
          upravniOdborImage: team.upravniOdborImage || '',
          menadzmentImage: team.menadzmentImage || '',
          rukovodstvoImage: team.rukovodstvoImage || '',
        });
      }
      const mgmt = await apiClient.getManagement();
      setUpravniOdbor(mgmt.filter((m: Management) => m.type === 'upravni_odbor').sort((a, b) => a.order - b.order));
      setMenadzment(mgmt.filter((m: Management) => m.type === 'menadzment').sort((a, b) => a.order - b.order));
      setRukovodstvo(mgmt.filter((m: Management) => m.type === 'rukovodstvo').sort((a, b) => a.order - b.order));
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
                {/* Upravni Odbor Sekcija */}
                <motion.div
                  id="upravni-odbor"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="scroll-mt-32"
                >
                  <div className="text-center mb-8 sm:mb-12">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-playfair uppercase tracking-wider text-white mb-4">
                      UPRAVNI ODBOR
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
                      Sa zadovoljstvom vam predstavljamo upravni odbor našeg kluba – ljude posvećene viziji, razvoju i uspehu KŽK Partizan!
                    </p>
                  </div>

                  {upravniOdbor.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 sm:gap-8 mb-8">
                      {upravniOdbor.map((member, index) => (
                        <motion.div
                          key={member._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
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
                  ) : (
                    <p className="text-center text-gray-400 mb-8">Upravni odbor će biti dodat uskoro.</p>
                  )}

                  {teamData.upravniOdborImage && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 }}
                      className="relative w-full max-w-3xl mx-auto aspect-[16/9] rounded-lg overflow-hidden border border-white/10 shadow-xl"
                    >
                      <Image
                        src={teamData.upravniOdborImage}
                        alt="Upravni Odbor"
                        fill
                        className="object-cover"
                      />
                    </motion.div>
                  )}
                </motion.div>

                {/* Menadžment Sekcija */}
                <motion.div
                  id="menadzment"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="scroll-mt-32"
                >
                  <div className="text-center mb-8 sm:mb-12">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-playfair uppercase tracking-wider text-white mb-4">
                      MENADŽMENT
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
                      Sa zadovoljstvom vam predstavljamo menadžment našeg kluba – ljude posvećene viziji, razvoju i uspehu KŽK Partizan!
                    </p>
                  </div>

                  {menadzment.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 sm:gap-8 mb-8">
                      {menadzment.map((member, index) => (
                        <motion.div
                          key={member._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
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
                  ) : (
                    <p className="text-center text-gray-400 mb-8">Menadžment će biti dodat uskoro.</p>
                  )}

                  {teamData.menadzmentImage && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 }}
                      className="relative w-full max-w-3xl mx-auto aspect-[16/9] rounded-lg overflow-hidden border border-white/10 shadow-xl"
                    >
                      <Image
                        src={teamData.menadzmentImage}
                        alt="Menadžment"
                        fill
                        className="object-cover"
                      />
                    </motion.div>
                  )}
                </motion.div>

                {/* Rukovodstvo Sekcija */}
                <motion.div
                  id="rukovodstvo"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="scroll-mt-32"
                >
                  <div className="text-center mb-8 sm:mb-12">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-playfair uppercase tracking-wider text-white mb-4">
                      RUKOVODSTVO
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
                      Sa zadovoljstvom vam predstavljamo rukovodstvo našeg kluba – ljude posvećene viziji, razvoju i uspehu KŽK Partizan!
                    </p>
                  </div>

                  {rukovodstvo.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 sm:gap-8 mb-8">
                      {rukovodstvo.map((member, index) => (
                        <motion.div
                          key={member._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6 + index * 0.1 }}
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
                  ) : (
                    <p className="text-center text-gray-400 mb-8">Rukovodstvo će biti dodato uskoro.</p>
                  )}

                  {teamData.rukovodstvoImage && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 }}
                      className="relative w-full max-w-3xl mx-auto aspect-[16/9] rounded-lg overflow-hidden border border-white/10 shadow-xl"
                    >
                      <Image
                        src={teamData.rukovodstvoImage}
                        alt="Rukovodstvo"
                        fill
                        className="object-cover"
                      />
                    </motion.div>
                  )}
                </motion.div>
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

