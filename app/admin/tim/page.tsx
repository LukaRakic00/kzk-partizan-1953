'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import { X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function AdminTim() {
  const [loading, setLoading] = useState(true);
  const [savingTeam, setSavingTeam] = useState(false);
  const [teamData, setTeamData] = useState({
    season: '2024/25',
    title: 'Tim košarkaškog kluba partizan 1953 za 2024/25 godinu',
    description: 'Sa ponosom vam predstavljamo naš tim za 2024/25. godinu – snagu, strast i talenat koji će nas voditi ka novim pobedama!',
    teamImage: '',
  });
  const [uploadingTeamImage, setUploadingTeamImage] = useState(false);
  const teamImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const team = await apiClient.getTeam() as { season?: string; title?: string; description?: string; teamImage?: string } | null;
      if (team) {
        setTeamData({
          season: team.season || '2024/25',
          title: team.title || '',
          description: team.description || '',
          teamImage: team.teamImage || '',
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Greška pri učitavanju podataka');
    } finally {
      setLoading(false);
    }
  };

  const handleTeamImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingTeamImage(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('folder', 'tim');
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: uploadFormData,
      });
      
      // Proveri Content-Type pre parsiranja
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 500));
        throw new Error(`Server je vratio neispravan format. Status: ${response.status}`);
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Greška pri upload-u slike');
      }
      
      const data = await response.json();
      if (!data.url) {
        throw new Error('URL slike nije vraćen iz servera');
      }
      
      const updatedTeamData = { ...teamData, teamImage: data.url };
      setTeamData(updatedTeamData);
      
      // Automatski sačuvaj nakon uspešnog upload-a
      await apiClient.updateTeam(updatedTeamData);
      toast.success('Slika tima je uspešno upload-ovana i sačuvana');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Greška pri upload-u slike');
    } finally {
      setUploadingTeamImage(false);
      // Resetuj file input da bi mogao ponovo da se koristi
      if (teamImageInputRef.current) {
        teamImageInputRef.current.value = '';
      }
    }
  };


  const handleSaveTeam = async () => {
    try {
      setSavingTeam(true);
      await apiClient.updateTeam(teamData);
      toast.success('Tim je uspešno sačuvan');
    } catch (error: any) {
      toast.error(error.message || 'Greška pri čuvanju tima');
    } finally {
      setSavingTeam(false);
    }
  };


  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-playfair uppercase tracking-wider">Tim</h1>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="text-gray-400">Učitavanje...</div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Tim Sekcija */}
          <div className="bg-white/5 border border-white/10 p-4 sm:p-6 md:p-8 rounded-lg">
            <h2 className="text-xl sm:text-2xl font-bold font-playfair uppercase tracking-wider mb-6">
              Tim Sekcija
            </h2>
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Sezona</label>
                <input
                  type="text"
                  value={teamData.season}
                  onChange={(e) => setTeamData((prev) => ({ ...prev, season: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 px-3 sm:px-4 py-2 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:border-white"
                  placeholder="2024/25"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Naslov</label>
                <input
                  type="text"
                  value={teamData.title}
                  onChange={(e) => setTeamData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 px-3 sm:px-4 py-2 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:border-white"
                  placeholder="Tim košarkaškog kluba partizan 1953 za 2024/25 godinu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Opis</label>
                <textarea
                  value={teamData.description}
                  onChange={(e) => setTeamData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 px-3 sm:px-4 py-2 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:border-white resize-none"
                  placeholder="Sa ponosom vam predstavljamo naš tim..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Slika Tima</label>
                <input
                  ref={teamImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleTeamImageUpload}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
                  disabled={uploadingTeamImage}
                />
                {uploadingTeamImage && <p className="text-sm text-gray-400 mt-2">Upload u toku...</p>}
                {teamData.teamImage && (
                  <div className="mt-4 relative w-full h-64 sm:h-96 rounded-lg overflow-hidden border border-white/20">
                    <Image src={teamData.teamImage} alt="Tim" fill sizes="100vw" className="object-cover" />
                    <button
                      onClick={async () => {
                        const updatedTeamData = { ...teamData, teamImage: '' };
                        setTeamData(updatedTeamData);
                        await apiClient.updateTeam(updatedTeamData);
                        if (teamImageInputRef.current) {
                          teamImageInputRef.current.value = '';
                        }
                        toast.success('Slika je uklonjena');
                      }}
                      className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-full transition-all"
                      title="Ukloni sliku"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={handleSaveTeam}
                disabled={savingTeam}
                className="bg-white text-black px-4 sm:px-6 py-2 sm:py-3 font-semibold uppercase tracking-wider hover:bg-gray-200 transition-all flex items-center justify-center text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="mr-2" size={18} />
                {savingTeam ? 'Čuvanje...' : 'Sačuvaj Tim Sekciju'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

