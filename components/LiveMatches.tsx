'use client';

import { useEffect, useRef, useState } from 'react';
import { Calendar, Clock, MapPin, ExternalLink, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMatches, Match } from '@/hooks/useMatches';
import Image from 'next/image';

const MatchCard = ({ match, index }: { match: Match; index: number }) => (
  <motion.div
    key={match.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className={`bg-white/5 border border-white/10 rounded-lg p-5 md:p-6 hover:bg-white/10 transition-all duration-200 ${
      match.isHome ? 'ring-2 ring-white/20' : ''
    }`}
  >
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <span className="text-xs uppercase tracking-wider font-montserrat text-gray-400">
          {match.status === 'live' ? 'U TOKU' : match.status === 'finished' ? 'ZAVRŠENO' : 'PREDSTOJEĆI'}
        </span>
        <span className="px-2 py-1 bg-white/10 rounded text-xs font-bold font-playfair text-white">
          Kolo {match.round}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {match.status === 'live' && (
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            <span className="text-xs text-red-400 font-montserrat font-semibold">LIVE</span>
          </span>
        )}
        {match.isHome && (
          <span className="text-xs uppercase tracking-wider font-montserrat text-white bg-white/20 px-2 py-1 rounded">
            DOMAĆI
          </span>
        )}
      </div>
    </div>

    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`font-semibold text-base md:text-lg font-montserrat ${
            match.homeTeam.toLowerCase().includes('partizan') ? 'text-white font-bold' : 'text-gray-200'
          }`}>
            {match.homeTeam}
          </p>
          {match.score && (
            <p className="text-2xl md:text-3xl font-bold font-playfair mt-1">{match.score.home}</p>
          )}
        </div>
        <div className="text-xl md:text-2xl font-bold font-playfair mx-3 md:mx-4 text-gray-400">VS</div>
        <div className="flex-1 text-right">
          <p className={`font-semibold text-base md:text-lg font-montserrat ${
            match.awayTeam.toLowerCase().includes('partizan') ? 'text-white font-bold' : 'text-gray-200'
          }`}>
            {match.awayTeam}
          </p>
          {match.score && (
            <p className="text-2xl md:text-3xl font-bold font-playfair mt-1">{match.score.away}</p>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 pt-4 space-y-2">
        <div className="flex items-center text-sm text-gray-400 font-montserrat">
          <Calendar size={16} className="mr-2 flex-shrink-0" />
          <span>{match.date}</span>
        </div>
        <div className="flex items-center text-sm text-gray-400 font-montserrat">
          <MapPin size={16} className="mr-2 flex-shrink-0" />
          <span className="truncate">{match.venue}{match.city ? `, ${match.city}` : ''}</span>
        </div>
      </div>

      {(match.linkLive || match.linkStat) && (
        <div className="flex gap-2 pt-2 border-t border-white/10">
          {match.linkLive && (
            <a
              href={match.linkLive}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors font-montserrat"
            >
              <Video size={16} />
              <span>Live Stream</span>
            </a>
          )}
          {match.linkStat && (
            <a
              href={match.linkStat}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors font-montserrat ml-auto"
            >
              <ExternalLink size={16} />
              <span>Statistika</span>
            </a>
          )}
        </div>
      )}
    </div>
  </motion.div>
);

// Funkcija za generisanje inicijala tima (za placeholder logo)
const getTeamInitials = (teamName: string): string => {
  const words = teamName.split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return teamName.substring(0, 2).toUpperCase();
  };

export default function LiveMatches() {
  const { upcomingMatches, pastMatches, loading, error } = useMatches();
  const upcomingSliderRef = useRef<HTMLDivElement>(null);
  const pastSliderRef = useRef<HTMLDivElement>(null);
  const upcomingAutoScrollRef = useRef<number | null>(null);
  const pastAutoScrollRef = useRef<number | null>(null);
  const isUserInteracting = useRef(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Auto-scroll kontinuirano u desno za predstojeće mečeve - optimizovano za mobilne uređaje
  useEffect(() => {
    if (!upcomingSliderRef.current || upcomingMatches.length === 0) return;

    const container = upcomingSliderRef.current;
    const isMobile = window.innerWidth < 768;
    // Smanji brzinu na mobilnim uređajima za bolje performanse
    const scrollSpeed = isMobile ? 0.5 : 1; // px per frame
    let lastTime = performance.now();
    const targetFPS = isMobile ? 30 : 60; // Smanji FPS na mobilnim uređajima
    const frameInterval = 1000 / targetFPS;

    const autoScroll = (currentTime: number) => {
      if (isUserInteracting.current) {
        upcomingAutoScrollRef.current = requestAnimationFrame(autoScroll);
        return;
      }

      // Throttle na mobilnim uređajima
      const deltaTime = currentTime - lastTime;
      if (deltaTime < frameInterval) {
        upcomingAutoScrollRef.current = requestAnimationFrame(autoScroll);
        return;
      }
      lastTime = currentTime - (deltaTime % frameInterval);

      const maxScroll = container.scrollWidth - container.clientWidth;
      const currentScroll = container.scrollLeft;

      if (maxScroll <= 0) {
        upcomingAutoScrollRef.current = requestAnimationFrame(autoScroll);
        return;
      }

      if (currentScroll >= maxScroll - 1) {
        // Reset na početak bez animacije za kontinuirani efekat
        container.scrollLeft = 0;
      } else {
        // Koristi requestAnimationFrame za smooth scroll
        container.scrollLeft = currentScroll + scrollSpeed;
      }

      upcomingAutoScrollRef.current = requestAnimationFrame(autoScroll);
    };

    upcomingAutoScrollRef.current = requestAnimationFrame(autoScroll);

    return () => {
      if (upcomingAutoScrollRef.current) {
        cancelAnimationFrame(upcomingAutoScrollRef.current);
      }
    };
  }, [upcomingMatches]);

  // Auto-scroll kontinuirano u desno za protekle mečeve - optimizovano za mobilne uređaje
  useEffect(() => {
    if (!pastSliderRef.current || pastMatches.length === 0 || !isVisible) {
      // Zaustavi auto-scroll ako nije vidljiv
      if (pastAutoScrollRef.current) {
        cancelAnimationFrame(pastAutoScrollRef.current);
        pastAutoScrollRef.current = null;
      }
      return;
    }

    const container = pastSliderRef.current;
    const isMobile = window.innerWidth < 768;
    // Smanji brzinu na mobilnim uređajima za bolje performanse
    const scrollSpeed = isMobile ? 0.5 : 1; // px per frame
    let lastTime = performance.now();
    const targetFPS = isMobile ? 30 : 60; // Smanji FPS na mobilnim uređajima
    const frameInterval = 1000 / targetFPS;

    const autoScroll = (currentTime: number) => {
      // Zaustavi ako nije više vidljiv
      if (!isVisible || isUserInteracting.current) {
        pastAutoScrollRef.current = requestAnimationFrame(autoScroll);
        return;
      }

      // Throttle na mobilnim uređajima
      const deltaTime = currentTime - lastTime;
      if (deltaTime < frameInterval) {
        pastAutoScrollRef.current = requestAnimationFrame(autoScroll);
        return;
      }
      lastTime = currentTime - (deltaTime % frameInterval);

      const maxScroll = container.scrollWidth - container.clientWidth;
      const currentScroll = container.scrollLeft;

      if (maxScroll <= 0) {
        pastAutoScrollRef.current = requestAnimationFrame(autoScroll);
        return;
      }

      if (currentScroll >= maxScroll - 1) {
        // Reset na početak bez animacije za kontinuirani efekat
        container.scrollLeft = 0;
      } else {
        // Koristi requestAnimationFrame za smooth scroll
        container.scrollLeft = currentScroll + scrollSpeed;
      }

      pastAutoScrollRef.current = requestAnimationFrame(autoScroll);
    };

    pastAutoScrollRef.current = requestAnimationFrame(autoScroll);

    return () => {
      if (pastAutoScrollRef.current) {
        cancelAnimationFrame(pastAutoScrollRef.current);
      }
    };
  }, [pastMatches, isVisible]);

  // Pause auto-scroll kada korisnik interaguje - optimizovano
  const handleUserInteraction = () => {
    if (isUserInteracting.current) return; // Izbegni višestruke pozive
    
    isUserInteracting.current = true;
    
    // Koristi requestAnimationFrame za bolje performanse
    const timeoutId = setTimeout(() => {
      isUserInteracting.current = false;
    }, 3000); // Pauziraj 3 sekunde nakon interakcije
    
    // Cleanup timeout ako komponenta unmount-uje
    return () => clearTimeout(timeoutId);
  };

  // Detektuj scroll direction i sakrij/prikaži slajder
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Ako scroll-uje na dole, sakrij
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false);
      } 
      // Ako scroll-uje na gore, prikaži
      else if (currentScrollY < lastScrollY.current) {
        setIsVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="bg-black/50 border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-400 font-montserrat">Učitavanje mečeva...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black/50 border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-red-400 font-montserrat">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Predstojeći Mečevi - Slider */}
      {upcomingMatches.length > 0 && (
        <div id="live-matches" className="bg-black/50 border-t border-white/10 py-8 md:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold font-playfair uppercase tracking-wider mb-4">
                Predstojeći Mečevi
              </h2>
              <div className="w-24 h-1 bg-white mx-auto"></div>
            </div>
            <div
              ref={upcomingSliderRef}
              onTouchStart={handleUserInteraction}
              onMouseDown={handleUserInteraction}
              onWheel={handleUserInteraction}
              className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide"
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-x',
                willChange: 'scroll-position',
                contain: 'layout style paint',
                scrollBehavior: 'auto'
              }}
            >
              {upcomingMatches.map((match, index) => (
                <div 
                  key={match.id} 
                  className="flex-shrink-0 w-full md:w-96"
                  style={{ 
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden',
                    willChange: 'transform'
                  }}
                >
                  <MatchCard match={match} index={index} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Protekli Mečevi - Horizontalni Slider na dnu sa show/hide na scroll */}
      {pastMatches.length > 0 && (
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed bottom-0 left-0 right-0 bg-black/95 border-t border-white/10 py-1.5 sm:py-2 md:py-3 z-40 shadow-lg"
            >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              ref={pastSliderRef}
                  onTouchStart={handleUserInteraction}
                  onMouseDown={handleUserInteraction}
                  onWheel={handleUserInteraction}
                  className="flex gap-2 sm:gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-1 sm:pb-2"
                  style={{ 
                    scrollbarWidth: 'none', 
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch',
                    touchAction: 'pan-x',
                    willChange: 'scroll-position',
                    contain: 'layout style paint',
                    scrollBehavior: 'auto'
                  }}
            >
              {pastMatches.slice(0, 20).map((match, index) => (
            <motion.div
              key={match.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                      className="flex-shrink-0 bg-white/5 border border-white/10 rounded-lg p-1.5 sm:p-2 md:p-3 hover:bg-white/10 transition-all w-[70vw] sm:w-56 md:min-w-[240px]"
                      style={{ 
                        transform: 'translateZ(0)',
                        backfaceVisibility: 'hidden',
                        willChange: 'transform'
                      }}
            >
                      {/* Date and Time - Još kompaktnije */}
                      <div className="flex items-center justify-between mb-1.5 sm:mb-2 pb-1.5 sm:pb-2 border-b border-white/10">
                        <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-gray-400">
                          <Calendar size={8} className="flex-shrink-0 sm:w-2.5 sm:h-2.5" />
                          <span className="truncate">{match.date}</span>
                        </div>
                        <span className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 bg-white/10 rounded whitespace-nowrap">Kolo {match.round}</span>
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 mb-1.5 sm:mb-2">
                        {/* Home Team - Još manji */}
                        <div className="flex flex-col items-center gap-0.5 flex-1">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold font-playfair text-[8px] sm:text-[10px] md:text-xs">
                            {getTeamInitials(match.homeTeam)}
                          </div>
                          <span className="text-[8px] sm:text-[9px] md:text-[10px] font-montserrat text-gray-400 text-center max-w-[50px] sm:max-w-[60px] md:max-w-[70px] truncate">
                            {match.homeTeam.toLowerCase().includes('partizan') ? 'KŽK Partizan 1953' : match.homeTeam}
                      </span>
                    </div>

                        {/* Score - Još manji */}
                        <div className="flex flex-col items-center gap-0.5">
                      {match.score ? (
                            <div className="text-sm sm:text-base md:text-lg font-bold font-playfair">
                            <span className={match.isHome && match.score.home > match.score.away ? 'text-green-400' : match.isHome && match.score.home < match.score.away ? 'text-red-400' : 'text-gray-400'}>
                              {match.isHome ? match.score.home : match.score.away}
                            </span>
                              <span className="text-gray-500 mx-0.5">:</span>
                            <span className={!match.isHome && match.score.away > match.score.home ? 'text-green-400' : !match.isHome && match.score.away < match.score.home ? 'text-red-400' : 'text-gray-400'}>
                              {match.isHome ? match.score.away : match.score.home}
                </span>
                          </div>
                      ) : (
                            <span className="text-[10px] sm:text-xs font-montserrat text-gray-500">VS</span>
                )}
              </div>

                        {/* Away Team - Još manji */}
                        <div className="flex flex-col items-center gap-0.5 flex-1">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold font-playfair text-[8px] sm:text-[10px] md:text-xs">
                        {getTeamInitials(match.awayTeam)}
                  </div>
                          <span className="text-[8px] sm:text-[9px] md:text-[10px] font-montserrat text-gray-400 text-center max-w-[50px] sm:max-w-[60px] md:max-w-[70px] truncate">
                            {match.awayTeam.toLowerCase().includes('partizan') ? 'KŽK Partizan 1953' : match.awayTeam}
                      </span>
                        </div>
                </div>

                      {/* Linkovi za statistike i video - Još kompaktnije */}
                      {(match.linkLive || match.linkStat) && (
                        <div className="flex gap-1 pt-1 border-t border-white/10">
                          {match.linkLive && (
                            <a
                              href={match.linkLive}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-0.5 text-[8px] sm:text-[9px] md:text-[10px] text-red-400 hover:text-red-300 transition-colors font-montserrat flex-1 justify-center px-1 sm:px-1.5 py-0.5 sm:py-1 bg-white/5 rounded hover:bg-white/10"
                            >
                              <Video size={8} className="sm:w-2.5 sm:h-2.5" />
                              <span className="hidden sm:inline">Video</span>
                            </a>
                          )}
                          {match.linkStat && (
                            <a
                              href={match.linkStat}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-0.5 text-[8px] sm:text-[9px] md:text-[10px] text-blue-400 hover:text-blue-300 transition-colors font-montserrat flex-1 justify-center px-1 sm:px-1.5 py-0.5 sm:py-1 bg-white/5 rounded hover:bg-white/10"
                            >
                              <ExternalLink size={8} className="sm:w-2.5 sm:h-2.5" />
                              <span className="hidden sm:inline">Statistika</span>
                            </a>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  );
}
