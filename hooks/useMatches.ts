'use client';

import { useState, useEffect } from 'react';

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  venue: string;
  city?: string;
  status: 'upcoming' | 'live' | 'finished';
  score?: {
    home: number;
    away: number;
  };
  linkLive?: string;
  linkStat?: string;
  isHome: boolean;
  round: number;
  matchDate: Date;
}

interface ApiContest {
  id: number;
  first_team: {
    id: number;
    name: string | null;
  } | null;
  second_team: {
    id: number;
    name: string | null;
  } | null;
  time: string;
  arena: {
    name: string;
    city: string;
  } | null;
  status: string;
  round: number | null;
  score: {
    A1: number;
    A2: number;
    A3: number;
    A4: number;
    B1: number;
    B2: number;
    B3: number;
    B4: number;
    A_extra?: number;
    B_extra?: number;
  } | null;
  link_live: string | null;
  link_stat: string | null;
}

interface ApiResponse {
  league: {
    id: number;
    name: string;
  };
  contests: ApiContest[];
}

export function useMatches() {
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [pastMatches, setPastMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://new-api.dscore.live/leagues/185/public-schedule');
        
        if (!response.ok) {
          throw new Error('Greška pri učitavanju mečeva');
        }

        const data: ApiResponse = await response.json();
        
        // Filtriraj samo mečeve gde je Partizan 1953 jedan od timova
        const partizanMatches = data.contests.filter((contest) => {
          if (!contest.first_team || !contest.second_team || !contest.first_team.name || !contest.second_team.name) {
            return false;
          }
          const firstTeamName = contest.first_team.name.toLowerCase();
          const secondTeamName = contest.second_team.name.toLowerCase();
          return firstTeamName.includes('partizan 1953') || secondTeamName.includes('partizan 1953');
        });

        // Mapiraj podatke
        const mappedMatches = partizanMatches
          .map((contest): Match | null => {
            if (!contest.first_team || !contest.second_team || !contest.first_team.name || !contest.second_team.name) {
              return null;
            }
            
            // TypeScript guard - nakon provere znamo da name nije null
            const firstTeamName = contest.first_team.name;
            const secondTeamName = contest.second_team.name;
            
            const isPartizanFirst = firstTeamName.toLowerCase().includes('partizan 1953');
            const homeTeam = isPartizanFirst ? firstTeamName : secondTeamName;
            const awayTeam = isPartizanFirst ? secondTeamName : firstTeamName;
            
            // Parsiraj UTC vreme
            // contest.time je u formatu "2025-09-27T14:00:00.000000Z" (UTC)
            const utcDate = new Date(contest.time);
            
            // Proveri da li je datum validan
            if (isNaN(utcDate.getTime())) {
              console.warn('Invalid date:', contest.time);
            }
            
            // Formatiraj datum u Beograd timezone
            const dateFormatter = new Intl.DateTimeFormat('sr-RS', {
              timeZone: 'Europe/Belgrade',
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            });
            
            const dateStr = dateFormatter.format(utcDate);
            
            // Formatiraj vreme u Beograd timezone (24-satni format)
            // Koristi toLocaleTimeString za direktnu konverziju
            const belgradeTimeStr = utcDate.toLocaleTimeString('sr-RS', {
              timeZone: 'Europe/Belgrade',
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false
            });
            
            // Ukloni eventualne razmake i formatiraj
            const timeStr = belgradeTimeStr.trim().replace(/\s/g, '');
            
            // Debug log za proveru
            if (process.env.NODE_ENV === 'development') {
              console.log('Match time:', {
                original: contest.time,
                utcDate: utcDate.toISOString(),
                belgradeTimeStr,
                formattedTime: timeStr
            });
            }

            let score = undefined;
            if (contest.score) {
              const homeScore = contest.score.A1 + contest.score.A2 + contest.score.A3 + contest.score.A4 + (contest.score.A_extra || 0);
              const awayScore = contest.score.B1 + contest.score.B2 + contest.score.B3 + contest.score.B4 + (contest.score.B_extra || 0);
              
              if (isPartizanFirst) {
                score = { home: homeScore, away: awayScore };
              } else {
                score = { home: awayScore, away: homeScore };
              }
            }

            const match: Match = {
              id: contest.id.toString(),
              homeTeam,
              awayTeam,
              date: dateStr,
              time: timeStr,
              venue: contest.arena?.name || 'Nepoznata lokacija',
              city: contest.arena?.city,
              status: (() => {
                const now = new Date();
                if (contest.status === 'live') return 'live';
                if (contest.status === 'finished' || (contest.score && utcDate < now)) return 'finished';
                if (utcDate > now) return 'upcoming';
                return 'upcoming';
              })(),
              score,
              linkLive: contest.link_live || undefined,
              linkStat: contest.link_stat || undefined,
              isHome: isPartizanFirst,
              round: contest.round || 0,
              matchDate: utcDate,
            };
            
            return match;
          })
          .filter((match) => match !== null)
          .sort((a, b) => b.matchDate.getTime() - a.matchDate.getTime()) as Match[]; // Sortiraj od najnovijeg ka najstarijem

        // Podeli na protekle i predstojeće
        const now = new Date();
        
        const past = mappedMatches.filter(m => {
          return m.status === 'finished' || (m.status !== 'live' && m.matchDate < now);
        }).sort((a, b) => b.matchDate.getTime() - a.matchDate.getTime()); // Najnoviji prvo
        
        const upcoming = mappedMatches.filter(m => {
          return m.status === 'upcoming' || (m.status !== 'live' && m.status !== 'finished' && m.matchDate >= now);
        }).sort((a, b) => a.matchDate.getTime() - b.matchDate.getTime()); // Najraniji prvo

        setAllMatches(mappedMatches);
        setPastMatches(past);
        setUpcomingMatches(upcoming);
        setError(null);
      } catch (err) {
        console.error('Error fetching matches:', err);
        setError('Greška pri učitavanju mečeva');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
    
    // Osveži podatke svakih 10 minuta
    const interval = setInterval(fetchMatches, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Pronađi live mečeve
  const liveMatches = allMatches.filter(m => m.status === 'live');
  
  // Pronađi prvi predstojeći meč
  const nextMatch = upcomingMatches.length > 0 ? upcomingMatches[0] : null;
  
  // Pronađi poslednji odigrani meč
  const lastMatch = pastMatches.length > 0 ? pastMatches[0] : null;

  return {
    allMatches,
    upcomingMatches,
    pastMatches,
    liveMatches,
    nextMatch,
    lastMatch,
    loading,
    error,
  };
}

