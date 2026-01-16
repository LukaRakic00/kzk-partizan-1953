'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import { Plus, Edit, Trash2, Upload, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface Management {
  _id: string;
  name: string;
  position: string;
  image?: string;
  type: 'upravni_odbor' | 'menadzment' | 'rukovodstvo';
  order: number;
}

export default function AdminTim() {
  const [management, setManagement] = useState<Management[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingTeam, setSavingTeam] = useState(false);
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [editingManagement, setEditingManagement] = useState<Management | null>(null);
  const [managementForm, setManagementForm] = useState({
    name: '',
    position: '',
    image: '',
    type: 'rukovodstvo' as 'upravni_odbor' | 'menadzment' | 'rukovodstvo',
    order: 0,
  });
  const [teamData, setTeamData] = useState({
    season: '2024/25',
    title: 'Tim košarkaškog kluba partizan 1953 za 2024/25 godinu',
    description: 'Sa ponosom vam predstavljamo naš tim za 2024/25. godinu – snagu, strast i talenat koji će nas voditi ka novim pobedama!',
    teamImage: '',
    upravniOdborImage: '',
    menadzmentImage: '',
    rukovodstvoImage: '',
  });
  const [uploadingTeamImage, setUploadingTeamImage] = useState(false);
  const [uploadingManagementImage, setUploadingManagementImage] = useState(false);
  const [uploadingSectionImage, setUploadingSectionImage] = useState<string | null>(null);
  const teamImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const team = await apiClient.getTeam() as { season?: string; title?: string; description?: string; teamImage?: string; upravniOdborImage?: string; menadzmentImage?: string; rukovodstvoImage?: string } | null;
      if (team) {
        setTeamData({
          season: team.season || '2024/25',
          title: team.title || '',
          description: team.description || '',
          teamImage: team.teamImage || '',
          upravniOdborImage: team.upravniOdborImage || '',
          menadzmentImage: team.menadzmentImage || '',
          rukovodstvoImage: team.rukovodstvoImage || '',
        });
      }
      const mgmt = await apiClient.getManagement();
      setManagement(mgmt);
    } catch (error) {
      console.error('Error loading data:', error);
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

  const handleManagementImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingManagementImage(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('folder', 'rukovodstvo');
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
      
      setManagementForm((prev) => ({ ...prev, image: data.url }));
      toast.success('Slika je uspešno upload-ovana');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Greška pri upload-u slike');
    } finally {
      setUploadingManagementImage(false);
    }
  };

  const handleSectionImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, section: 'upravniOdborImage' | 'menadzmentImage' | 'rukovodstvoImage') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSectionImage(section);
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
      
      const updatedTeamData = { ...teamData, [section]: data.url };
      setTeamData(updatedTeamData);
      
      // Automatski sačuvaj nakon uspešnog upload-a
      await apiClient.updateTeam(updatedTeamData);
      toast.success('Slika je uspešno upload-ovana i sačuvana');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Greška pri upload-u slike');
    } finally {
      setUploadingSectionImage(null);
      // Resetuj file input da bi mogao ponovo da se koristi
      e.target.value = '';
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

  const handleSaveManagement = async () => {
    try {
      if (editingManagement) {
        await apiClient.updateManagement(editingManagement._id, managementForm);
        toast.success('Rukovodstvo je uspešno ažurirano');
      } else {
        await apiClient.createManagement(managementForm);
        toast.success('Rukovodstvo je uspešno dodato');
      }
      setShowManagementModal(false);
      setEditingManagement(null);
      setManagementForm({ name: '', position: '', image: '', type: 'rukovodstvo', order: 0 });
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Greška pri čuvanju rukovodstva');
    }
  };

  const handleEditManagement = (item: Management) => {
    setEditingManagement(item);
    setManagementForm({
      name: item.name,
      position: item.position,
      image: item.image || '',
      type: item.type,
      order: item.order,
    });
    setShowManagementModal(true);
  };

  const handleDeleteManagement = async (id: string) => {
    if (!confirm('Da li ste sigurni da želite da obrišete ovog člana rukovodstva?')) return;
    try {
      await apiClient.deleteManagement(id);
      toast.success('Član rukovodstva je uspešno obrisan');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Greška pri brisanju');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-playfair uppercase tracking-wider">Tim i Rukovodstvo</h1>
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
                    <Image src={teamData.teamImage} alt="Tim" fill className="object-cover" />
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
              <div>
                <label className="block text-sm font-medium mb-2">Slika Ispod Upravnog Odbora</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleSectionImageUpload(e, 'upravniOdborImage')}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
                  disabled={uploadingSectionImage === 'upravniOdborImage'}
                />
                {uploadingSectionImage === 'upravniOdborImage' && <p className="text-sm text-gray-400 mt-2">Upload u toku...</p>}
                {teamData.upravniOdborImage && (
                  <div className="mt-4 relative w-full h-64 sm:h-96 rounded-lg overflow-hidden border border-white/20">
                    <Image src={teamData.upravniOdborImage} alt="Upravni Odbor" fill className="object-cover" />
                    <button
                      onClick={async () => {
                        const updatedTeamData = { ...teamData, upravniOdborImage: '' };
                        setTeamData(updatedTeamData);
                        await apiClient.updateTeam(updatedTeamData);
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
              <div>
                <label className="block text-sm font-medium mb-2">Slika Ispod Menadžmenta</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleSectionImageUpload(e, 'menadzmentImage')}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
                  disabled={uploadingSectionImage === 'menadzmentImage'}
                />
                {uploadingSectionImage === 'menadzmentImage' && <p className="text-sm text-gray-400 mt-2">Upload u toku...</p>}
                {teamData.menadzmentImage && (
                  <div className="mt-4 relative w-full h-64 sm:h-96 rounded-lg overflow-hidden border border-white/20">
                    <Image src={teamData.menadzmentImage} alt="Menadžment" fill className="object-cover" />
                    <button
                      onClick={async () => {
                        const updatedTeamData = { ...teamData, menadzmentImage: '' };
                        setTeamData(updatedTeamData);
                        await apiClient.updateTeam(updatedTeamData);
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
              <div>
                <label className="block text-sm font-medium mb-2">Slika Ispod Rukovodstva</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleSectionImageUpload(e, 'rukovodstvoImage')}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
                  disabled={uploadingSectionImage === 'rukovodstvoImage'}
                />
                {uploadingSectionImage === 'rukovodstvoImage' && <p className="text-sm text-gray-400 mt-2">Upload u toku...</p>}
                {teamData.rukovodstvoImage && (
                  <div className="mt-4 relative w-full h-64 sm:h-96 rounded-lg overflow-hidden border border-white/20">
                    <Image src={teamData.rukovodstvoImage} alt="Rukovodstvo" fill className="object-cover" />
                    <button
                      onClick={async () => {
                        const updatedTeamData = { ...teamData, rukovodstvoImage: '' };
                        setTeamData(updatedTeamData);
                        await apiClient.updateTeam(updatedTeamData);
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

          {/* Management Sekcija */}
          <div className="bg-white/5 border border-white/10 p-4 sm:p-6 md:p-8 rounded-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold font-playfair uppercase tracking-wider">
                Upravni Odbor, Menadžment i Rukovodstvo
              </h2>
              <button
                onClick={() => {
                  setEditingManagement(null);
                  setManagementForm({ name: '', position: '', image: '', type: 'rukovodstvo', order: management.length });
                  setShowManagementModal(true);
                }}
                className="bg-white text-black px-4 sm:px-6 py-2 sm:py-3 font-semibold uppercase tracking-wider hover:bg-gray-200 transition-all flex items-center text-sm sm:text-base w-full sm:w-auto justify-center"
              >
                <Plus className="mr-2" size={18} />
                Dodaj Člana
              </button>
            </div>

            <div className="mb-8">
              <h3 className="text-lg sm:text-xl font-bold font-playfair uppercase tracking-wider mb-4">Upravni Odbor</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
                {management.filter((item) => item.type === 'upravni_odbor').map((item) => (
                  <div
                    key={item._id}
                    className="bg-white/5 border border-white/10 p-4 sm:p-6 rounded-lg hover:bg-white/10 transition-all"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white/20 mb-4">
                        {item.image ? (
                          <Image src={item.image} alt={item.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full bg-white/10 flex items-center justify-center">
                            <span className="text-gray-500 text-xs">Slika</span>
                          </div>
                        )}
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold font-playfair mb-1">{item.name}</h3>
                      <p className="text-sm sm:text-base text-gray-400 mb-4">{item.position}</p>
                      <div className="flex gap-2 w-full">
                        <button
                          onClick={() => handleEditManagement(item)}
                          className="flex-1 bg-white/10 text-white px-3 sm:px-4 py-2 hover:bg-white/20 transition-all flex items-center justify-center text-xs sm:text-sm"
                        >
                          <Edit size={14} className="sm:mr-2" />
                          <span className="hidden sm:inline">Izmeni</span>
                        </button>
                        <button
                          onClick={() => handleDeleteManagement(item._id)}
                          className="flex-1 bg-red-500/20 text-red-400 px-3 sm:px-4 py-2 hover:bg-red-500/30 transition-all flex items-center justify-center text-xs sm:text-sm"
                        >
                          <Trash2 size={14} className="sm:mr-2" />
                          <span className="hidden sm:inline">Obriši</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg sm:text-xl font-bold font-playfair uppercase tracking-wider mb-4">Menadžment</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
                {management.filter((item) => item.type === 'menadzment').map((item) => (
                  <div
                    key={item._id}
                    className="bg-white/5 border border-white/10 p-4 sm:p-6 rounded-lg hover:bg-white/10 transition-all"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white/20 mb-4">
                        {item.image ? (
                          <Image src={item.image} alt={item.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full bg-white/10 flex items-center justify-center">
                            <span className="text-gray-500 text-xs">Slika</span>
                          </div>
                        )}
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold font-playfair mb-1">{item.name}</h3>
                      <p className="text-sm sm:text-base text-gray-400 mb-4">{item.position}</p>
                      <div className="flex gap-2 w-full">
                        <button
                          onClick={() => handleEditManagement(item)}
                          className="flex-1 bg-white/10 text-white px-3 sm:px-4 py-2 hover:bg-white/20 transition-all flex items-center justify-center text-xs sm:text-sm"
                        >
                          <Edit size={14} className="sm:mr-2" />
                          <span className="hidden sm:inline">Izmeni</span>
                        </button>
                        <button
                          onClick={() => handleDeleteManagement(item._id)}
                          className="flex-1 bg-red-500/20 text-red-400 px-3 sm:px-4 py-2 hover:bg-red-500/30 transition-all flex items-center justify-center text-xs sm:text-sm"
                        >
                          <Trash2 size={14} className="sm:mr-2" />
                          <span className="hidden sm:inline">Obriši</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg sm:text-xl font-bold font-playfair uppercase tracking-wider mb-4">Rukovodstvo</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {management.filter((item) => item.type === 'rukovodstvo').map((item) => (
                  <div
                    key={item._id}
                    className="bg-white/5 border border-white/10 p-4 sm:p-6 rounded-lg hover:bg-white/10 transition-all"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white/20 mb-4">
                        {item.image ? (
                          <Image src={item.image} alt={item.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full bg-white/10 flex items-center justify-center">
                            <span className="text-gray-500 text-xs">Slika</span>
                          </div>
                        )}
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold font-playfair mb-1">{item.name}</h3>
                      <p className="text-sm sm:text-base text-gray-400 mb-4">{item.position}</p>
                      <div className="flex gap-2 w-full">
                        <button
                          onClick={() => handleEditManagement(item)}
                          className="flex-1 bg-white/10 text-white px-3 sm:px-4 py-2 hover:bg-white/20 transition-all flex items-center justify-center text-xs sm:text-sm"
                        >
                          <Edit size={14} className="sm:mr-2" />
                          <span className="hidden sm:inline">Izmeni</span>
                        </button>
                        <button
                          onClick={() => handleDeleteManagement(item._id)}
                          className="flex-1 bg-red-500/20 text-red-400 px-3 sm:px-4 py-2 hover:bg-red-500/30 transition-all flex items-center justify-center text-xs sm:text-sm"
                        >
                          <Trash2 size={14} className="sm:mr-2" />
                          <span className="hidden sm:inline">Obriši</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Management Modal */}
      {showManagementModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-white/10 p-4 sm:p-6 md:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold font-playfair mb-4 sm:mb-6">
              {editingManagement ? 'Izmeni Člana' : 'Dodaj Člana'}
            </h2>
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Ime</label>
                <input
                  type="text"
                  required
                  value={managementForm.name}
                  onChange={(e) => setManagementForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 px-3 sm:px-4 py-2 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:border-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Pozicija</label>
                <input
                  type="text"
                  required
                  value={managementForm.position}
                  onChange={(e) => setManagementForm((prev) => ({ ...prev, position: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 px-3 sm:px-4 py-2 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:border-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tip</label>
                <select
                  value={managementForm.type}
                  onChange={(e) => setManagementForm((prev) => ({ ...prev, type: e.target.value as 'upravni_odbor' | 'menadzment' | 'rukovodstvo' }))}
                  className="w-full bg-white/5 border border-white/10 px-3 sm:px-4 py-2 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:border-white"
                >
                  <option value="upravni_odbor">Upravni Odbor</option>
                  <option value="menadzment">Menadžment</option>
                  <option value="rukovodstvo">Rukovodstvo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Slika</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleManagementImageUpload}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
                  disabled={uploadingManagementImage}
                />
                {uploadingManagementImage && <p className="text-sm text-gray-400 mt-2">Upload u toku...</p>}
                {managementForm.image && (
                  <div className="mt-4 relative w-32 h-32 rounded-full overflow-hidden border border-white/20 mx-auto">
                    <Image src={managementForm.image} alt="Rukovodstvo" fill className="object-cover" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Redosled</label>
                <input
                  type="number"
                  value={managementForm.order}
                  onChange={(e) => setManagementForm((prev) => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-white/5 border border-white/10 px-3 sm:px-4 py-2 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:border-white"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={handleSaveManagement}
                  className="flex-1 bg-white text-black px-4 sm:px-6 py-2 sm:py-3 font-semibold uppercase tracking-wider hover:bg-gray-200 transition-all text-sm sm:text-base"
                >
                  Sačuvaj
                </button>
                <button
                  onClick={() => {
                    setShowManagementModal(false);
                    setEditingManagement(null);
                    setManagementForm({ name: '', position: '', image: '', type: 'rukovodstvo', order: 0 });
                  }}
                  className="flex-1 bg-white/10 text-white px-4 sm:px-6 py-2 sm:py-3 font-semibold uppercase tracking-wider hover:bg-white/20 transition-all text-sm sm:text-base"
                >
                  Otkaži
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

