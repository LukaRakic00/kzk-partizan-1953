'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Plus, Edit, Trash2, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface Gallery {
  _id: string;
  title: string;
  description?: string;
  images: string[];
  category: string;
  year?: number;
}

export default function AdminGallery() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGallery, setEditingGallery] = useState<Gallery | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'ostalo',
    year: new Date().getFullYear().toString(),
    images: [] as string[],
  });
  const [uploading, setUploading] = useState(false);
  const [availableImages, setAvailableImages] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [showImageSelector, setShowImageSelector] = useState(false);

  useEffect(() => {
    loadGalleries();
  }, []);

  const loadGalleries = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getGalleries();
      setGalleries(data);
    } catch (error) {
      toast.error('Greška pri učitavanju galerija');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableImages = async () => {
    if (formData.category !== 'igraci') return;
    
    setLoadingImages(true);
    try {
      const images = await apiClient.getImages('igraci');
      setAvailableImages(images);
      setShowImageSelector(true);
    } catch (error) {
      toast.error('Greška pri učitavanju slika');
    } finally {
      setLoadingImages(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        uploadFormData.append('folder', formData.category === 'igraci' ? 'igraci' : 'galerija');

        const token = localStorage.getItem('auth-token');
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: uploadFormData,
        });

        const data = await response.json();
        return data.url;
      });

      const urls = await Promise.all(uploadPromises);
      setFormData((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
      toast.success('Slike su uspešno upload-ovane');
    } catch (error) {
      toast.error('Greška pri upload-u slika');
    } finally {
      setUploading(false);
    }
  };

  const selectImageFromCloudinary = (imageUrl: string) => {
    if (!formData.images.includes(imageUrl)) {
      setFormData((prev) => ({ ...prev, images: [...prev.images, imageUrl] }));
      toast.success('Slika je dodata');
    } else {
      toast.error('Slika je već dodata');
    }
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const galleryData = {
        ...formData,
        year: formData.year ? parseInt(formData.year) : undefined,
      };

      if (editingGallery) {
        await apiClient.updateGallery(editingGallery._id, galleryData);
        toast.success('Galerija je uspešno ažurirana');
      } else {
        await apiClient.createGallery(galleryData);
        toast.success('Galerija je uspešno kreirana');
      }

      setShowModal(false);
      setEditingGallery(null);
      setFormData({
        title: '',
        description: '',
        category: 'igraci',
        year: '2025',
        images: [],
      });
      setShowImageSelector(false);
      loadGalleries();
    } catch (error: any) {
      toast.error(error.message || 'Greška pri čuvanju galerije');
    }
  };

  const handleEdit = (gallery: Gallery) => {
    setEditingGallery(gallery);
    setFormData({
      title: gallery.title,
      description: gallery.description || '',
      category: gallery.category,
      year: gallery.year?.toString() || '',
      images: gallery.images,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Da li ste sigurni da želite da obrišete ovu galeriju?')) return;

    try {
      await apiClient.deleteGallery(id);
      toast.success('Galerija je uspešno obrisana');
      loadGalleries();
    } catch (error: any) {
      toast.error(error.message || 'Greška pri brisanju galerije');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-playfair uppercase tracking-wider">Galerija</h1>
        <button
          onClick={() => {
            setEditingGallery(null);
            setFormData({
              title: '',
              description: '',
              category: 'igraci',
              year: '2025',
              images: [],
            });
            setShowImageSelector(false);
            setShowModal(true);
          }}
          className="bg-white text-black px-4 sm:px-6 py-2 sm:py-3 font-semibold uppercase tracking-wider hover:bg-gray-200 transition-all flex items-center text-sm sm:text-base w-full sm:w-auto justify-center"
        >
          <Plus className="mr-2" size={18} />
          Dodaj Galeriju
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="text-gray-400">Učitavanje...</div>
        </div>
      ) : (
        <div className="space-y-6">
          {galleries.map((gallery) => (
            <div
              key={gallery._id}
              className="bg-white/5 border border-white/10 p-4 sm:p-6 hover:bg-white/10 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-semibold mb-1">{gallery.title}</h3>
                  <p className="text-gray-400 text-xs sm:text-sm mb-2">{gallery.category}</p>
                  {gallery.year && (
                    <p className="text-gray-400 text-xs sm:text-sm">Godina: {gallery.year}</p>
                  )}
                  {gallery.description && (
                    <p className="text-gray-300 mt-2 text-sm sm:text-base">{gallery.description}</p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                  <button
                    onClick={() => handleEdit(gallery)}
                    className="bg-white/10 text-white px-3 sm:px-4 py-2 hover:bg-white/20 transition-all flex items-center justify-center text-xs sm:text-sm"
                  >
                    <Edit size={14} className="sm:mr-2" />
                    <span className="hidden sm:inline">Izmeni</span>
                  </button>
                  <button
                    onClick={() => handleDelete(gallery._id)}
                    className="bg-red-500/20 text-red-400 px-3 sm:px-4 py-2 hover:bg-red-500/30 transition-all flex items-center justify-center text-xs sm:text-sm"
                  >
                    <Trash2 size={14} className="sm:mr-2" />
                    <span className="hidden sm:inline">Obriši</span>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                {gallery.images.slice(0, 4).map((image, index) => (
                  <div key={index} className="aspect-square relative">
                    <Image
                      src={image}
                      alt={`${gallery.title} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
              {gallery.images.length > 4 && (
                <p className="text-sm text-gray-400 mt-2">
                  +{gallery.images.length - 4} više slika
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-white/10 p-4 sm:p-6 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold font-playfair mb-4 sm:mb-6">
              {editingGallery ? 'Izmeni Galeriju' : 'Dodaj Galeriju'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Naslov (opciono - ne prikazuje se na stranici)</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white"
                  placeholder="Naslov za admin panel (opciono)"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Kategorija</label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      setFormData({ ...formData, category: e.target.value });
                      setShowImageSelector(false);
                    }}
                    className="w-full bg-white/5 border border-white/10 px-3 sm:px-4 py-2 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:border-white"
                  >
                    <option value="igraci">Igrači</option>
                    <option value="baneri">Baneri</option>
                    <option value="partneri">Partneri</option>
                    <option value="direktori">Direktori</option>
                    <option value="sections">Sections</option>
                    <option value="vesti">Vesti</option>
                    <option value="ostalo">Ostalo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Godina</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder="2025"
                    className="w-full bg-white/5 border border-white/10 px-3 sm:px-4 py-2 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Opis (opciono - ne prikazuje se na stranici)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white resize-none"
                  placeholder="Opis za admin panel (opciono)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Slike</label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="flex-1 bg-white/5 border border-white/10 px-3 sm:px-4 py-2 sm:py-3 text-white text-xs sm:text-sm focus:outline-none focus:border-white"
                  />
                  {formData.category === 'igraci' && (
                    <button
                      type="button"
                      onClick={loadAvailableImages}
                      disabled={loadingImages}
                      className="bg-white/10 border border-white/20 px-3 sm:px-4 py-2 sm:py-3 text-white text-xs sm:text-sm hover:bg-white/20 transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {loadingImages ? 'Učitavanje...' : 'Izaberi iz Cloudinary'}
                    </button>
                  )}
                </div>
                {uploading && <p className="text-xs sm:text-sm text-gray-400 mt-2">Upload u toku...</p>}
              </div>

              {/* Cloudinary Image Selector */}
              {showImageSelector && formData.category === 'igraci' && (
                <div className="border border-white/10 rounded-lg p-3 sm:p-4 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <label className="block text-xs sm:text-sm font-medium">Izaberi slike iz Cloudinary (igraci)</label>
                    <button
                      type="button"
                      onClick={() => setShowImageSelector(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  {availableImages.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                      {availableImages.map((img, index) => (
                        <div
                          key={index}
                          className={`relative aspect-square cursor-pointer border-2 rounded-lg overflow-hidden ${
                            formData.images.includes(img.url)
                              ? 'border-green-500'
                              : 'border-white/20 hover:border-white/40'
                          }`}
                          onClick={() => selectImageFromCloudinary(img.url)}
                        >
                          <Image
                            src={img.url}
                            alt={`Image ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          {formData.images.includes(img.url) && (
                            <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                              <span className="text-white font-bold">✓</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">Nema slika u folderu "igraci"</p>
                  )}
                </div>
              )}

              {formData.images.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">Upload-ovane Slike</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative aspect-square group">
                        <Image
                          src={image}
                          alt={`Image ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-white text-black px-4 sm:px-6 py-2 sm:py-3 font-semibold uppercase tracking-wider hover:bg-gray-200 transition-all text-sm sm:text-base"
                >
                  {editingGallery ? 'Sačuvaj Izmene' : 'Kreiraj Galeriju'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingGallery(null);
                  }}
                  className="flex-1 bg-white/10 text-white px-4 sm:px-6 py-2 sm:py-3 font-semibold uppercase tracking-wider hover:bg-white/20 transition-all text-sm sm:text-base"
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

