'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Upload, ArrowUp, ArrowDown } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface ImageItem {
  _id: string;
  publicId: string;
  url: string;
  category: string;
  folder: string;
  order: number;
  width?: number;
  height?: number;
  format?: string;
}

export default function AdminImages() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingImage, setEditingImage] = useState<ImageItem | null>(null);
  const     [formData, setFormData] = useState({
      folder: 'baneri',
      category: '',
      order: 0,
    });
  const [uploading, setUploading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>('all');

  useEffect(() => {
    loadImages();
  }, [selectedFolder]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getImages(
        selectedFolder === 'all' ? undefined : selectedFolder
      );
      console.log('Loaded images:', data); // Debug
      if (data && Array.isArray(data)) {
        setImages(data);
      } else {
        console.error('Invalid data format:', data);
        setImages([]);
        toast.error('Neispravan format podataka');
      }
    } catch (error: any) {
      console.error('Error loading images:', error);
      toast.error(`Greška pri učitavanju slika: ${error.message || 'Nepoznata greška'}`);
      setImages([]);
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
      uploadFormData.append('folder', formData.folder);

      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Greška pri upload-u');
      }

      const data = await response.json();
      console.log('Upload response:', data); // Debug
      
      if (!data.url) {
        throw new Error('URL slike nije vraćen iz Cloudinary');
      }
      
      // Kreiraj Image dokument u bazi
      const imageData: any = {
        publicId: data.publicId || '',
        url: data.url,
        folder: formData.folder,
        order: formData.order,
        width: data.width,
        height: data.height,
        format: data.format || file.name.split('.').pop(),
      };
      
      // Dodaj category samo ako je unet
      if (formData.category && formData.category.trim() !== '') {
        imageData.category = formData.category;
      }

      console.log('Creating image in DB:', imageData); // Debug
      const createdImage = await apiClient.createImage(imageData);
      console.log('Created image:', createdImage); // Debug
      
      toast.success('Slika je uspešno upload-ovana i sačuvana');
      loadImages();
      setShowModal(false);
      setFormData({ folder: 'baneri', category: '', order: 0 });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Greška pri upload-u slike: ${error.message || 'Nepoznata greška'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Da li ste sigurni da želite da obrišete ovu sliku?')) return;

    try {
      await apiClient.deleteImage(id);
      toast.success('Slika je uspešno obrisana');
      loadImages();
    } catch (error: any) {
      toast.error(error.message || 'Greška pri brisanju slike');
    }
  };

  const handleOrderChange = async (id: string, direction: 'up' | 'down') => {
    const image = images.find((img) => img._id === id);
    if (!image) return;

    const newOrder = direction === 'up' ? image.order - 1 : image.order + 1;
    
    try {
      await apiClient.updateImage(id, { order: newOrder });
      toast.success('Redosled je ažuriran');
      loadImages();
    } catch (error) {
      toast.error('Greška pri ažuriranju redosleda');
    }
  };

  const folders = ['all', 'baneri', 'direktori', 'home', 'igraci', 'ostalo', 'partneri', 'sections', 'vesti'];

  // Mapa gde se koristi svaki folder na sajtu
  const folderUsage: Record<string, string> = {
    baneri: 'Hero sekcija (glavna pozadinska slika)',
    direktori: 'Direktori sekcija',
    home: 'Home page galerija',
    igraci: 'Igrači stranica',
    ostalo: 'Ostale sekcije',
    partneri: 'Partneri slider (dno home page-a)',
    sections: 'Pozadinske slike za sekcije',
    vesti: 'Vesti stranica',
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-playfair uppercase tracking-wider">Slike</h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
          {selectedFolder !== 'all' && (
            <button
              onClick={async () => {
                try {
                  toast.loading('Sinhronizacija u toku...', { id: 'sync' });
                  const token = localStorage.getItem('auth-token');
                  const response = await fetch('/api/images/sync', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ folder: selectedFolder }),
                  });
                  const data = await response.json();
                  if (data.success) {
                    toast.success(`Sinhronizovano: ${data.synced} novih, ${data.skipped} već postoji`, { id: 'sync' });
                    loadImages();
                  } else {
                    toast.error(data.error || 'Greška pri sinhronizaciji', { id: 'sync' });
                  }
                } catch (error: any) {
                  toast.error(`Greška: ${error.message}`, { id: 'sync' });
                }
              }}
              className="bg-blue-500 text-white px-4 sm:px-6 py-2 sm:py-3 font-semibold uppercase tracking-wider hover:bg-blue-600 transition-all flex items-center justify-center text-xs sm:text-sm"
            >
              <Upload className="mr-2" size={16} />
              Sinhronizuj iz Cloudinary
            </button>
          )}
          <button
            onClick={() => {
              setEditingImage(null);
              setFormData({ folder: selectedFolder === 'all' ? 'baneri' : selectedFolder, category: '', order: 0 });
              setShowModal(true);
            }}
            className="bg-white text-black px-4 sm:px-6 py-2 sm:py-3 font-semibold uppercase tracking-wider hover:bg-gray-200 transition-all flex items-center justify-center text-xs sm:text-sm"
          >
            <Plus className="mr-2" size={16} />
            Dodaj Sliku
          </button>
        </div>
      </div>

      {/* Folder Filter */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {folders.map((folder) => (
          <button
            key={folder}
            onClick={() => setSelectedFolder(folder)}
            className={`px-4 py-2 uppercase tracking-wider transition-all ${
              selectedFolder === folder
                ? 'bg-white text-black'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {folder === 'all' ? 'Sve' : folder}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="text-gray-400">Učitavanje...</div>
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-gray-400 mb-4">Nema slika u ovom folderu</div>
          <button
            onClick={() => {
              setEditingImage(null);
              setFormData({ folder: selectedFolder === 'all' ? 'baneri' : selectedFolder, category: '', order: 0 });
              setShowModal(true);
            }}
            className="bg-white text-black px-6 py-3 font-semibold uppercase tracking-wider hover:bg-gray-200 transition-all"
          >
            Dodaj Prvu Sliku
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image) => (
            <div
              key={image._id}
              className="bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-all"
            >
              <div className="aspect-video relative mb-4 bg-white/10">
                {image.url ? (
                  <Image
                    src={image.url}
                    alt={image.folder}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                    Nema URL-a
                  </div>
                )}
              </div>
              <div className="mb-2">
                <p className="text-sm text-gray-400">
                  Folder: <span className="text-white font-semibold">{image.folder}</span>
                </p>
                {folderUsage[image.folder] && (
                  <p className="text-xs text-green-400 mb-1">
                    ✓ {folderUsage[image.folder]}
                  </p>
                )}
                <p className="text-sm text-gray-400">Order: {image.order}</p>
                {image.width && image.height && (
                  <p className="text-sm text-gray-400">
                    {image.width} x {image.height}
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleOrderChange(image._id, 'up')}
                  className="flex-1 bg-white/10 text-white px-3 py-2 hover:bg-white/20 transition-all flex items-center justify-center"
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  onClick={() => handleOrderChange(image._id, 'down')}
                  className="flex-1 bg-white/10 text-white px-3 py-2 hover:bg-white/20 transition-all flex items-center justify-center"
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  onClick={() => handleDelete(image._id)}
                  className="flex-1 bg-red-500/20 text-red-400 px-3 py-2 hover:bg-red-500/30 transition-all flex items-center justify-center"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-white/10 p-4 sm:p-6 md:p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold font-playfair mb-6">Dodaj Sliku</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Folder (Gde se koristi na sajtu)</label>
                <select
                  value={formData.folder}
                  onChange={(e) => setFormData({ ...formData, folder: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white mb-2"
                >
                  <option value="baneri">Baneri - Hero sekcija (glavna pozadina)</option>
                  <option value="direktori">Direktori - Direktori sekcija</option>
                  <option value="home">Home - Home page galerija</option>
                  <option value="igraci">Igrači - Igrači stranica</option>
                  <option value="ostalo">Ostalo - Ostale sekcije</option>
                  <option value="partneri">Partneri - Partneri slider (dno home page-a)</option>
                  <option value="sections">Sections - Pozadinske slike za sekcije</option>
                  <option value="vesti">Vesti - Vesti stranica</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {folderUsage[formData.folder] || 'Izaberi folder da vidiš gde se koristi'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category ID</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white"
                  placeholder="Opciono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Order</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white"
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
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingImage(null);
                  }}
                  className="flex-1 bg-white/10 text-white px-6 py-3 font-semibold uppercase tracking-wider hover:bg-white/20 transition-all"
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

