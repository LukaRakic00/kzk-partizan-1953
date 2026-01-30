'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Upload, ArrowUp, ArrowDown, Download, ChevronUp, ChevronDown } from 'lucide-react';
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
  urlSajta?: string | null;
}

export default function AdminImages() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingImage, setEditingImage] = useState<ImageItem | null>(null);
  const [formData, setFormData] = useState({
      folder: 'baneri',
      category: '',
      order: 0,
      urlSajta: '',
    });
  const [uploading, setUploading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [baneriInfoOpen, setBaneriInfoOpen] = useState(true);

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
      // Ako editovanje postojeće slike
      if (editingImage) {
        const updateFormData = new FormData();
        updateFormData.append('file', file);
        updateFormData.append('folder', formData.folder);
        updateFormData.append('order', formData.order.toString());
        if (formData.category) {
          updateFormData.append('category', formData.category);
        }
        // Uvek pošalji urlSajta - ako je prazan, pošalji prazan string (server će ga postaviti na null)
        if (formData.urlSajta && formData.urlSajta.trim() !== '') {
          updateFormData.append('urlSajta', formData.urlSajta.trim());
        } else {
          updateFormData.append('urlSajta', '');
        }

        const token = localStorage.getItem('auth-token');
        const response = await fetch(`/api/images/${editingImage._id}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: updateFormData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Greška pri ažuriranju slike');
        }

        toast.success('Slika je uspešno ažurirana');
        loadImages();
        setShowModal(false);
        setEditingImage(null);
        setFormData({ folder: selectedFolder === 'all' ? 'baneri' : selectedFolder, category: '', order: 0, urlSajta: '' });
      } else {
        // Nova slika
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

        // Proveri Content-Type pre parsiranja
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Non-JSON response:', text.substring(0, 500));
          throw new Error(`Server je vratio neispravan format. Status: ${response.status}`);
        }

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
        
        // Dodaj urlSajta - ako je unet, sačuvaj ga, inače postavi na null
        if (formData.urlSajta && formData.urlSajta.trim() !== '') {
          imageData.urlSajta = formData.urlSajta.trim();
        } else {
          imageData.urlSajta = null;
        }

        console.log('Creating image in DB:', imageData); // Debug
        const createdImage = await apiClient.createImage(imageData);
        console.log('Created image:', createdImage); // Debug
        
        toast.success('Slika je uspešno upload-ovana i sačuvana');
        loadImages();
        setShowModal(false);
        setFormData({ folder: selectedFolder === 'all' ? 'baneri' : selectedFolder, category: '', order: 0, urlSajta: '' });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Greška: ${error.message || 'Nepoznata greška'}`);
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

  const handleDownload = async (image: ImageItem) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Izvuci ime fajla iz URL-a ili koristi publicId
      const fileName = image.publicId.split('/').pop() || `image-${image._id}`;
      a.download = `${fileName}.${image.format || 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Slika je preuzeta');
    } catch (error: any) {
      toast.error(`Greška pri preuzimanju: ${error.message || 'Nepoznata greška'}`);
    }
  };

  const handleBulkDownload = async () => {
    if (images.length === 0) {
      toast.error('Nema slika za preuzimanje');
      return;
    }

    try {
      toast.loading(`Preuzimanje ${images.length} slika...`, { id: 'bulk-download' });
      
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        try {
          const response = await fetch(image.url);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const fileName = image.publicId.split('/').pop() || `image-${image._id}`;
          a.download = `${fileName}.${image.format || 'jpg'}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          // Mala pauza između download-a da browser ne blokira
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Greška pri preuzimanju slike ${image._id}:`, error);
        }
      }
      
      toast.success(`Uspešno preuzeto ${images.length} slika`, { id: 'bulk-download' });
    } catch (error: any) {
      toast.error(`Greška pri bulk download-u: ${error.message || 'Nepoznata greška'}`, { id: 'bulk-download' });
    }
  };

  const folders = ['all', 'baneri', 'direktori', 'home', 'igraci', 'ostalo', 'partneri', 'sections', 'vesti'];

  // Mapa gde se koristi svaki folder na sajtu
  const folderUsage: Record<string, string> = {
    baneri: 'Hero sekcija (slider sa automatskim menjanjem slika svakih 5 sekundi na početnoj stranici)',
    direktori: 'Direktori sekcija',
    home: 'Home page galerija',
    igraci: 'Igrači stranica',
    ostalo: 'Ostale sekcije',
    partneri: 'Partneri slider (dno home page-a)',
    sections: 'Pozadinske slike za sekcije',
    vesti: 'Vesti stranica',
  };

  // Detaljnije objašnjenje za baneri
  const baneriInfo = {
    title: 'Baneri - Hero Sekcija',
    description: 'Slike iz foldera "baneri" se automatski prikazuju na početnoj stranici kao slider koji se menja svakih 5 sekundi.',
    usage: [
      'Redosled slika određuje se preko "order" polja (manji broj = prvo prikazuje)',
      'Sve slike iz foldera "baneri" se automatski učitavaju na home page',
      'Možete upravljati redosledom pomoću strelica gore/dole',
      'Prva slika (order: 0) se prikazuje kao glavna hero slika',
    ],
    location: 'Pojavljuje se na: Početna stranica (Home) - Hero sekcija na vrhu stranice',
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
          {images.length > 0 && (
            <button
              onClick={handleBulkDownload}
              className="bg-green-500 text-white px-4 sm:px-6 py-2 sm:py-3 font-semibold uppercase tracking-wider hover:bg-green-600 transition-all flex items-center justify-center text-xs sm:text-sm"
            >
              <Download className="mr-2" size={16} />
              Preuzmi Sve ({images.length})
            </button>
          )}
          <button
            onClick={() => {
              setEditingImage(null);
              setFormData({ folder: selectedFolder === 'all' ? 'baneri' : selectedFolder, category: '', order: 0, urlSajta: '' });
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
      <div className="mb-6">
        <div className="flex gap-2 flex-wrap mb-4">
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
        
        {/* Informacije o banerima kada je izabran folder baneri - kao Hero Banner sekcija */}
        {selectedFolder === 'baneri' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-white/5 to-white/[0.02] border-2 border-white/10 rounded-xl backdrop-blur-sm shadow-xl hover:shadow-2xl hover:shadow-white/5 transition-all duration-300 overflow-hidden mb-4"
          >
            <button
              onClick={() => setBaneriInfoOpen(!baneriInfoOpen)}
              className="w-full p-4 md:p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-white to-transparent"></div>
                <h2 className="text-lg sm:text-xl font-bold font-playfair uppercase tracking-wider">
                  Baneri - Hero Sekcija
                </h2>
              </div>
              {baneriInfoOpen ? (
                <ChevronUp className="text-white" size={20} />
              ) : (
                <ChevronDown className="text-white" size={20} />
              )}
            </button>

            {baneriInfoOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="px-4 md:px-6 pb-6"
              >
                <p className="text-gray-400 text-sm mb-4 ml-4">
                  Upravljajte hero slikama na početnoj stranici. Sve slike iz foldera 'baneri' se automatski prikazuju kao slider koji se menja svakih 5 sekundi. Redosled slika određuje se preko 'order' polja.
                </p>

                <div className="space-y-3 mb-4 ml-4">
                  {baneriInfo.usage.map((item, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-white/60 mt-1">•</span>
                      <span className="text-sm text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg ml-4">
                  <p className="text-xs text-blue-400 font-medium">
                    📍 <strong>Pojavljuje se na:</strong> Početna stranica (Home) - Hero sekcija na vrhu stranice
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
        
        {/* Opšte informacije za ostale foldere */}
        {selectedFolder !== 'all' && selectedFolder !== 'baneri' && folderUsage[selectedFolder] && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-300">
              <span className="font-semibold text-white uppercase">{selectedFolder}:</span> {folderUsage[selectedFolder]}
            </p>
          </div>
        )}
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
              setFormData({ folder: selectedFolder === 'all' ? 'baneri' : selectedFolder, category: '', order: 0, urlSajta: '' });
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
                {image.urlSajta && image.urlSajta.trim() !== '' ? (
                  <p className={`text-xs mt-1 truncate ${image.folder === 'partneri' ? 'text-yellow-400 font-semibold' : 'text-blue-400'}`} title={image.urlSajta}>
                    🔗 {image.urlSajta}
                  </p>
                ) : image.folder === 'partneri' ? (
                  <p className="text-xs text-gray-500 mt-1 italic">
                    ⚠️ Nema URL-a - partner nije klikabilan
                  </p>
                ) : null}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDownload(image)}
                  className="flex-1 bg-green-500/20 text-green-400 px-3 py-2 hover:bg-green-500/30 transition-all flex items-center justify-center"
                  title="Preuzmi sliku"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={() => {
                    setEditingImage(image);
                    setFormData({
                      folder: image.folder,
                      category: image.category || '',
                      order: image.order,
                      urlSajta: image.urlSajta || '',
                    });
                    setShowModal(true);
                  }}
                  className="flex-1 bg-blue-500/20 text-blue-400 px-3 py-2 hover:bg-blue-500/30 transition-all flex items-center justify-center"
                  title="Izmeni sliku"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleOrderChange(image._id, 'up')}
                  className="flex-1 bg-white/10 text-white px-3 py-2 hover:bg-white/20 transition-all flex items-center justify-center"
                  title="Pomeri gore"
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  onClick={() => handleOrderChange(image._id, 'down')}
                  className="flex-1 bg-white/10 text-white px-3 py-2 hover:bg-white/20 transition-all flex items-center justify-center"
                  title="Pomeri dole"
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  onClick={() => handleDelete(image._id)}
                  className="flex-1 bg-red-500/20 text-red-400 px-3 py-2 hover:bg-red-500/30 transition-all flex items-center justify-center"
                  title="Obriši"
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
          <div className="bg-black border border-white/10 p-4 sm:p-6 md:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold font-playfair mb-6">
              {editingImage ? 'Izmeni Sliku' : 'Dodaj Sliku'}
            </h2>
            {editingImage && (
              <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded">
                <p className="text-sm text-gray-400 mb-2">Trenutna slika:</p>
                <div className="relative aspect-video">
                  <Image
                    src={editingImage.url}
                    alt="Current"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            )}
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
                <label className={`block text-sm font-medium mb-2 ${formData.folder === 'partneri' ? 'text-yellow-400' : ''}`}>
                  URL Sajta {formData.folder === 'baneri' ? '(za banere)' : formData.folder === 'partneri' ? '(za partnere - OBAVEZNO za klikabilne linkove!)' : ''} - {formData.folder === 'partneri' ? 'preporučeno' : 'opciono'}
                </label>
                <input
                  type="url"
                  value={formData.urlSajta}
                  onChange={(e) => setFormData({ ...formData, urlSajta: e.target.value })}
                  className={`w-full bg-white/5 border ${formData.folder === 'partneri' ? 'border-yellow-500/50 focus:border-yellow-500' : 'border-white/10 focus:border-white'} px-4 py-3 text-white focus:outline-none`}
                  placeholder="https://example.com"
                />
                <p className={`text-xs mt-1 ${formData.folder === 'partneri' ? 'text-yellow-400' : 'text-gray-400'}`}>
                  {formData.folder === 'baneri' 
                    ? 'Ako je unet URL, baner će biti klikabilan i vodiće na ovaj sajt. Ostavite prazno ako baner ne treba da bude klikabilan.'
                    : formData.folder === 'partneri'
                    ? '⚠️ VAŽNO: Ako je unet URL, partner će biti klikabilan i vodiće na ovaj sajt. Ostavite prazno ako partner ne treba da bude klikabilan. URL mora počinjati sa http:// ili https://'
                    : 'Ako je unet URL, slika će biti klikabilna i vodiće na ovaj sajt. Ostavite prazno ako slika ne treba da bude klikabilna.'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {editingImage ? 'Nova slika (zamenjuje staru)' : 'Slika'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white"
                  disabled={uploading}
                />
                {uploading && <p className="text-sm text-gray-400 mt-2">
                  {editingImage ? 'Ažuriranje u toku...' : 'Upload u toku...'}
                </p>}
                {editingImage && (
                  <p className="text-xs text-yellow-400 mt-2">
                    ⚠️ Stara slika će biti obrisana sa Cloudinary kada uploadujete novu
                  </p>
                )}
              </div>

              {!editingImage && (
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
              )}
              {editingImage && (
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={async () => {
                      // Ažuriraj samo metapodatke bez upload-a nove slike
                      try {
                        setUploading(true);
                        const updateFormData = new FormData();
                        updateFormData.append('folder', formData.folder);
                        updateFormData.append('order', formData.order.toString());
                        if (formData.category) {
                          updateFormData.append('category', formData.category);
                        }
                        // Uvek pošalji urlSajta - ako je prazan, pošalji prazan string (server će ga postaviti na null)
                        if (formData.urlSajta && formData.urlSajta.trim() !== '') {
                          updateFormData.append('urlSajta', formData.urlSajta.trim());
                        } else {
                          updateFormData.append('urlSajta', '');
                        }

                        const token = localStorage.getItem('auth-token');
                        const response = await fetch(`/api/images/${editingImage._id}`, {
                          method: 'PUT',
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                          body: updateFormData,
                        });

                        if (!response.ok) {
                          const errorData = await response.json();
                          throw new Error(errorData.error || 'Greška pri ažuriranju');
                        }

                        toast.success('Metapodaci su ažurirani');
                        loadImages();
                        setShowModal(false);
                        setEditingImage(null);
                        setFormData({ folder: selectedFolder === 'all' ? 'baneri' : selectedFolder, category: '', order: 0, urlSajta: '' });
                      } catch (error: any) {
                        toast.error(`Greška: ${error.message}`);
                      } finally {
                        setUploading(false);
                      }
                    }}
                    className="flex-1 bg-blue-500 text-white px-6 py-3 font-semibold uppercase tracking-wider hover:bg-blue-600 transition-all"
                    disabled={uploading}
                  >
                    Sačuvaj izmene
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingImage(null);
                      setFormData({ folder: selectedFolder === 'all' ? 'baneri' : selectedFolder, category: '', order: 0, urlSajta: '' });
                    }}
                    className="flex-1 bg-white/10 text-white px-6 py-3 font-semibold uppercase tracking-wider hover:bg-white/20 transition-all"
                    disabled={uploading}
                  >
                    Otkaži
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

