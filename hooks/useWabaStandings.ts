'use client';

import { useState, useEffect } from 'react';

export interface WabaTeam {
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

export const useWabaStandings = () => {
  const [teams, setTeams] = useState<WabaTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        setLoading(true);
        setError(null);

        // Koristi naš API koji čuva podatke u bazi
        const response = await fetch('/api/waba/standings');
        
        if (!response.ok) {
          throw new Error('Greška pri učitavanju WABA tabele');
        }

        const apiData = await response.json();
        
        // Ako nema podataka, prikaži poruku
        if (!apiData.success || !apiData.standings || apiData.standings.length === 0) {
          setError('Nema podataka u bazi. Molimo pokrenite ažuriranje preko POST /api/waba/standings');
          setTeams([]);
          return;
        }

        const data = apiData.standings;

        // Mapiraj podatke iz baze na standardni format
        // Za WABA: G (odigrano), W (pobede), L (porazi), P (bodovi), PTS/OPTS (postignuti/primitni), +/- (razlika)
        const mappedTeams: WabaTeam[] = data.map((item: any) => {
          const position = item.rank || item.position || 1;
          const name = item.team || item.name || '';
          const won = item.w || item.won || 0;
          const lost = item.l || item.lost || 0;
          const played = item.gp || (won + lost); // G (odigrano) ili W + L
          const drawn = 0; // WABA nema nerešeno
          const goalsFor = item.pts || 0; // PTS (iz PTS/OPTS)
          const goalsAgainst = item.opts || 0; // OPTS (iz PTS/OPTS)
          const goalDifference = item.diff || 0; // +/- (razlika)
          const points = item.points || 0; // P (bodovi)

          return {
            position,
            name,
            played,
            won,
            drawn,
            lost,
            goalsFor,
            goalsAgainst,
            goalDifference,
            points,
          };
        });

        // Sortiraj po poziciji
        mappedTeams.sort((a, b) => a.position - b.position);

        setTeams(mappedTeams);
        setError(null);
      } catch (err) {
        console.error('Error fetching WABA standings:', err);
        setError('Greška pri učitavanju WABA tabele. Podaci možda nisu ažurirani.');
        setTeams([]);
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
