'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Plus, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface History {
  _id: string;
  year: number;
  title: string;
  content: string;
  image?: string;
  achievements: string[];
}

export default function AdminHistory() {
  const [history, setHistory] = useState<History[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingHistory, setEditingHistory] = useState<History | null>(null);
  const [formData, setFormData] = useState({
    year: new Date().getFullYear().toString(),
    title: '',
    content: '',
    image: '',
    achievements: '',
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getHistory();
      setHistory(data);
    } catch (error) {
      toast.error('Greška pri učitavanju istorije');
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
      uploadFormData.append('folder', 'ostalo');

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
      const historyData = {
        ...formData,
        year: parseInt(formData.year),
        achievements: formData.achievements
          .split('\n')
          .map((a) => a.trim())
          .filter(Boolean),
      };

      if (editingHistory) {
        await apiClient.updateHistory(editingHistory._id, historyData);
        toast.success('Istorija je uspešno ažurirana');
      } else {
        await apiClient.createHistory(historyData);
        toast.success('Istorija je uspešno kreirana');
      }

      setShowModal(false);
      setEditingHistory(null);
      setFormData({
        year: new Date().getFullYear().toString(),
        title: '',
        content: '',
        image: '',
        achievements: '',
      });
      loadHistory();
    } catch (error: any) {
      toast.error(error.message || 'Greška pri čuvanju istorije');
    }
  };

  const handleEdit = (item: History) => {
    setEditingHistory(item);
    setFormData({
      year: item.year.toString(),
      title: item.title,
      content: item.content,
      image: item.image || '',
      achievements: item.achievements.join('\n'),
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Da li ste sigurni da želite da obrišete ovu istoriju?')) return;

    try {
      await apiClient.deleteHistory(id);
      toast.success('Istorija je uspešno obrisana');
      loadHistory();
    } catch (error: any) {
      toast.error(error.message || 'Greška pri brisanju istorije');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-playfair uppercase tracking-wider">Istorijat</h1>
        <button
          onClick={() => {
            setEditingHistory(null);
            setFormData({
              year: new Date().getFullYear().toString(),
              title: '',
              content: '',
              image: '',
              achievements: '',
            });
            setShowModal(true);
          }}
          className="bg-white text-black px-4 sm:px-6 py-2 sm:py-3 font-semibold uppercase tracking-wider hover:bg-gray-200 transition-all flex items-center text-sm sm:text-base w-full sm:w-auto justify-center"
        >
          <Plus className="mr-2" size={18} />
          Dodaj Istoriju
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="text-gray-400">Učitavanje...</div>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item._id}
              className="bg-white/5 border border-white/10 p-6 hover:bg-white/10 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-4 mb-2">
                    <span className="text-2xl font-bold">{item.year}</span>
                    <h3 className="text-xl font-semibold">{item.title}</h3>
                  </div>
                  <p className="text-gray-300 mb-2 line-clamp-2">{item.content}</p>
                  {item.achievements.length > 0 && (
                    <p className="text-sm text-gray-400">
                      {item.achievements.length} dostignuća
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="bg-white/10 text-white px-4 py-2 hover:bg-white/20 transition-all flex items-center text-sm"
                  >
                    <Edit size={16} className="mr-2" />
                    Izmeni
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="bg-red-500/20 text-red-400 px-4 py-2 hover:bg-red-500/30 transition-all flex items-center text-sm"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Obriši
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-white/10 p-4 sm:p-6 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold font-playfair mb-6">
              {editingHistory ? 'Izmeni Istoriju' : 'Dodaj Istoriju'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium mb-2">Naslov</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Sadržaj</label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Dostignuća (jedno po liniji)</label>
                <textarea
                  value={formData.achievements}
                  onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                  rows={6}
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white resize-none font-mono"
                  placeholder="Prvo dostignuće&#10;Drugo dostignuće&#10;..."
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
                {uploading && <p className="text-sm text-gray-400 mt-2">Upload u toku...</p>}
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 bg-white text-black px-6 py-3 font-semibold uppercase tracking-wider hover:bg-gray-200 transition-all"
                >
                  {editingHistory ? 'Sačuvaj Izmene' : 'Kreiraj Istoriju'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingHistory(null);
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

