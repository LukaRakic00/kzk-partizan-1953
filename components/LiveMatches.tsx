'use client';

import { useEffect, useRef } from 'react';
import { Calendar, Clock, MapPin, ExternalLink, Video } from 'lucide-react';
import { motion } from 'framer-motion';
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

  // Auto-scroll za predstojeće mečeve
  useEffect(() => {
    if (!upcomingSliderRef.current || upcomingMatches.length === 0) return;

    const slider = upcomingSliderRef.current;
    let scrollAmount = 0;
    const scrollSpeed = 0.5; // px per frame

    const scroll = () => {
      scrollAmount += scrollSpeed;
      if (scrollAmount >= slider.scrollWidth - slider.clientWidth) {
        scrollAmount = 0; // Reset na početak
      }
      slider.scrollLeft = scrollAmount;
      requestAnimationFrame(scroll);
    };

    const animationId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationId);
  }, [upcomingMatches]);

  // Auto-scroll za protekle mečeve (sporije)
  useEffect(() => {
    if (!pastSliderRef.current || pastMatches.length === 0) return;

    const slider = pastSliderRef.current;
    let scrollAmount = 0;
    const scrollSpeed = 0.3; // Sporije za protekle mečeve

    const scroll = () => {
      scrollAmount += scrollSpeed;
      if (scrollAmount >= slider.scrollWidth - slider.clientWidth) {
        scrollAmount = 0;
      }
      slider.scrollLeft = scrollAmount;
      requestAnimationFrame(scroll);
    };

    const animationId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationId);
  }, [pastMatches]);

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
              className="flex gap-4 md:gap-6 overflow-x-hidden scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {upcomingMatches.map((match, index) => (
                <div key={match.id} className="flex-shrink-0 w-full md:w-96">
                  <MatchCard match={match} index={index} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Protekli Mečevi - Slider na dnu */}
      {pastMatches.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/95 border-t border-white/10 py-3 md:py-4 z-40 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              ref={pastSliderRef}
              className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory"
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                scrollSnapType: 'x mandatory'
              }}
            >
              {pastMatches.slice(0, 20).map((match, index) => (
            <motion.div
              key={match.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex-shrink-0 bg-white/5 border border-white/10 rounded-lg p-3 md:p-4 hover:bg-white/10 transition-all w-[85vw] sm:w-72 md:min-w-[280px] snap-start"
            >
                  {/* Date and Time - Iznad svega */}
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Calendar size={12} className="flex-shrink-0" />
                      <span className="truncate">{match.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock size={12} className="flex-shrink-0" />
                      <span className="truncate">{match.time}</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-white/10 rounded whitespace-nowrap">Kolo {match.round}</span>
                  </div>

                  <div className="flex items-center gap-4 mb-3">
                    {/* Home Team Logo/Initials */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold font-playfair text-sm">
                        {getTeamInitials(match.homeTeam)}
                      </div>
                      <span className="text-xs font-montserrat text-gray-400 text-center max-w-[70px] sm:max-w-[80px] truncate">
                        {match.homeTeam.toLowerCase().includes('partizan') ? 'KŽK Partizan 1953' : match.homeTeam}
                      </span>
                    </div>

                    {/* Score */}
                    <div className="flex flex-col items-center gap-1">
                      {match.score ? (
                          <div className="text-xl font-bold font-playfair">
                            <span className={match.isHome && match.score.home > match.score.away ? 'text-green-400' : match.isHome && match.score.home < match.score.away ? 'text-red-400' : 'text-gray-400'}>
                              {match.isHome ? match.score.home : match.score.away}
                            </span>
                            <span className="text-gray-500 mx-1">:</span>
                            <span className={!match.isHome && match.score.away > match.score.home ? 'text-green-400' : !match.isHome && match.score.away < match.score.home ? 'text-red-400' : 'text-gray-400'}>
                              {match.isHome ? match.score.away : match.score.home}
                </span>
                          </div>
                      ) : (
                        <span className="text-sm font-montserrat text-gray-500">VS</span>
                )}
              </div>

                    {/* Away Team Logo/Initials */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold font-playfair text-sm">
                        {getTeamInitials(match.awayTeam)}
                  </div>
                      <span className="text-xs font-montserrat text-gray-400 text-center max-w-[70px] sm:max-w-[80px] truncate">
                        {match.awayTeam.toLowerCase().includes('partizan') ? 'KŽK Partizan 1953' : match.awayTeam}
                      </span>
                </div>
                </div>

                  {/* Linkovi za statistike i video */}
                  {(match.linkLive || match.linkStat) && (
                    <div className="flex gap-2 pt-2 border-t border-white/10">
                      {match.linkLive && (
                        <a
                          href={match.linkLive}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors font-montserrat flex-1 justify-center px-2 py-1.5 bg-white/5 rounded hover:bg-white/10"
                        >
                          <Video size={12} />
                          <span className="hidden sm:inline">Video</span>
                        </a>
                      )}
                      {match.linkStat && (
                        <a
                          href={match.linkStat}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors font-montserrat flex-1 justify-center px-2 py-1.5 bg-white/5 rounded hover:bg-white/10"
                        >
                          <ExternalLink size={12} />
                          <span className="hidden sm:inline">Statistika</span>
                        </a>
                      )}
              </div>
                  )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
      )}
    </>
  );
}
