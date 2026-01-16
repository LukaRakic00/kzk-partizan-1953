'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LiveMatches from '@/components/LiveMatches';
import InteractiveBackground from '@/components/InteractiveBackground';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Trophy, Award, Star, FileText, Download, Medal, Crown, Globe } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ONamaPage() {
  const [loading, setLoading] = useState(true);
  const [aboutTitle, setAboutTitle] = useState('KŽK PARTIZAN 1953');
  const [aboutText, setAboutText] = useState('');
  const [historyTitle, setHistoryTitle] = useState('KŽK Partizan 1953 – Tradicija, ponos i vrhunski rezultati');
  const [historyText, setHistoryText] = useState('');
  const [statutImage, setStatutImage] = useState<string>('');
  const [statutPdfUrl, setStatutPdfUrl] = useState<string>('https://kzkpartizan1953.rs/wp-content/uploads/2025/05/statut-kzk-partizan-1953.pdf');
  const [antidopingPdfUrl, setAntidopingPdfUrl] = useState<string>('https://kzkpartizan1953.rs/wp-content/uploads/2025/05/2025-34-0527-1-Obavestenje-nacionalnim-sportskim-savezima-infuzije.pdf');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Učitaj "O nama" sekciju
      const aboutTitleSetting = await apiClient.getSettings('about_title');
      if (aboutTitleSetting && aboutTitleSetting.value) {
        setAboutTitle(aboutTitleSetting.value);
      }

      const aboutTextSetting = await apiClient.getSettings('about_text');
      if (aboutTextSetting && aboutTextSetting.value) {
        setAboutText(aboutTextSetting.value);
      } else {
        // Default tekst
        setAboutText('KŽK Partizan 1953 je ženski košarkaški klub sa bogatom tradicijom i velikim uspehom u domaćim i međunarodnim takmičenjima. Osnovan 1953. godine, klub je postao simbol istrajnosti, timskog duha i posvećenosti sportu. Kroz decenije, KŽK Partizan je iznedrio mnoge vrhunske igračice koje su ostavile značajan trag u ženskoj košarci. Klub se ponosi svojim radom na razvoju mladih talenata i promociji ženskog sporta, pružajući inspiraciju i podršku svim generacijama sportistkinja. Sa jasnim ciljevima i jakom zajednicom, KŽK Partizan 1953 nastavlja da gradi uspešnu budućnost i širi ljubav prema košarci.');
      }

      // Učitaj istorijat
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

      // Učitaj statut
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

        <section className="pt-40 md:pt-48 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto space-y-20">
            {loading ? (
              <div className="text-center py-20">
                <div className="text-gray-400">Učitavanje...</div>
              </div>
            ) : (
              <>
                {/* O nama Sekcija */}
                <motion.div
                  id="o-nama"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="space-y-8 scroll-mt-32"
                >
                  <div className="text-center">
                    <h1 className="text-[36px] font-bold font-playfair uppercase tracking-wider mb-4 text-white">
                      {aboutTitle}
                    </h1>
                    <div className="w-24 h-1 bg-white mx-auto mb-8"></div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8 md:p-12 shadow-xl">
                    <p className="text-lg md:text-xl text-gray-300 leading-relaxed text-center">
                      {aboutText}
                    </p>
                  </div>
                </motion.div>

                {/* Istorijat Sekcija */}
                <motion.div
                  id="istorijat"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="space-y-8 scroll-mt-32"
                >
                  <div className="text-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="inline-flex items-center justify-center mb-6"
                    >
                      <Trophy className="mr-3 text-yellow-400" size={32} />
                      <h2 className="text-[36px] font-bold font-playfair uppercase tracking-wider text-white">
                        Istorijat Kluba
                      </h2>
                      <Trophy className="ml-3 text-yellow-400" size={32} />
                    </motion.div>
                    <div className="w-32 h-1 bg-gradient-to-r from-transparent via-white to-transparent mx-auto mb-8"></div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center"
                  >
                    <h3 className="text-2xl md:text-3xl font-bold font-playfair mb-8 text-white leading-tight">
                      {historyTitle}
                    </h3>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8 md:p-12 shadow-xl"
                  >
                    <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed text-[20px]">
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

                {/* USPEŠI Sekcija */}
                <motion.div
                  id="uspesi"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="space-y-8 scroll-mt-32"
                >
                  <div className="text-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="inline-flex items-center justify-center mb-6"
                    >
                      <Crown className="mr-3 text-yellow-400" size={32} />
                      <h2 className="text-[36px] font-bold font-playfair uppercase tracking-wider text-white">
                        USPESI KŽK PARTIZAN 1953
                      </h2>
                      <Crown className="ml-3 text-yellow-400" size={32} />
                    </motion.div>
                    <div className="w-32 h-1 bg-gradient-to-r from-transparent via-white to-transparent mx-auto mb-8"></div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center mb-12"
                  >
                    <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                      Ponosno nosimo svoje uspehe kao svedočanstvo decenija predanosti, strasti i zajedničkih pobeda.
                    </p>
                  </motion.div>

                  {/* Statistike */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
                  >
                    {/* Šampionske titule */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                      className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-sm border-2 border-yellow-500/30 rounded-xl p-8 text-center hover:scale-105 transition-transform duration-300 shadow-xl"
                    >
                      <div className="flex justify-center mb-4">
                        <div className="bg-yellow-500/20 rounded-full p-4 flex items-center justify-center">
                          <Image
                            src="https://upload.wikimedia.org/wikipedia/sr/thumb/3/37/Kss-logo-cyr-full-color.png/250px-Kss-logo-cyr-full-color.png"
                            alt="Košarkaški savez Srbije Logo"
                            width={48}
                            height={48}
                            className="object-contain"
                            unoptimized
                          />
                        </div>
                      </div>
                      <div className="text-5xl md:text-6xl font-bold font-playfair text-yellow-400 mb-2">
                        7
                      </div>
                      <div className="text-lg md:text-xl font-semibold text-white mb-1">
                        šampionskih titula
                      </div>
                      <div className="text-sm text-gray-300 mt-2">
                        Prvenstvo Srbije
                      </div>
                    </motion.div>

                    {/* Nacionalni Kupovi */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 }}
                      className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm border-2 border-blue-500/30 rounded-xl p-8 text-center hover:scale-105 transition-transform duration-300 shadow-xl"
                    >
                      <div className="flex justify-center mb-4">
                        <div className="bg-blue-500/20 rounded-full p-4">
                          <Award className="text-blue-400" size={48} />
                        </div>
                      </div>
                      <div className="text-5xl md:text-6xl font-bold font-playfair text-blue-400 mb-2">
                        5
                      </div>
                      <div className="text-lg md:text-xl font-semibold text-white mb-1">
                        nacionalnih Kupova
                      </div>
                      <div className="text-sm text-gray-300 mt-2">
                        Kup Srbije
                      </div>
                    </motion.div>

                    {/* WABA Liga */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 }}
                      className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm border-2 border-purple-500/30 rounded-xl p-8 text-center hover:scale-105 transition-transform duration-300 shadow-xl"
                    >
                      <div className="flex justify-center mb-4">
                        <div className="bg-purple-500/20 rounded-full p-4 flex items-center justify-center">
                          <Image
                            src="https://waba-league.com/wp-content/uploads/2018/08/logo.png"
                            alt="WABA League Logo"
                            width={48}
                            height={48}
                            className="object-contain"
                            unoptimized
                          />
                        </div>
                      </div>
                      <div className="text-5xl md:text-6xl font-bold font-playfair text-purple-400 mb-2">
                        2
                      </div>
                      <div className="text-lg md:text-xl font-semibold text-white mb-1">
                        titule u regionalnoj
                      </div>
                      <div className="text-lg md:text-xl font-semibold text-white mb-1">
                        WABA ligi
                      </div>
                      <div className="text-sm text-gray-300 mt-2">
                        Regionalna liga
                      </div>
                    </motion.div>
                  </motion.div>
                </motion.div>

                {/* Statut Sekcija */}
                <motion.div
                  id="statut"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="space-y-8 scroll-mt-32"
                >
                  <div className="text-center">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-playfair mb-4 sm:mb-6 uppercase tracking-wider text-white">
                      Statut ženskog košarkaškog kluba partizan 1953
                    </h2>
                    <div className="w-24 h-1 bg-white mx-auto mb-8"></div>
                  </div>

                  {/* Slika Statuta */}
                  {statutImage && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="relative w-full max-w-2xl sm:max-w-3xl mx-auto aspect-[16/9] rounded-lg overflow-hidden border border-white/10 shadow-xl"
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
                </motion.div>
              </>
            )}
          </div>
        </section>

        <LiveMatches />
        <Footer />
      </div>
    </main>
  );
}

