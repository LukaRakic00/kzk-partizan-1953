'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LiveMatches from '@/components/LiveMatches';
import InteractiveBackground from '@/components/InteractiveBackground';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';
import { Trophy, Award, Star } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function IstorijatPage() {
  const [loading, setLoading] = useState(true);
  const [historyTitle, setHistoryTitle] = useState('KŽK Partizan 1953 – Tradicija, ponos i vrhunski rezultati');
  const [historyText, setHistoryText] = useState('');

  useEffect(() => {
    loadHistoryData();
  }, []);

  const loadHistoryData = async () => {
    try {
      setLoading(true);
      const titleSetting = await apiClient.getSettings('history_title');
      if (titleSetting && titleSetting.value) {
        setHistoryTitle(titleSetting.value);
      }

      const textSetting = await apiClient.getSettings('history_text');
      if (textSetting && textSetting.value) {
        setHistoryText(textSetting.value);
      } else {
        // Default tekst
        setHistoryText(`Od 1953. godine, KŽK Partizan je jedan od najstarijih i najuspešnijih klubova u okviru Jugoslovenskog sportskog društva Partizan. Kroz decenije bogate istorije, naš klub je ostavio neizbrisiv trag na mapi ženske košarke – u Srbiji, regionu, Evropi i svetu.

Zlatnim slovima u istoriju kluba upisala se generacija iz sezone 1984/85, koja je osvojila duplu krunu predvođena legendama poput Jelice Komnenović, Bibe Majstorović i Olje Krivokapić.

Posebno mesto zauzima i slavna generacija iz sezona 2009–2012, pod vođstvom Marine Maljković, u kojoj su nastupale Milica Dabović, Dajana Butulija, Saša Čađo, Tamara Radočaj, Nevena Jovanović i brojne druge reprezentativke. Ova ekipa bila je srce i oslonac ženske košarkaške reprezentacije Srbije, koja je u tom periodu osvojila dve titule prvaka Evrope i bronzanu medalju na Olimpijskim igrama u Riju.

KŽK Partizan 1953 s ponosom ističe da od osnivanja do danas nije imao nijedan dinar poreskog duga prema državi. Za primer poslovne odgovornosti, klub je 3. novembra 2022. godine dobio sertifikat pouzdane organizacije u Srbiji, na osnovu izveštaja Agencije za privredne registre (APR), sa serijskim brojem sertifikata: CWBO-22-42237 (CompanyWall Business).`);
      }
    } catch (error) {
      console.error('Error loading history content:', error);
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
          <div className="max-w-6xl mx-auto">
            {loading ? (
              <div className="text-center py-20">
                <div className="text-gray-400">Učitavanje istorije...</div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-12"
              >
                {/* Naslov */}
                <div className="text-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center justify-center mb-6"
                  >
                    <Trophy className="mr-3 text-yellow-400" size={32} />
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-playfair uppercase tracking-wider text-white">
                      Istorijat Kluba
                    </h1>
                    <Trophy className="ml-3 text-yellow-400" size={32} />
                  </motion.div>
                  <div className="w-32 h-1 bg-gradient-to-r from-transparent via-white to-transparent mx-auto mb-8"></div>
                </div>

                {/* Glavni Naslov */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center"
                >
                  <h2 className="text-3xl md:text-4xl font-bold font-playfair mb-8 text-white leading-tight">
                    {historyTitle}
                  </h2>
                </motion.div>

                {/* Tekst */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8 md:p-12 shadow-xl"
                >
                  <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed">
                    <ReactMarkdown>{historyText}</ReactMarkdown>
                  </div>

                  {/* Highlight sekcija za sertifikat */}
                  {historyText.includes('sertifikat') && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 }}
                      className="mt-8 p-6 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-lg"
                    >
                      <div className="flex items-start">
                        <Award className="text-yellow-400 mr-4 flex-shrink-0 mt-1" size={24} />
                        <div>
                          <h3 className="text-xl font-bold font-playfair mb-2 text-yellow-300">
                            Sertifikat Pouzdane Organizacije
                          </h3>
                          <p className="text-gray-200">
                            KŽK Partizan 1953 je 3. novembra 2022. godine dobio sertifikat pouzdane organizacije u Srbiji, 
                            na osnovu izveštaja Agencije za privredne registre (APR), sa serijskim brojem sertifikata: 
                            <span className="font-bold text-white"> CWBO-22-42237</span> (CompanyWall Business).
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>

                {/* Istaknute generacije */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {/* Generacija 1984/85 */}
                  {historyText.includes('1984/85') && (
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
                      <div className="flex items-center mb-4">
                        <Star className="text-yellow-400 mr-2" size={24} />
                        <h3 className="text-xl font-bold font-playfair text-white">Sezona 1984/85</h3>
                      </div>
                      <p className="text-gray-300 leading-relaxed">
                        Dupla kruna osvojena pod vođstvom legendarne generacije: Jelica Komnenović, Biba Majstorović i Olja Krivokapić.
                      </p>
                    </div>
                  )}

                  {/* Generacija 2009-2012 */}
                  {historyText.includes('2009–2012') && (
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
                      <div className="flex items-center mb-4">
                        <Star className="text-yellow-400 mr-2" size={24} />
                        <h3 className="text-xl font-bold font-playfair text-white">Sezone 2009–2012</h3>
                      </div>
                      <p className="text-gray-300 leading-relaxed">
                        Pod vođstvom Marine Maljković, ekipa je bila srce ženske košarkaške reprezentacije Srbije koja je osvojila dve titule prvaka Evrope i bronzanu medalju na Olimpijskim igrama u Riju.
                      </p>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </div>
        </section>

        <LiveMatches />
        <Footer />
      </div>
    </main>
  );
}

