'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Upload, X, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface Player {
  _id: string;
  name: string;
  surname: string;
  position: string;
  number: number;
  year: number;
  image?: string;
  bio?: string;
  category?: 'seniori' | 'juniori' | 'kadetkinje' | 'pionirke';
}

const categoryLabels: { [key: string]: string } = {
  seniori: 'SENIORI',
  juniori: 'JUNIORI',
  kadetkinje: 'KADETKINJE',
  pionirke: 'PIONIRKE',
};

const categoryColors: { [key: string]: string } = {
  seniori: 'from-blue-500 to-blue-600',
  juniori: 'from-purple-500 to-purple-600',
  kadetkinje: 'from-orange-500 to-orange-600',
  pionirke: 'from-pink-500 to-pink-600',
};

export default function AdminPlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    position: '',
    number: '',
    year: new Date().getFullYear().toString(),
    bio: '',
    image: '',
    category: 'seniori' as 'seniori' | 'juniori' | 'kadetkinje' | 'pionirke',
  });
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getPlayers();
      setPlayers(data);
    } catch (error) {
      toast.error('Greška pri učitavanju igrača');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Molimo izaberite sliku');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Slika je prevelika. Maksimalna veličina je 5MB');
      return;
    }

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('folder', 'igraci');

      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
      setFormData((prev) => ({ ...prev, image: data.url }));
      toast.success('Slika je uspešno upload-ovana');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Greška pri upload-u slike');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const playerData = {
        ...formData,
        number: parseInt(formData.number),
        year: parseInt(formData.year),
      };

      if (editingPlayer) {
        await apiClient.updatePlayer(editingPlayer._id, playerData);
        toast.success('Igrač je uspešno ažuriran');
      } else {
        await apiClient.createPlayer(playerData);
        toast.success('Igrač je uspešno kreiran');
      }

      setShowModal(false);
      setEditingPlayer(null);
      resetForm();
      loadPlayers();
    } catch (error: any) {
      toast.error(error.message || 'Greška pri čuvanju igrača');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      surname: '',
      position: '',
      number: '',
      year: new Date().getFullYear().toString(),
      bio: '',
      image: '',
      category: 'seniori',
    });
  };

  const handleEdit = (player: Player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      surname: player.surname,
      position: player.position,
      number: player.number.toString(),
      year: player.year.toString(),
      bio: player.bio || '',
      image: player.image || '',
      category: player.category || 'seniori',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Da li ste sigurni da želite da obrišete ovog igrača?')) return;

    try {
      await apiClient.deletePlayer(id);
      toast.success('Igrač je uspešno obrisan');
      loadPlayers();
    } catch (error: any) {
      toast.error(error.message || 'Greška pri brisanju igrača');
    }
  };

  const filteredPlayers = selectedCategory === 'all' 
    ? players 
    : players.filter(p => p.category === selectedCategory);

  const playersByCategory = {
    seniori: filteredPlayers.filter(p => p.category === 'seniori'),
    juniori: filteredPlayers.filter(p => p.category === 'juniori'),
    kadetkinje: filteredPlayers.filter(p => p.category === 'kadetkinje'),
    pionirke: filteredPlayers.filter(p => p.category === 'pionirke'),
  };

  const categories = ['seniori', 'juniori', 'kadetkinje', 'pionirke'] as const;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-playfair uppercase tracking-wider">
          Igrači
        </h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Category Filter */}
          <div className="relative flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-black border border-white/20 px-4 py-2 text-white focus:outline-none focus:border-white text-sm sm:text-base appearance-none cursor-pointer pr-8"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='white' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '12px'
              }}
            >
              <option value="all" className="bg-black text-white">Sve kategorije</option>
              <option value="seniori" className="bg-black text-white">Seniori</option>
              <option value="juniori" className="bg-black text-white">Juniori</option>
              <option value="kadetkinje" className="bg-black text-white">Kadetkinje</option>
              <option value="pionirke" className="bg-black text-white">Pionirke</option>
            </select>
          </div>
          <button
            onClick={() => {
              setEditingPlayer(null);
              resetForm();
              setShowModal(true);
            }}
            className="bg-white text-black px-4 sm:px-6 py-2 sm:py-3 font-semibold uppercase tracking-wider hover:bg-gray-200 transition-all flex items-center text-sm sm:text-base w-full sm:w-auto justify-center"
          >
            <Plus className="mr-2" size={18} />
            Dodaj Igrača
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="text-gray-400">Učitavanje...</div>
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">
            {selectedCategory === 'all' 
              ? 'Nema igrača u bazi' 
              : `Nema igrača u kategoriji ${categoryLabels[selectedCategory]}`}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map((category) => {
            const categoryPlayers = playersByCategory[category];
            if (categoryPlayers.length === 0) return null;

            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`h-1 flex-1 bg-gradient-to-r ${categoryColors[category]}`} />
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-playfair uppercase tracking-wider whitespace-nowrap">
                    {categoryLabels[category]}
                  </h2>
                  <div className={`h-1 flex-1 bg-gradient-to-r ${categoryColors[category]}`} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {categoryPlayers.map((player) => (
                    <motion.div
                      key={player._id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white/5 border border-white/10 p-4 sm:p-6 hover:bg-white/10 transition-all group"
                    >
                      <div className="aspect-[3/4] bg-white/10 relative mb-4 overflow-hidden rounded-lg">
                        {player.image ? (
                          <Image
                            src={player.image}
                            alt={`${player.name} ${player.surname}`}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500">
                            <div className="text-center">
                              <div className="text-4xl font-bold mb-2">#{player.number}</div>
                              <div className="text-sm">Nema slike</div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl font-bold">#{player.number}</span>
                          <span className="text-xs sm:text-sm uppercase tracking-wider text-gray-400 bg-white/5 px-2 py-1 rounded">
                            {player.position}
                          </span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-1">
                          {player.name} {player.surname}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-400">
                          Sezona {player.year}/{player.year + 1}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(player)}
                          className="flex-1 bg-white/10 text-white px-3 sm:px-4 py-2 hover:bg-white/20 transition-all flex items-center justify-center text-xs sm:text-sm"
                        >
                          <Edit size={14} className="mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Izmeni</span>
                        </button>
                        <button
                          onClick={() => handleDelete(player._id)}
                          className="flex-1 bg-red-500/20 text-red-400 px-3 sm:px-4 py-2 hover:bg-red-500/30 transition-all flex items-center justify-center text-xs sm:text-sm"
                        >
                          <Trash2 size={14} className="mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Obriši</span>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-white/10 p-4 sm:p-6 md:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold font-playfair">
                {editingPlayer ? 'Izmeni Igrača' : 'Dodaj Igrača'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingPlayer(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-2">Kategorija *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as 'seniori' | 'juniori' | 'kadetkinje' | 'pionirke' })}
                  className="w-full bg-black border border-white/20 px-4 py-3 text-white focus:outline-none focus:border-white appearance-none cursor-pointer pr-10"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='white' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '12px'
                  }}
                >
                  <option value="seniori" className="bg-black text-white">Seniori</option>
                  <option value="juniori" className="bg-black text-white">Juniori</option>
                  <option value="kadetkinje" className="bg-black text-white">Kadetkinje</option>
                  <option value="pionirke" className="bg-black text-white">Pionirke</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Ime *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Prezime *</label>
                  <input
                    type="text"
                    required
                    value={formData.surname}
                    onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Broj *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Pozicija</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full bg-black border border-white/20 px-4 py-3 text-white focus:outline-none focus:border-white appearance-none cursor-pointer pr-10"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='white' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.75rem center',
                      backgroundSize: '12px'
                    }}
                  >
                    <option value="" className="bg-black text-white">Izaberi poziciju</option>
                    <option value="PG" className="bg-black text-white">Point Guard</option>
                    <option value="SG" className="bg-black text-white">Shooting Guard</option>
                    <option value="SF" className="bg-black text-white">Small Forward</option>
                    <option value="PF" className="bg-black text-white">Power Forward</option>
                    <option value="C" className="bg-black text-white">Center</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Godina sezone *</label>
                <input
                  type="number"
                  required
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Biografija</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white resize-none"
                  placeholder="Kratka biografija igrača..."
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Slika igrača</label>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-lg p-6 transition-all ${
                    dragActive
                      ? 'border-white bg-white/10'
                      : 'border-white/20 bg-white/5 hover:border-white/40'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                    id="image-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center justify-center"
                  >
                    {formData.image ? (
                      <div className="relative w-full max-w-xs mx-auto">
                        <div className="relative aspect-[3/4] rounded-lg overflow-hidden border-2 border-white/20">
                          <Image
                            src={formData.image}
                            alt="Preview"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setFormData({ ...formData, image: '' });
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload
                          size={48}
                          className={`mb-4 ${uploading ? 'animate-pulse' : ''}`}
                        />
                        <p className="text-sm text-gray-400 mb-2">
                          {uploading ? 'Upload u toku...' : 'Kliknite ili prevucite sliku ovde'}
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, WEBP do 5MB
                        </p>
                      </>
                    )}
                  </label>
                </div>
                {uploading && (
                  <p className="text-sm text-gray-400 mt-2 text-center">
                    Upload u toku...
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-white text-black px-6 py-3 font-semibold uppercase tracking-wider hover:bg-gray-200 transition-all"
                >
                  {editingPlayer ? 'Sačuvaj Izmene' : 'Kreiraj Igrača'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPlayer(null);
                    resetForm();
                  }}
                  className="flex-1 bg-white/10 text-white px-6 py-3 font-semibold uppercase tracking-wider hover:bg-white/20 transition-all"
                >
                  Otkaži
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
