'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function AdminClubStatus() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statutImage, setStatutImage] = useState('');
  const [statutPdfUrl, setStatutPdfUrl] = useState('https://kzkpartizan1953.rs/wp-content/uploads/2025/05/statut-kzk-partizan-1953.pdf');
  const [antidopingPdfUrl, setAntidopingPdfUrl] = useState('https://kzkpartizan1953.rs/wp-content/uploads/2025/05/2025-34-0527-1-Obavestenje-nacionalnim-sportskim-savezima-infuzije.pdf');
  const [uploadingStatutImage, setUploadingStatutImage] = useState(false);
  const [availableImages, setAvailableImages] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [showImageSelector, setShowImageSelector] = useState(false);

  useEffect(() => {
    loadStatutData();
  }, []);

  const loadStatutData = async () => {
    try {
      setLoading(true);
      const imageSetting = await apiClient.getSettings('statut_image');
      if (imageSetting && imageSetting.value) {
        setStatutImage(imageSetting.value);
      }
      const pdfSetting = await apiClient.getSettings('statut_pdf_url');
      if (pdfSetting && pdfSetting.value) {
        setStatutPdfUrl(pdfSetting.value);
      }
      const antidopingSetting = await apiClient.getSettings('antidoping_pdf_url');
      if (antidopingSetting && antidopingSetting.value) {
        setAntidopingPdfUrl(antidopingSetting.value);
      }
    } catch (error) {
      toast.error('Greška pri učitavanju podataka');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableImages = async () => {
    setLoadingImages(true);
    try {
      const images = await apiClient.getImagesFromCloudinary('baneri');
      setAvailableImages(images);
      setShowImageSelector(true);
    } catch (error) {
      toast.error('Greška pri učitavanju slika');
    } finally {
      setLoadingImages(false);
    }
  };

  const selectImageFromCloudinary = (imageUrl: string) => {
    setStatutImage(imageUrl);
    setShowImageSelector(false);
    toast.success('Slika je izabrana');
  };

  const handleStatutImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingStatutImage(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('folder', 'statut');
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: uploadFormData,
      });
      const data = await response.json();
      setStatutImage(data.url);
      toast.success('Slika statuta je uspešno upload-ovana');
    } catch (error) {
      toast.error('Greška pri upload-u slike');
    } finally {
      setUploadingStatutImage(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiClient.updateSetting({
        key: 'statut_image',
        value: statutImage,
        type: 'image',
        description: 'Slika statuta',
      });
      await apiClient.updateSetting({
        key: 'statut_pdf_url',
        value: statutPdfUrl,
        type: 'text',
        description: 'URL statuta PDF',
      });
      await apiClient.updateSetting({
        key: 'antidoping_pdf_url',
        value: antidopingPdfUrl,
        type: 'text',
        description: 'URL antidoping PDF',
      });
      toast.success('Statut kluba je uspešno sačuvan');
    } catch (error) {
      toast.error('Greška pri čuvanju statuta kluba');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="text-gray-400">Učitavanje...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-playfair uppercase tracking-wider">Statut Kluba</h1>
      </div>

      <div className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-lg space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Slika Statuta (prikazuje se iznad dugmadi)</label>
          {statutImage && (
            <div className="mb-4 relative w-full max-w-[180px] aspect-[3/4] rounded-lg overflow-hidden border border-white/10">
              <Image
                src={statutImage}
                alt="Statut"
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleStatutImageUpload}
              disabled={uploadingStatutImage}
              className="flex-1 bg-white/5 border border-white/10 px-3 sm:px-4 py-2 sm:py-3 text-white text-xs sm:text-sm focus:outline-none focus:border-white"
            />
            <button
              type="button"
              onClick={loadAvailableImages}
              disabled={loadingImages}
              className="bg-white/10 border border-white/20 px-3 sm:px-4 py-2 sm:py-3 text-white text-xs sm:text-sm hover:bg-white/20 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {loadingImages ? 'Učitavanje...' : 'Izaberi iz Cloudinary'}
            </button>
          </div>
          {uploadingStatutImage && (
            <p className="text-xs sm:text-sm text-gray-400 mt-2">Upload u toku...</p>
          )}

          {/* Cloudinary Image Selector */}
          {showImageSelector && (
            <div className="border border-white/10 rounded-lg p-3 sm:p-4 max-h-96 overflow-y-auto mt-4">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <label className="block text-xs sm:text-sm font-medium">Izaberi sliku iz Cloudinary (baneri)</label>
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
                        statutImage === img.url
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
                      {statutImage === img.url && (
                        <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                          <span className="text-white font-bold">✓</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">Nema slika u folderu "baneri"</p>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">URL Statuta PDF</label>
          <input
            type="text"
            value={statutPdfUrl}
            onChange={(e) => setStatutPdfUrl(e.target.value)}
            className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">URL Antidoping PDF</label>
          <input
            type="text"
            value={antidopingPdfUrl}
            onChange={(e) => setAntidopingPdfUrl(e.target.value)}
            className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white"
            placeholder="https://..."
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-white text-black px-6 py-3 font-semibold uppercase tracking-wider hover:bg-gray-200 transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="mr-2" size={20} />
          {saving ? 'Čuvanje...' : 'Sačuvaj Statut Kluba'}
        </button>
      </div>
    </div>
  );
}

