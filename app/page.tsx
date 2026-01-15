'use client';

import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LiveMatches from '@/components/LiveMatches';
import LeagueTable from '@/components/LeagueTable';
import InteractiveBackground from '@/components/InteractiveBackground';
import { apiClient } from '@/lib/api-client';
import { useMatches } from '@/hooks/useMatches';
import Link from 'next/link';
import { ArrowRight, Trophy, Users, Calendar, Newspaper, Clock, MapPin, Radio, Send, Mail, Phone, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import CloudinaryImage from '@/components/CloudinaryImage';
import toast from 'react-hot-toast';

export default function Home() {
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [heroImageMobile, setHeroImageMobile] = useState<string | null>(null);
  const [heroText, setHeroText] = useState('Tradicija, ponos i uspeh od 1953. godine');
  const [homeImages, setHomeImages] = useState<any[]>([]);
  const [sectionTexts, setSectionTexts] = useState<any>({});
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [partnerImages, setPartnerImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [latestNews, setLatestNews] = useState<any[]>([]);
  const { nextMatch, lastMatch, liveMatches, pastMatches } = useMatches();
  const currentLiveMatch = liveMatches.length > 0 ? liveMatches[0] : null;
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [contactFormData, setContactFormData] = useState({
    name: '',
    email: '',
    title: '',
    message: '',
  });
  const [submittingContact, setSubmittingContact] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [activeTab, setActiveTab] = useState<'matches' | 'news'>('matches');
  const [matchIndex, setMatchIndex] = useState(0);
  const [newsIndex, setNewsIndex] = useState(0);
  
  // Pripremi mečeve za carousel (prioritet: live > next > prethodni mečevi po datumu)
  // Koristi useMemo da se ne kreira svaki put
  const matchesForCarousel = useMemo(() => {
    const carousel: Array<{ type: 'live' | 'next' | 'last'; match: any }> = [];
    if (currentLiveMatch) carousel.push({ type: 'live', match: currentLiveMatch });
    if (nextMatch) carousel.push({ type: 'next', match: nextMatch });
    
    // Dodaj najnovije prethodne mečeve (sortirani po datumu, najnoviji prvo)
    const recentPastMatches = pastMatches
      .filter(m => m.score) // Samo mečevi sa rezultatom
      .slice(0, 5); // Uzmi najnovijih 5 prethodnih mečeva
    
    recentPastMatches.forEach((match) => {
      carousel.push({ type: 'last', match });
    });
    
    return carousel;
  }, [currentLiveMatch, nextMatch, pastMatches]);
  
  // Resetuj index kada se promene mečevi
  useEffect(() => {
    if (matchesForCarousel.length > 0 && activeMatchIndex >= matchesForCarousel.length) {
      setActiveMatchIndex(0);
    }
  }, [matchesForCarousel.length]);
  
  // Auto-play carousel svake 3 sekunde - optimizovano za mobilne
  useEffect(() => {
    if (matchesForCarousel.length <= 1) return;
    
    // Pokreni autoplay čak i na mobilnim verzijama
    const interval = setInterval(() => {
      setActiveMatchIndex((prev) => {
        if (matchesForCarousel.length === 0) return 0;
        return (prev + 1) % matchesForCarousel.length;
      });
    }, 3000);
    
    return () => clearInterval(interval);
  }, [matchesForCarousel.length]);


  useEffect(() => {
    loadData();
  }, []);

  // Praćenje scroll pozicije za sakrivanje indikatora
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY || window.pageYOffset;
      const heroHeight = window.innerHeight;
      // Sakrij indikator kada korisnik scrolluje dole
      setShowScrollIndicator(scrollPosition < heroHeight * 0.8);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Funkcija za scroll do sledeće sekcije
  const scrollToNextSection = () => {
    const heroSection = document.querySelector('section:first-of-type');
    if (heroSection) {
      const nextSection = heroSection.nextElementSibling as HTMLElement;
      if (nextSection) {
        nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // Ako nema sledeće sekcije, scrolluj malo dole
        window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
      }
    }
  };

  const loadData = async () => {
    try {
      // Učitaj hero slike - OBAVEZNO iz foldera 'baneri'
      const heroImg = await apiClient.getImages('baneri');
      
      // Učitaj aktivni hero baner iz settings
      const activeHeroSetting = await apiClient.getSettings('hero_image_active');
      if (activeHeroSetting && activeHeroSetting.value && heroImg) {
        const activeImage = heroImg.find((img: any) => img._id === activeHeroSetting.value);
        if (activeImage) {
          setHeroImage(activeImage.url);
        } else {
          // Fallback na prvu sliku ako aktivni nije pronađen
          if (heroImg.length > 0) {
            setHeroImage(heroImg[0].url);
          }
        }
      } else {
        // Fallback na prvu sliku ako nema aktivnog hero banera
        if (heroImg && heroImg.length > 0) {
          setHeroImage(heroImg[0].url);
        } else {
          console.warn('Nema hero slika u folderu baneri!');
        }
      }

      // Učitaj mobilnu hero sliku iz settings
      const heroMobileSetting = await apiClient.getSettings('hero_image_mobile');
      if (heroMobileSetting && heroMobileSetting.value) {
        setHeroImageMobile(heroMobileSetting.value);
      } else if (heroImg && heroImg.length > 0) {
        // Fallback na prvu sliku ako nema mobilnog hero banera
        setHeroImageMobile(heroImg[0].url);
      }

      // Učitaj tekstove iz settings-a
      const heroTextSetting = await apiClient.getSettings('hero_text');
      if (heroTextSetting && heroTextSetting.value) {
        setHeroText(heroTextSetting.value);
      }

      // Učitaj slike za home page
      const images = await apiClient.getImages('home');
      setHomeImages(images);

      // Učitaj pozadinsku sliku ispod hero sekcije
      const bgImg = await apiClient.getImages('sections');
      if (bgImg && bgImg.length > 0) {
        const sortedBg = bgImg.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        setBackgroundImage(sortedBg[0].url);
      }

      // Učitaj partnere
      const partners = await apiClient.getImages('partneri');
      if (partners && partners.length > 0) {
        const sortedPartners = partners.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        setPartnerImages(sortedPartners);
      }

      // Učitaj tekstove za sekcije
      const texts = await apiClient.getSettings();
      const textsObj: any = {};
      if (Array.isArray(texts)) {
        texts.forEach((setting: any) => {
          if (setting.key.startsWith('section_') || setting.key.startsWith('president_') || setting.key.startsWith('basketball_school_')) {
            textsObj[setting.key] = setting.value;
          }
        });
      }
      setSectionTexts(textsObj);

      // Učitaj najnovije vesti
      const news = await apiClient.getNews();
      const publishedNews = news.filter((item: any) => item.published).slice(0, 3);
      setLatestNews(publishedNews);
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
        {/* Hero Section */}
        {/* Navbar - odvojen od hero sekcije */}
        <div className="relative z-30 w-full">
          <Navbar />
        </div>

        {/* Hero Section */}
        <section className="relative h-[60vh] md:h-[70vh] flex items-center overflow-hidden z-20">
          {/* Hero Content */}
          <div className="w-full h-full flex items-center relative z-10">
        {/* Hero Image - Desktop */}
        {heroImage ? (
          <>
            {/* Desktop Hero Image */}
            <div className="hidden md:block absolute inset-0 z-0">
              <CloudinaryImage
                src={heroImage}
                alt="Hero"
                fill
                className="object-cover"
                priority
                placeholder="skeleton"
                objectFit="cover"
              />
            </div>
            {/* Mobile Hero Image */}
            {heroImageMobile ? (
              <div className="md:hidden absolute inset-0 z-0">
                <CloudinaryImage
                  src={heroImageMobile}
                  alt="Hero Mobile"
                  fill
                  className="object-cover"
                  priority
                  placeholder="skeleton"
                  objectFit="cover"
                />
              </div>
            ) : (
              <div className="md:hidden absolute inset-0 z-0">
                <CloudinaryImage
                  src={heroImage}
                  alt="Hero"
                  fill
                  className="object-cover"
                  priority
                  placeholder="skeleton"
                  objectFit="cover"
                />
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30 z-0"></div>
        
        {/* Content Container - Welcome Message - Levo poravnato */}
        <div className="relative z-10 w-full h-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="max-w-7xl mx-auto h-full flex items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-left"
            >
              {/* Prvi red - DOBRO DOŠLI */}
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="font-bold font-playfair mb-4 tracking-wider text-white drop-shadow-2xl text-2xl md:text-5xl"
              >
                DOBRO DOŠLI
              </motion.h1>
              
              {/* Drugi red - Na sajt KŽK Partizan */}
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="font-semibold font-playfair mb-8 text-white drop-shadow-lg text-sm md:text-3xl"
              >
                Na sajt KŽK PARTIZAN
              </motion.p>
              
              {/* Treći red - Detaljnije dugme */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <Link
                  href="/o-nama"
                  className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-8 py-2 md:py-4 bg-black/80 border-2 border-white text-white font-bold font-playfair uppercase tracking-wider rounded-lg hover:bg-white/20 hover:text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-white/20 group text-xs md:text-sm"
                >
                  <span>Detaljnije</span>
                  <ChevronRight size={14} className="md:w-[18px] md:h-[18px] group-hover:translate-x-2 transition-transform duration-300" />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
        </div>

        {/* Scroll Indicator */}
        {showScrollIndicator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 cursor-pointer select-none"
            style={{ touchAction: 'manipulation' }}
            onClick={scrollToNextSection}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              scrollToNextSection();
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                scrollToNextSection();
              }
            }}
            aria-label="Scroll to next section"
          >
            <div className="w-6 h-10 border-2 border-white rounded-full flex items-start justify-center p-2 hover:border-gray-300 active:scale-95 transition-all">
              <motion.div
                className="w-1 h-3 bg-white rounded-full"
                animate={{
                  y: [0, 8, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </div>
          </motion.div>
        )}
      </section>

      {/* Uskla sekcija sa tekstom i pozadinom */}
      <section className="relative overflow-hidden bg-black h-[100px] md:h-[120px] lg:h-[150px]">
        <div className="relative flex items-center justify-center gap-2 md:gap-6 lg:gap-8 px-4 sm:px-6 lg:px-8 h-full w-full">
          {/* Leva pozadinska slika */}
          <div className="absolute left-0 top-0 bottom-0 w-1/2 opacity-10">
            <Image
              src="/close-up-old-basketball-ball.jpg"
              alt="Basketball"
              fill
              className="object-cover object-left"
            />
          </div>
          
          {/* Desna pozadinska slika */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-10">
            <Image
              src="/close-up-old-basketball-ball.jpg"
              alt="Basketball"
              fill
              className="object-cover object-right"
            />
          </div>
          
          {/* Levi logo */}
          <div className="relative z-20 flex-shrink-0">
            <Image
              src="/kzk_partizan.png"
              alt="KŽK Partizan Logo"
              width={100}
              height={100}
              className="w-12 h-12 md:w-20 md:h-20 lg:w-28 lg:h-28 object-contain"
            />
          </div>
          
          {/* Tekst u sredini */}
          <h2 className="relative z-20 font-bold font-playfair text-white text-center tracking-wider text-sm md:text-4xl">
            <span className="md:hidden">KŽK Partizan</span>
            <span className="hidden md:inline"><span className="uppercase">K</span>ošarkaški ženski klub Partizan</span>
          </h2>
          
          {/* Desni logo */}
          <div className="relative z-20 flex-shrink-0">
            <Image
              src="/kzk_partizan.png"
              alt="KŽK Partizan Logo"
              width={100}
              height={100}
              className="w-12 h-12 md:w-20 md:h-20 lg:w-28 lg:h-28 object-contain"
            />
          </div>
        </div>
      </section>

      {/* Dekorativni separator */}
      <div className="relative py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-4 w-full max-w-2xl">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-white/40"></div>
              <div className="w-2 h-2 bg-white/40 rounded-full"></div>
              <div className="w-1 h-1 bg-white/30 rounded-full"></div>
              <div className="w-2 h-2 bg-white/40 rounded-full"></div>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent via-white/20 to-white/40"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Matches & News Section - Tabovi */}
      <section className="relative py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tabovi */}
          <div className="flex justify-center mb-8 gap-4">
            <button
              onClick={() => setActiveTab('matches')}
              className={`px-6 py-3 font-bold font-playfair text-lg transition-all duration-300 ${
                activeTab === 'matches'
                  ? 'text-white border-b-2 border-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Mečevi
            </button>
            <button
              onClick={() => setActiveTab('news')}
              className={`px-6 py-3 font-bold font-playfair text-lg transition-all duration-300 ${
                activeTab === 'news'
                  ? 'text-white border-b-2 border-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Vesti
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'matches' && matchesForCarousel.length > 0 && (
            <div className="relative">
              {/* Strelica levo - samo za desktop, samo ako ima više od 3 meča */}
              {matchesForCarousel.length > 3 && matchIndex > 0 && (
                <button
                  onClick={() => setMatchIndex(matchIndex - 1)}
                  className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 lg:-translate-x-16 z-10 bg-white/10 hover:bg-white/20 rounded-full p-2 md:p-3 transition-all"
                >
                  <ChevronLeft className="text-white" size={24} />
                </button>
              )}
              
              {/* Strelica desno - samo za desktop, samo ako ima više od 3 meča */}
              {matchesForCarousel.length > 3 && matchIndex < matchesForCarousel.length - 3 && (
                <button
                  onClick={() => setMatchIndex(matchIndex + 1)}
                  className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 lg:translate-x-16 z-10 bg-white/10 hover:bg-white/20 rounded-full p-2 md:p-3 transition-all"
                >
                  <ChevronRight className="text-white" size={24} />
                </button>
              )}

              {/* Match Cards - Mobile: horizontalni scroll sa svim karticama */}
              <div className="flex md:hidden gap-4 overflow-x-auto scrollbar-hide pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
                {matchesForCarousel.map((item, idx) => {
                  const match = item.match;
                  return (
                    <motion.div
                      key={`${item.type}-${match.id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.1 }}
                      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3 md:p-4 hover:bg-white/10 hover:border-white/20 transition-all duration-300 flex-shrink-0 w-[85vw] md:w-auto"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          {item.type === 'live' && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-red-600/90 rounded-full animate-pulse">
                              <Radio size={10} className="text-white" />
                              <span className="text-[10px] font-bold font-montserrat text-white uppercase">LIVE</span>
                            </div>
                          )}
                          <span className={`text-xs uppercase tracking-wider font-montserrat ${
                            item.type === 'live' ? 'text-red-400' : item.type === 'next' ? 'text-blue-400' : 'text-gray-400'
                          }`}>
                            {item.type === 'live' ? 'U TOKU' : item.type === 'next' ? 'Sledeći Meč' : 'Prethodni Meč'}
                          </span>
                        </div>
                        <span className="px-2 py-1 bg-white/10 rounded text-xs font-semibold font-playfair text-white">
                          Kolo {match.round}
                        </span>
                      </div>
                      
                      {/* Match Content */}
                      {item.type === 'last' && match.score ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className={`font-semibold text-xs md:text-sm font-montserrat flex-1 ${
                              match.homeTeam.toLowerCase().includes('partizan') ? 'text-white' : 'text-gray-300'
                            }`}>
                              {match.homeTeam.toLowerCase().includes('partizan') ? 'KŽK Partizan 1953' : match.homeTeam}
                            </p>
                            <span className="text-lg md:text-xl font-bold font-playfair text-white ml-2">
                              {match.score.home}
                            </span>
                          </div>
                          <div className="h-px bg-white/10"></div>
                          <div className="flex items-center justify-between">
                            <p className={`font-semibold text-xs md:text-sm font-montserrat flex-1 ${
                              match.awayTeam.toLowerCase().includes('partizan') ? 'text-white' : 'text-gray-300'
                            }`}>
                              {match.awayTeam.toLowerCase().includes('partizan') ? 'KŽK Partizan 1953' : match.awayTeam}
                            </p>
                            <span className="text-lg md:text-xl font-bold font-playfair text-white ml-2">
                              {match.score.away}
                            </span>
                          </div>
                        </div>
                      ) : item.type === 'live' && match.score ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className={`font-bold text-sm md:text-base font-montserrat flex-1 ${
                              match.homeTeam.toLowerCase().includes('partizan') ? 'text-white' : 'text-gray-200'
                            }`}>
                              {match.homeTeam.toLowerCase().includes('partizan') ? 'KŽK Partizan 1953' : match.homeTeam}
                            </p>
                            <span className="text-xl md:text-2xl font-bold font-playfair text-red-400 ml-2">
                              {match.score.home}
                            </span>
                          </div>
                          <div className="h-px bg-white/20"></div>
                          <div className="flex items-center justify-between">
                            <p className={`font-bold text-sm md:text-base font-montserrat flex-1 ${
                              match.awayTeam.toLowerCase().includes('partizan') ? 'text-white' : 'text-gray-200'
                            }`}>
                              {match.awayTeam.toLowerCase().includes('partizan') ? 'KŽK Partizan 1953' : match.awayTeam}
                            </p>
                            <span className="text-xl md:text-2xl font-bold font-playfair text-red-400 ml-2">
                              {match.score.away}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center space-y-2">
                          <p className={`font-bold text-sm md:text-base font-montserrat ${
                            match.homeTeam.toLowerCase().includes('partizan') ? 'text-white' : 'text-gray-200'
                          }`}>
                            {match.homeTeam.toLowerCase().includes('partizan') ? 'KŽK Partizan 1953' : match.homeTeam}
                          </p>
                          <div className="text-base md:text-lg font-bold font-playfair text-white/40">VS</div>
                          <p className={`font-bold text-sm md:text-base font-montserrat ${
                            match.awayTeam.toLowerCase().includes('partizan') ? 'text-white' : 'text-gray-200'
                          }`}>
                            {match.awayTeam.toLowerCase().includes('partizan') ? 'KŽK Partizan 1953' : match.awayTeam}
                          </p>
                        </div>
                      )}
                      
                      {/* Footer Info */}
                      <div className="flex flex-col gap-1.5 text-xs font-montserrat mt-3 pt-2 border-t border-white/5 text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar size={12} />
                          <span>{match.date}</span>
                        </div>
                        {match.venue && (
                          <div className="flex items-center gap-2">
                            <MapPin size={12} />
                            <span className="truncate text-xs">{match.venue}{match.city ? `, ${match.city}` : ''}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Live Link */}
                      {item.type === 'live' && match.linkLive && (
                        <a
                          href={match.linkLive}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block mt-3 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-center font-semibold font-montserrat transition-all text-xs"
                        >
                          Gledaj LIVE
                        </a>
                      )}
                    </motion.div>
                  );
                })}
              </div>
              
              {/* Match Cards - Desktop: grid sa tri kartice */}
              <div className="hidden md:grid md:grid-cols-3 gap-4 md:gap-6">
                {matchesForCarousel.slice(matchIndex, matchIndex + 3).map((item, idx) => {
                  const match = item.match;
                  return (
                    <motion.div
                      key={`${item.type}-${match.id}-desktop`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.1 }}
                      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3 md:p-4 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          {item.type === 'live' && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-red-600/90 rounded-full animate-pulse">
                              <Radio size={10} className="text-white" />
                              <span className="text-[10px] font-bold font-montserrat text-white uppercase">LIVE</span>
                            </div>
                          )}
                          <span className={`text-xs uppercase tracking-wider font-montserrat ${
                            item.type === 'live' ? 'text-red-400' : item.type === 'next' ? 'text-blue-400' : 'text-gray-400'
                          }`}>
                            {item.type === 'live' ? 'U TOKU' : item.type === 'next' ? 'Sledeći Meč' : 'Prethodni Meč'}
                          </span>
                        </div>
                        <span className="px-2 py-1 bg-white/10 rounded text-xs font-semibold font-playfair text-white">
                          Kolo {match.round}
                        </span>
                      </div>
                      
                      {/* Match Content */}
                      {item.type === 'last' && match.score ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className={`font-semibold text-xs md:text-sm font-montserrat flex-1 ${
                              match.homeTeam.toLowerCase().includes('partizan') ? 'text-white' : 'text-gray-300'
                            }`}>
                              {match.homeTeam.toLowerCase().includes('partizan') ? 'KŽK Partizan 1953' : match.homeTeam}
                            </p>
                            <span className="text-lg md:text-xl font-bold font-playfair text-white ml-2">
                              {match.score.home}
                            </span>
                          </div>
                          <div className="h-px bg-white/10"></div>
                          <div className="flex items-center justify-between">
                            <p className={`font-semibold text-xs md:text-sm font-montserrat flex-1 ${
                              match.awayTeam.toLowerCase().includes('partizan') ? 'text-white' : 'text-gray-300'
                            }`}>
                              {match.awayTeam.toLowerCase().includes('partizan') ? 'KŽK Partizan 1953' : match.awayTeam}
                            </p>
                            <span className="text-lg md:text-xl font-bold font-playfair text-white ml-2">
                              {match.score.away}
                            </span>
                          </div>
                        </div>
                      ) : item.type === 'live' && match.score ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className={`font-bold text-sm md:text-base font-montserrat flex-1 ${
                              match.homeTeam.toLowerCase().includes('partizan') ? 'text-white' : 'text-gray-200'
                            }`}>
                              {match.homeTeam.toLowerCase().includes('partizan') ? 'KŽK Partizan 1953' : match.homeTeam}
                            </p>
                            <span className="text-xl md:text-2xl font-bold font-playfair text-red-400 ml-2">
                              {match.score.home}
                            </span>
                          </div>
                          <div className="h-px bg-white/20"></div>
                          <div className="flex items-center justify-between">
                            <p className={`font-bold text-sm md:text-base font-montserrat flex-1 ${
                              match.awayTeam.toLowerCase().includes('partizan') ? 'text-white' : 'text-gray-200'
                            }`}>
                              {match.awayTeam.toLowerCase().includes('partizan') ? 'KŽK Partizan 1953' : match.awayTeam}
                            </p>
                            <span className="text-xl md:text-2xl font-bold font-playfair text-red-400 ml-2">
                              {match.score.away}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center space-y-2">
                          <p className={`font-bold text-sm md:text-base font-montserrat ${
                            match.homeTeam.toLowerCase().includes('partizan') ? 'text-white' : 'text-gray-200'
                          }`}>
                            {match.homeTeam.toLowerCase().includes('partizan') ? 'KŽK Partizan 1953' : match.homeTeam}
                          </p>
                          <div className="text-base md:text-lg font-bold font-playfair text-white/40">VS</div>
                          <p className={`font-bold text-sm md:text-base font-montserrat ${
                            match.awayTeam.toLowerCase().includes('partizan') ? 'text-white' : 'text-gray-200'
                          }`}>
                            {match.awayTeam.toLowerCase().includes('partizan') ? 'KŽK Partizan 1953' : match.awayTeam}
                          </p>
                        </div>
                      )}
                      
                      {/* Footer Info */}
                      <div className="flex flex-col gap-1.5 text-xs font-montserrat mt-3 pt-2 border-t border-white/5 text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar size={12} />
                          <span>{match.date}</span>
                        </div>
                        {match.venue && (
                          <div className="flex items-center gap-2">
                            <MapPin size={12} />
                            <span className="truncate text-xs">{match.venue}{match.city ? `, ${match.city}` : ''}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Live Link */}
                      {item.type === 'live' && match.linkLive && (
                        <a
                          href={match.linkLive}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block mt-3 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-center font-semibold font-montserrat transition-all text-xs"
                        >
                          Gledaj LIVE
                        </a>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* News Tab */}
          {activeTab === 'news' && latestNews.length > 0 && (
            <div className="relative">
              {/* Strelica levo - samo za desktop, samo ako ima više od 3 vesti */}
              {latestNews.length > 3 && newsIndex > 0 && (
                <button
                  onClick={() => setNewsIndex(newsIndex - 1)}
                  className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 lg:-translate-x-16 z-10 bg-white/10 hover:bg-white/20 rounded-full p-2 md:p-3 transition-all"
                >
                  <ChevronLeft className="text-white" size={24} />
                </button>
              )}
              
              {/* Strelica desno - samo za desktop, samo ako ima više od 3 vesti */}
              {latestNews.length > 3 && newsIndex < latestNews.length - 3 && (
                <button
                  onClick={() => setNewsIndex(newsIndex + 1)}
                  className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 lg:translate-x-16 z-10 bg-white/10 hover:bg-white/20 rounded-full p-2 md:p-3 transition-all"
                >
                  <ChevronRight className="text-white" size={24} />
                </button>
              )}

              {/* News Cards - Mobile: horizontalni scroll sa svim karticama */}
              <div className="flex md:hidden gap-4 overflow-x-auto scrollbar-hide pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
                {latestNews.map((item, idx) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.1 }}
                    className="bg-white/5 border border-white/10 hover:bg-white/10 transition-all group flex-shrink-0 w-[85vw] md:w-auto"
                  >
                    <Link href={`/vesti/${item.slug}`}>
                      <div className="aspect-video relative overflow-hidden mb-3">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/10 flex items-center justify-center">
                            <span className="text-gray-500">Slika</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 md:p-4">
                        <span className="text-xs uppercase tracking-wider text-gray-400">{item.category}</span>
                        <h3 className="text-base md:text-lg font-semibold mt-2 mb-2 group-hover:text-white transition-colors line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                          {item.excerpt}
                        </p>
                        <span className="text-white text-xs uppercase tracking-wider flex items-center group-hover:underline">
                          Pročitaj više
                          <ArrowRight className="ml-2" size={14} />
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
              
              {/* News Cards - Desktop: grid sa tri kartice */}
              <div className="hidden md:grid md:grid-cols-3 gap-4 md:gap-6">
                {latestNews.slice(newsIndex, newsIndex + 3).map((item, idx) => (
                  <motion.div
                    key={`${item._id}-desktop`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.1 }}
                    className="bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                  >
                    <Link href={`/vesti/${item.slug}`}>
                      <div className="aspect-video relative overflow-hidden mb-3">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/10 flex items-center justify-center">
                            <span className="text-gray-500">Slika</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 md:p-4">
                        <span className="text-xs uppercase tracking-wider text-gray-400">{item.category}</span>
                        <h3 className="text-base md:text-lg font-semibold mt-2 mb-2 group-hover:text-white transition-colors line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                          {item.excerpt}
                        </p>
                        <span className="text-white text-xs uppercase tracking-wider flex items-center group-hover:underline">
                          Pročitaj više
                          <ArrowRight className="ml-2" size={14} />
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Dekorativni separator */}
      <div className="relative py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-4 w-full max-w-2xl">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-white/40"></div>
              <div className="w-2 h-2 bg-white/40 rounded-full"></div>
              <div className="w-1 h-1 bg-white/30 rounded-full"></div>
              <div className="w-2 h-2 bg-white/40 rounded-full"></div>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent via-white/20 to-white/40"></div>
            </div>
          </div>
        </div>
      </div>

        {/* Features Section */}
        <section className="py-16 md:py-24 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Link 
                  href="/o-nama" 
                  className="block h-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-5 md:p-6 text-center group hover:bg-white/10 hover:border-yellow-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-yellow-500/10"
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-xl flex items-center justify-center group-hover:from-yellow-500/30 group-hover:to-yellow-600/30 transition-all duration-300 border border-yellow-500/20 group-hover:border-yellow-500/40">
                    <Trophy size={28} className="md:w-8 md:h-8 text-yellow-400 group-hover:text-yellow-300 group-hover:scale-110 transition-all duration-300" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-base md:text-lg font-bold font-playfair mb-2 text-white group-hover:text-yellow-400 transition-colors">
                    Trofeji
                  </h3>
                  <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
                    {sectionTexts.section_trophies || 'Bogata istorija uspeha'}
                  </p>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Link 
                  href="/tim" 
                  className="block h-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-5 md:p-6 text-center group hover:bg-white/10 hover:border-blue-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/10"
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-blue-600/30 transition-all duration-300 border border-blue-500/20 group-hover:border-blue-500/40">
                    <Users size={28} className="md:w-8 md:h-8 text-blue-400 group-hover:text-blue-300 group-hover:scale-110 transition-all duration-300" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-base md:text-lg font-bold font-playfair mb-2 text-white group-hover:text-blue-400 transition-colors">
                    Tim
                  </h3>
                  <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
                    {sectionTexts.section_team || 'Najbolji igrači'}
                  </p>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Link 
                  href="/#live-matches" 
                  className="block h-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-5 md:p-6 text-center group hover:bg-white/10 hover:border-green-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/10"
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl flex items-center justify-center group-hover:from-green-500/30 group-hover:to-green-600/30 transition-all duration-300 border border-green-500/20 group-hover:border-green-500/40">
                    <Calendar size={28} className="md:w-8 md:h-8 text-green-400 group-hover:text-green-300 group-hover:scale-110 transition-all duration-300" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-base md:text-lg font-bold font-playfair mb-2 text-white group-hover:text-green-400 transition-colors">
                    Mečevi
                  </h3>
                  <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
                    {sectionTexts.section_matches || 'Pratite nas'}
                  </p>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Link 
                  href="/vesti" 
                  className="block h-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-5 md:p-6 text-center group hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/10"
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl flex items-center justify-center group-hover:from-purple-500/30 group-hover:to-purple-600/30 transition-all duration-300 border border-purple-500/20 group-hover:border-purple-500/40">
                    <Newspaper size={28} className="md:w-8 md:h-8 text-purple-400 group-hover:text-purple-300 group-hover:scale-110 transition-all duration-300" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-base md:text-lg font-bold font-playfair mb-2 text-white group-hover:text-purple-400 transition-colors">
                    Vesti
                  </h3>
                  <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
                    {sectionTexts.section_news || 'Najnovije vesti'}
                  </p>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

      {/* Dekorativni separator */}
      {homeImages.length > 0 && (
        <div className="relative py-8 md:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-4 w-full max-w-2xl">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-white/40"></div>
                <div className="w-2 h-2 bg-white/40 rounded-full"></div>
                <div className="w-1 h-1 bg-white/30 rounded-full"></div>
                <div className="w-2 h-2 bg-white/40 rounded-full"></div>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent via-white/20 to-white/40"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Images Gallery Section */}
      {homeImages.length > 0 && (
        <section className="py-20 bg-black/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold font-playfair uppercase tracking-wider mb-4">
              {sectionTexts.section_gallery_title || 'Galerija'}
            </h2>
              <div className="w-24 h-1 bg-white mx-auto"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {homeImages.map((img, index) => (
                <motion.div
                  key={img._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative aspect-video overflow-hidden group"
                >
                  <Image
                    src={img.url}
                    alt={`Gallery image ${index + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Dekorativni separator */}
      <div className="relative py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-4 w-full max-w-2xl">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-white/40"></div>
              <div className="w-2 h-2 bg-white/40 rounded-full"></div>
              <div className="w-1 h-1 bg-white/30 rounded-full"></div>
              <div className="w-2 h-2 bg-white/40 rounded-full"></div>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent via-white/20 to-white/40"></div>
            </div>
          </div>
        </div>
      </div>

      {/* League Table */}
      <LeagueTable />

      {/* Dekorativni separator */}
      <div className="relative py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-4 w-full max-w-2xl">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-white/40"></div>
              <div className="w-2 h-2 bg-white/40 rounded-full"></div>
              <div className="w-1 h-1 bg-white/30 rounded-full"></div>
              <div className="w-2 h-2 bg-white/40 rounded-full"></div>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent via-white/20 to-white/40"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Matches */}
      <LiveMatches />

      {/* Dekorativni separator */}
      <div className="relative py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-4 w-full max-w-2xl">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-white/40"></div>
              <div className="w-2 h-2 bg-white/40 rounded-full"></div>
              <div className="w-1 h-1 bg-white/30 rounded-full"></div>
              <div className="w-2 h-2 bg-white/40 rounded-full"></div>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent via-white/20 to-white/40"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Kontakt Forma Sekcija */}
      <section className="py-20 bg-black/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold font-playfair uppercase tracking-wider mb-4">
                Kontaktirajte Nas
              </h2>
            <div className="w-24 h-1 bg-white mx-auto mb-8"></div>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Za sve dodatne informacije, pitanja ili saradnju, slobodno nas kontaktirajte
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8">
                <h2 className="text-2xl font-bold font-playfair mb-6 text-white">Kontakt Informacije</h2>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 text-white">Adresa</h3>
                      <p className="text-gray-300">Humska 1,</p>
                      <p className="text-gray-300">11000 Beograd, Srbija</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 text-white">Telefon</h3>
                      <a href="tel:+381112647658" className="text-gray-300 hover:text-white transition-colors">
                        +381 11 264 76 58
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 text-white">Email</h3>
                      <a href="mailto:info@kzkpartizan1953.rs" className="text-gray-300 hover:text-white transition-colors">
                        info@kzkpartizan1953.rs
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8"
            >
              <h2 className="text-2xl font-bold font-playfair mb-6 text-white">Pošaljite Poruku</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setSubmittingContact(true);
                try {
                  await apiClient.sendContactMessage({
                    name: contactFormData.name,
                    email: contactFormData.email,
                    title: contactFormData.title,
                    message: contactFormData.message,
                  });
                  toast.success('Poruka je uspešno poslata!');
                  setContactFormData({ name: '', email: '', title: '', message: '' });
                } catch (error: any) {
                  toast.error(error.message || 'Greška pri slanju poruke');
                } finally {
                  setSubmittingContact(false);
                }
              }} className="space-y-6">
                <div>
                  <label htmlFor="home-name" className="block text-sm font-medium mb-2 text-gray-300">
                    Ime i Prezime <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="home-name"
                    required
                    value={contactFormData.name}
                    onChange={(e) => setContactFormData({ ...contactFormData, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white transition-colors rounded-lg"
                  />
                </div>

                <div>
                  <label htmlFor="home-email" className="block text-sm font-medium mb-2 text-gray-300">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    id="home-email"
                    required
                    value={contactFormData.email}
                    onChange={(e) => setContactFormData({ ...contactFormData, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white transition-colors rounded-lg"
                  />
                </div>

                <div>
                  <label htmlFor="home-title" className="block text-sm font-medium mb-2 text-gray-300">
                    Naslov poruke <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="home-title"
                    required
                    value={contactFormData.title}
                    onChange={(e) => setContactFormData({ ...contactFormData, title: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white transition-colors rounded-lg"
                  />
                </div>

                <div>
                  <label htmlFor="home-message" className="block text-sm font-medium mb-2 text-gray-300">
                    Poruka <span className="text-gray-500 text-xs">(opciono)</span>
                  </label>
                  <textarea
                    id="home-message"
                    rows={6}
                    value={contactFormData.message}
                    onChange={(e) => setContactFormData({ ...contactFormData, message: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white transition-colors resize-none rounded-lg"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingContact}
                  className="w-full bg-white text-black px-6 py-4 font-semibold uppercase tracking-wider hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center rounded-lg"
                >
                  {submittingContact ? (
                    'Slanje...'
                  ) : (
                    <>
                      <Send className="mr-2" size={20} />
                      Pošalji Poruku
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Dekorativni separator */}
      {partnerImages.length > 0 && (
        <div className="relative py-8 md:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-4 w-full max-w-2xl">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-white/40"></div>
                <div className="w-2 h-2 bg-white/40 rounded-full"></div>
                <div className="w-1 h-1 bg-white/30 rounded-full"></div>
                <div className="w-2 h-2 bg-white/40 rounded-full"></div>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent via-white/20 to-white/40"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Partneri Slider */}
      {partnerImages.length > 0 && (
        <section className="py-16 md:py-20 bg-black/70 overflow-hidden relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl md:text-3xl font-bold font-playfair uppercase tracking-wider mb-4">
              Partneri
            </h2>
              <div className="w-24 h-1 bg-white mx-auto"></div>
            </motion.div>
            <div className="relative overflow-hidden">
              {/* Desktop - Auto-scroll animacija */}
              <div className="hidden md:flex gap-8 md:gap-12 animate-scroll-infinite">
                {/* Dupliraj slike za kontinuirani scroll */}
                {[...partnerImages, ...partnerImages, ...partnerImages].map((partner, index) => (
                  <div
                    key={`partner-desktop-${index}`}
                    className="flex-shrink-0 w-40 h-24 md:w-56 md:h-32 lg:w-64 lg:h-36 relative grayscale hover:grayscale-0 transition-all duration-500 opacity-60 hover:opacity-100"
                  >
                    <Image
                      src={partner.url}
                      alt={`Partner ${index + 1}`}
                      fill
                      className="object-contain filter brightness-0 invert hover:brightness-100 hover:invert-0 transition-all duration-500"
                    />
                  </div>
                ))}
              </div>
              
              {/* Mobile - Ručni scroll */}
              <div className="flex md:hidden gap-6 overflow-x-auto scrollbar-hide pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
                {partnerImages.map((partner, index) => (
                  <div
                    key={`partner-mobile-${index}`}
                    className="flex-shrink-0 w-40 h-24 relative grayscale hover:grayscale-0 transition-all duration-500 opacity-60 hover:opacity-100"
                  >
                    <Image
                      src={partner.url}
                      alt={`Partner ${index + 1}`}
                      fill
                      className="object-contain filter brightness-0 invert hover:brightness-100 hover:invert-0 transition-all duration-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <Footer />
      </div>
    </main>
  );
}
