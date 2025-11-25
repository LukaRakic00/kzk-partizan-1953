'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LiveMatches from '@/components/LiveMatches';
import InteractiveBackground from '@/components/InteractiveBackground';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { FileText, Download } from 'lucide-react';

export default function StatusKlubaPage() {
  const [statutImage, setStatutImage] = useState<string>('');
  const [statutPdfUrl, setStatutPdfUrl] = useState<string>('https://kzkpartizan1953.rs/wp-content/uploads/2025/05/statut-kzk-partizan-1953.pdf');
  const [antidopingPdfUrl, setAntidopingPdfUrl] = useState<string>('https://kzkpartizan1953.rs/wp-content/uploads/2025/05/2025-34-0527-1-Obavestenje-nacionalnim-sportskim-savezima-infuzije.pdf');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const statutImageSetting = await apiClient.getSettings('statut_image');
      if (statutImageSetting && statutImageSetting.value) {
        setStatutImage(statutImageSetting.value);
      }
      const statutPdfSetting = await apiClient.getSettings('statut_pdf_url');
      if (statutPdfSetting && statutPdfSetting.value) {
        setStatutPdfUrl(statutPdfSetting.value);
      }
      const antidopingPdfSetting = await apiClient.getSettings('antidoping_pdf_url');
      if (antidopingPdfSetting && antidopingPdfSetting.value) {
        setAntidopingPdfUrl(antidopingPdfSetting.value);
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

        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {loading ? (
              <div className="text-center py-20">
                <div className="text-gray-400">Učitavanje...</div>
              </div>
            ) : (
              <div className="space-y-12">
                {/* Naslov */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mb-8"
                >
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-playfair mb-4 sm:mb-6 uppercase tracking-wider text-white">
                    Statut ženskog košarkaškog kluba partizan 1953
                  </h1>
                </motion.div>

                {/* Slika Statuta */}
                {statutImage && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="relative w-full max-w-2xl sm:max-w-3xl mx-auto aspect-[16/9] rounded-lg overflow-hidden border border-white/10 shadow-xl mb-8"
                  >
                    <Image
                      src={statutImage}
                      alt="Statut"
                      fill
                      className="object-cover"
                    />
                  </motion.div>
                )}

                {/* Dugmad */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center"
                >
                  {/* Statut Dugme */}
                  <a
                    href={statutPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-white text-black px-6 sm:px-8 py-3 sm:py-4 font-bold uppercase tracking-wider hover:bg-gray-200 transition-all flex items-center gap-3 rounded-lg shadow-lg hover:shadow-xl w-full sm:w-auto justify-center"
                  >
                    <FileText size={24} className="group-hover:scale-110 transition-transform" />
                    <span className="text-base sm:text-lg">STATUT</span>
                    <Download size={20} className="group-hover:translate-y-1 transition-transform" />
                  </a>

                  {/* Antidoping Dugme */}
                  <a
                    href={antidopingPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-white/10 text-white border-2 border-white/30 px-6 sm:px-8 py-3 sm:py-4 font-bold uppercase tracking-wider hover:bg-white/20 hover:border-white transition-all flex items-center gap-3 rounded-lg shadow-lg hover:shadow-xl w-full sm:w-auto justify-center"
                  >
                    <FileText size={24} className="group-hover:scale-110 transition-transform" />
                    <span className="text-base sm:text-lg">Dopis Antidoping agencije Republike Srbije</span>
                    <Download size={20} className="group-hover:translate-y-1 transition-transform" />
                  </a>
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
