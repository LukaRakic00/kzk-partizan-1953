'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Upload } from 'lucide-react';
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
}

export default function AdminPlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    position: '',
    number: '',
    year: new Date().getFullYear().toString(),
    bio: '',
    image: '',
  });
  const [uploading, setUploading] = useState(false);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

      const data = await response.json();
      setFormData((prev) => ({ ...prev, image: data.url }));
      toast.success('Slika je uspešno upload-ovana');
    } catch (error) {
      toast.error('Greška pri upload-u slike');
    } finally {
      setUploading(false);
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
      setFormData({
        name: '',
        surname: '',
        position: '',
        number: '',
        year: new Date().getFullYear().toString(),
        bio: '',
        image: '',
      });
      loadPlayers();
    } catch (error: any) {
      toast.error(error.message || 'Greška pri čuvanju igrača');
    }
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

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-playfair uppercase tracking-wider">Igrači</h1>
        <button
          onClick={() => {
            setEditingPlayer(null);
            setFormData({
              name: '',
              surname: '',
              position: '',
              number: '',
              year: new Date().getFullYear().toString(),
              bio: '',
              image: '',
            });
            setShowModal(true);
          }}
          className="bg-white text-black px-4 sm:px-6 py-2 sm:py-3 font-semibold uppercase tracking-wider hover:bg-gray-200 transition-all flex items-center text-sm sm:text-base w-full sm:w-auto justify-center"
        >
          <Plus className="mr-2" size={18} />
          Dodaj Igrača
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="text-gray-400">Učitavanje...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player) => (
            <div
              key={player._id}
              className="bg-white/5 border border-white/10 p-6 hover:bg-white/10 transition-all"
            >
              <div className="aspect-[3/4] bg-white/10 relative mb-4">
                {player.image ? (
                  <Image
                    src={player.image}
                    alt={`${player.name} ${player.surname}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-2">#{player.number}</div>
                      <div className="text-sm">Slika</div>
                    </div>
                  </div>
                )}
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold">#{player.number}</span>
                  <span className="text-sm uppercase tracking-wider text-gray-400">
                    {player.position}
                  </span>
                </div>
                <h3 className="text-xl font-semibold">
                  {player.name} {player.surname}
                </h3>
                <p className="text-sm text-gray-400 mt-1">Sezona {player.year}/{player.year + 1}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(player)}
                  className="flex-1 bg-white/10 text-white px-4 py-2 hover:bg-white/20 transition-all flex items-center justify-center"
                >
                  <Edit size={16} className="mr-2" />
                  Izmeni
                </button>
                <button
                  onClick={() => handleDelete(player._id)}
                  className="flex-1 bg-red-500/20 text-red-400 px-4 py-2 hover:bg-red-500/30 transition-all flex items-center justify-center"
                >
                  <Trash2 size={16} className="mr-2" />
                  Obriši
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-white/10 p-4 sm:p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold font-playfair mb-4 sm:mb-6">
              {editingPlayer ? 'Izmeni Igrača' : 'Dodaj Igrača'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Ime</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Prezime</label>
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
                  <label className="block text-sm font-medium mb-2">Broj</label>
                  <input
                    type="number"
                    required
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Pozicija</label>
                  <select
                    required
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white"
                  >
                    <option value="">Izaberi poziciju</option>
                    <option value="PG">Point Guard</option>
                    <option value="SG">Shooting Guard</option>
                    <option value="SF">Small Forward</option>
                    <option value="PF">Power Forward</option>
                    <option value="C">Center</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Godina</label>
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
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Slika</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white"
                />
                {formData.image && (
                  <div className="mt-4 relative w-32 h-32">
                    <Image
                      src={formData.image}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                {uploading && <p className="text-sm text-gray-400 mt-2">Upload u toku...</p>}
              </div>

              <div className="flex space-x-4">
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

