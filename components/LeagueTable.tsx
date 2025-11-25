'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useZlsStandings, ZlsTeam } from '@/hooks/useZlsStandings';
import { useWabaStandings, WabaTeam } from '@/hooks/useWabaStandings';

type Team = ZlsTeam | WabaTeam;

interface TableProps {
  teams: Team[];
  loading: boolean;
  error: string | null;
  leagueName: string;
  isWaba?: boolean;
}

function TableContent({ teams, loading, error, leagueName, isWaba = false }: TableProps) {
  if (loading) {
    return (
      <div className="bg-black/50 border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-400 font-montserrat">Učitavanje tabele...</div>
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
    <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5 shadow-xl">
      <table className="w-full" style={{ minWidth: isWaba ? '700px' : '800px' }}>
        <thead>
          <tr className="bg-white/5 border-b border-white/10">
            <th className="text-center py-3 px-2 md:py-4 md:px-3 text-xs font-bold font-playfair uppercase tracking-wider sticky left-0 bg-white/5 z-10">
              #
            </th>
            <th className="text-left py-3 px-2 md:py-4 md:px-3 text-xs font-bold font-playfair uppercase tracking-wider sticky left-10 bg-white/5 z-10 min-w-[80px] md:min-w-[120px]">
              Tim
            </th>
            <th className="text-center py-3 px-2 md:py-4 md:px-3 text-xs font-bold font-playfair uppercase tracking-wider">
              MP
            </th>
            <th className="text-center py-3 px-2 md:py-4 md:px-3 text-xs font-bold font-playfair uppercase tracking-wider">
              <span className="text-green-400">W</span>
            </th>
            {!isWaba && (
              <th className="text-center py-3 px-2 md:py-4 md:px-3 text-xs font-bold font-playfair uppercase tracking-wider">
                <span className="text-yellow-400">D</span>
              </th>
            )}
            <th className="text-center py-3 px-2 md:py-4 md:px-3 text-xs font-bold font-playfair uppercase tracking-wider">
              <span className="text-red-400">L</span>
            </th>
            {isWaba ? (
              <>
                <th className="text-center py-3 px-2 md:py-4 md:px-3 text-xs font-bold font-playfair uppercase tracking-wider">
                  PTS
                </th>
                <th className="text-center py-3 px-2 md:py-4 md:px-3 text-xs font-bold font-playfair uppercase tracking-wider">
                  TP
                </th>
                <th className="text-center py-3 px-2 md:py-4 md:px-3 text-xs font-bold font-playfair uppercase tracking-wider">
                  +/-
                </th>
              </>
            ) : (
              <>
                <th className="text-center py-3 px-2 md:py-4 md:px-3 text-xs font-bold font-playfair uppercase tracking-wider">
                  TP
                </th>
                <th className="text-center py-3 px-2 md:py-4 md:px-3 text-xs font-bold font-playfair uppercase tracking-wider">
                  +/-
                </th>
                <th className="text-center py-3 px-2 md:py-4 md:px-3 text-xs font-bold font-playfair uppercase tracking-wider">
                  PTS
                </th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {teams.map((team, index) => (
            <motion.tr
              key={`${team.position}-${team.name}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`border-b border-white/5 hover:bg-white/10 transition-all duration-200 ${
                team.name.toLowerCase().includes('partizan') || team.name.toLowerCase().includes('partizan 1953') 
                  ? 'bg-gradient-to-r from-white/15 to-white/5 border-l-4 border-l-white' : ''
              }`}
            >
              <td className="py-3 px-2 md:py-4 md:px-3 sticky left-0 bg-white/5 z-10">
                <div className="flex items-center justify-center">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold font-playfair transition-all ${
                      team.position === 1
                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black shadow-lg shadow-yellow-500/50'
                        : team.position === 2
                        ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black shadow-lg shadow-gray-400/50'
                        : team.position === 3
                        ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-black shadow-lg shadow-orange-500/50'
                        : 'bg-white/10 text-white border border-white/20'
                    }`}
                  >
                    {team.position}
                  </span>
                </div>
              </td>
              <td className="py-3 px-2 md:py-4 md:px-3 sticky left-10 bg-white/5 z-10 min-w-[80px] md:min-w-[120px]">
                <span className={`font-medium font-montserrat text-xs md:text-sm truncate block max-w-[80px] md:max-w-none ${
                  team.name.toLowerCase().includes('partizan') || team.name.toLowerCase().includes('partizan 1953')
                    ? 'text-white font-bold' : 'text-gray-200'
                }`} title={team.name}>
                  {team.name.toLowerCase().includes('partizan') || team.name.toLowerCase().includes('partizan 1953')
                    ? 'KŽK Partizan 1953'
                    : team.name.length > 12
                    ? team.name.substring(0, 10) + '...'
                    : team.name}
                </span>
              </td>
              <td className="py-3 px-2 md:py-4 md:px-3 text-center text-gray-300 font-montserrat text-xs font-medium">
                {team.played}
              </td>
              <td className="py-3 px-2 md:py-4 md:px-3 text-center">
                <span className="text-green-400 font-bold font-montserrat text-xs">
                  {team.won}
                </span>
              </td>
              {!isWaba && (
                <td className="py-3 px-2 md:py-4 md:px-3 text-center">
                  <span className="text-yellow-400 font-bold font-montserrat text-xs">
                    {team.drawn}
                  </span>
                </td>
              )}
              <td className="py-3 px-2 md:py-4 md:px-3 text-center">
                <span className="text-red-400 font-bold font-montserrat text-xs">
                  {team.lost}
                </span>
              </td>
              {isWaba ? (
                <>
                  <td className="py-3 px-2 md:py-4 md:px-3 text-center">
                    <span className="font-bold font-playfair text-xs md:text-sm text-white">
                      {team.points}
                    </span>
                  </td>
                  <td className="py-3 px-2 md:py-4 md:px-3 text-center text-gray-300 font-montserrat text-xs font-medium">
                    {team.goalsFor}:{team.goalsAgainst}
                  </td>
                  <td className="py-3 px-2 md:py-4 md:px-3 text-center">
                    <span className={`font-bold font-montserrat text-xs ${
                      team.goalDifference > 0 ? 'text-green-400' : team.goalDifference < 0 ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {team.goalDifference > 0 ? '+' : ''}
                      {team.goalDifference}
                    </span>
                  </td>
                </>
              ) : (
                <>
                  <td className="py-3 px-2 md:py-4 md:px-3 text-center text-gray-300 font-montserrat text-xs font-medium">
                    {team.goalsFor}:{team.goalsAgainst}
                  </td>
                  <td className="py-3 px-2 md:py-4 md:px-3 text-center">
                    <span className={`font-bold font-montserrat text-xs ${
                    team.goalDifference > 0 ? 'text-green-400' : team.goalDifference < 0 ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {team.goalDifference > 0 ? '+' : ''}
                    {team.goalDifference}
                  </span>
              </td>
                  <td className="py-3 px-2 md:py-4 md:px-3 text-center">
                    <span className="font-bold font-playfair text-xs md:text-sm text-white">
                    {team.points}
                  </span>
                </td>
                </>
              )}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function LeagueTable() {
  const [activeTab, setActiveTab] = useState<'zls' | 'waba'>('zls');
  const { teams: zlsTeams, loading: zlsLoading, error: zlsError } = useZlsStandings();
  const { teams: wabaTeams, loading: wabaLoading, error: wabaError } = useWabaStandings();

  const currentTeams = activeTab === 'zls' ? zlsTeams : wabaTeams;
  const currentLoading = activeTab === 'zls' ? zlsLoading : wabaLoading;
  const currentError = activeTab === 'zls' ? zlsError : wabaError;
  const leagueName = activeTab === 'zls' ? 'Ženska Liga Srbije (ZLS)' : 'WABA Liga';

  return (
    <div className="bg-black/50 border-t border-white/10 py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-playfair uppercase tracking-wider mb-4">
          Tabele
        </h2>
          <div className="w-24 h-1 bg-white mx-auto"></div>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-6 md:mb-8">
          <div className="inline-flex rounded-lg bg-white/5 border border-white/10 p-1">
            <button
              onClick={() => setActiveTab('zls')}
              className={`px-6 py-3 rounded-md font-medium font-montserrat text-sm md:text-base transition-all duration-200 ${
                activeTab === 'zls'
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              ŽLS
            </button>
            <button
              onClick={() => setActiveTab('waba')}
              className={`px-6 py-3 rounded-md font-medium font-montserrat text-sm md:text-base transition-all duration-200 ${
                activeTab === 'waba'
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              WABA
            </button>
          </div>
        </div>

        {/* League Name */}
        <div className="mb-4 text-center">
          <h3 className="text-lg md:text-xl font-semibold font-playfair text-gray-300 uppercase tracking-wider">
            {leagueName}
          </h3>
        </div>

        {/* Table Content */}
        <TableContent
          teams={currentTeams}
          loading={currentLoading}
          error={currentError}
          leagueName={leagueName}
          isWaba={activeTab === 'waba'}
        />

      </div>
    </div>
  );
}
