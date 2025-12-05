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

interface Management {
  _id: string;
  name: string;
  position: string;
  image?: string;
  type: 'upravni_odbor' | 'menadzment' | 'rukovodstvo';
  order: number;
}

export default function StrucniStabPage() {
  const [rukovodstvo, setRukovodstvo] = useState<Management[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const mgmt = await apiClient.getManagement();
      // Filter only rukovodstvo (coaching staff)
      const rukovodstvoData = mgmt
        .filter((m: Management) => m.type === 'rukovodstvo')
        .sort((a, b) => a.order - b.order);
      setRukovodstvo(rukovodstvoData);
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
                STRUČNI ŠTAB
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                Naš stručni štab – iskusni treneri i stručnjaci koji vode tim ka uspehu
              </p>
            </motion.div>

            {loading ? (
              <div className="text-center py-20">
                <div className="text-gray-400">Učitavanje...</div>
              </div>
            ) : rukovodstvo.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 sm:gap-8">
                {rukovodstvo.map((member, index) => (
                  <motion.div
                    key={member._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
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
              <div className="text-center py-20">
                <p className="text-gray-400 text-lg">Stručni štab će biti dodat uskoro.</p>
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

