'use client';

import { useState, useEffect } from 'react';

export interface ZlsTeam {
  position: number;
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

interface ApiStanding {
  position: number;
  id: number;
  name: string;
  games: string;
  wins: string;
  lost: string;
  points: string;
  goals_for: string;
  goals_against: string;
  goals_difference: string;
}

interface ApiResponse {
  league: {
    id: number;
    name: string;
    kss_live_slug: string;
  };
  standings: ApiStanding[];
}

export const useZlsStandings = () => {
  const [teams, setTeams] = useState<ZlsTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://new-api.dscore.live/leagues/185/public-standings');
        
        if (!response.ok) {
          throw new Error('Greška pri učitavanju tabele');
        }

        const data: ApiResponse = await response.json();
        
        // Mapiraj podatke iz API-ja na format komponente
        const mappedTeams: ZlsTeam[] = data.standings.map((standing) => {
          const played = parseInt(standing.games) || 0;
          const won = parseInt(standing.wins) || 0;
          const lost = parseInt(standing.lost) || 0;
          // Izračunaj nerešeno (ako postoji)
          const drawn = played - won - lost;
          
          return {
            position: standing.position,
            name: standing.name,
            played,
            won,
            drawn: drawn > 0 ? drawn : 0,
            lost,
            goalsFor: parseInt(standing.goals_for) || 0,
            goalsAgainst: parseInt(standing.goals_against) || 0,
            goalDifference: parseInt(standing.goals_difference) || 0,
            points: parseInt(standing.points) || 0,
          };
        });

        setTeams(mappedTeams);
        setError(null);
      } catch (err) {
        console.error('Error fetching ZLS standings:', err);
        setError('Greška pri učitavanju tabele');
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
    
    // Osveži podatke svakih 5 minuta
    const interval = setInterval(fetchStandings, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return { teams, loading, error };
};

