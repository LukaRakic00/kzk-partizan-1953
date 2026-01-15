'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';
import { Users, Newspaper, Image as ImageIcon, Sparkles, RefreshCw, CheckCircle2, AlertCircle, Upload, ChevronDown, ChevronUp, Plus, Trash2, ArrowUp, ArrowDown, Edit, X, Download, Star, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    players: 0,
    news: 0,
    galleries: 0,
    history: 0,
  });
  const [loading, setLoading] = useState(true);
  const [wabaUpdating, setWabaUpdating] = useState(false);
  const [wabaLastUpdate, setWabaLastUpdate] = useState<string | null>(null);
  const [wabaStatus, setWabaStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [heroImageId, setHeroImageId] = useState<string | null>(null);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [heroSectionOpen, setHeroSectionOpen] = useState(false);
  const [wabaSectionOpen, setWabaSectionOpen] = useState(false);
  const [baneriImages, setBaneriImages] = useState<any[]>([]);
  const [loadingBaneri, setLoadingBaneri] = useState(false);
  const [activeHeroImageId, setActiveHeroImageId] = useState<string | null>(null);
  const [mobileHeroImageId, setMobileHeroImageId] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
    loadWabaStatus();
    loadHeroImage();
    loadBaneriImages();
    loadHeroSettings();
  }, []);

  useEffect(() => {
    if (heroSectionOpen) {
      loadBaneriImages();
      loadHeroSettings();
    }
  }, [heroSectionOpen]);

  const loadHeroSettings = async () => {
    try {
      const activeHero = await apiClient.getSettings('hero_image_active');
      const mobileHero = await apiClient.getSettings('hero_image_mobile');
      
      if (activeHero && activeHero.value) {
        setActiveHeroImageId(activeHero.value);
      }
      if (mobileHero && mobileHero.value) {
        setMobileHeroImageId(mobileHero.value);
      }
    } catch (error) {
      console.error('Error loading hero settings:', error);
    }
  };

  const loadStats = async () => {
    try {
      const [players, news, galleries] = await Promise.all([
        apiClient.getPlayers(),
        apiClient.getNews(),
        apiClient.getGalleries(),
      ]);

      setStats({
        players: players.length,
        news: news.length,
        galleries: galleries.length,
        history: 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWabaStatus = async () => {
    try {
      const response = await fetch('/api/waba/standings');
      if (response.ok) {
        const data = await response.json();
        if (data.lastUpdated) {
          setWabaLastUpdate(data.lastUpdated);
        }
      }
    } catch (error) {
      console.error('Error loading WABA status:', error);
    }
  };

  const loadHeroImage = async () => {
    try {
      const images = await apiClient.getImages('baneri');
      const activeHeroSetting = await apiClient.getSettings('hero_image_active');
      
      if (activeHeroSetting && activeHeroSetting.value && images) {
        const activeImage = images.find((img: any) => img._id === activeHeroSetting.value);
        if (activeImage) {
          setHeroImage(activeImage.url);
          setHeroImageId(activeImage._id);
          return;
        }
      }
      
      // Fallback na prvu sliku ako nema aktivnog hero banera
      if (images && images.length > 0) {
        setHeroImage(images[0].url);
        setHeroImageId(images[0]._id);
      }
    } catch (error) {
      console.error('Error loading hero image:', error);
    }
  };

  const loadBaneriImages = async () => {
    try {
      setLoadingBaneri(true);
      const images = await apiClient.getImages('baneri');
      if (images && Array.isArray(images)) {
        setBaneriImages(images);
      } else {
        setBaneriImages([]);
      }
    } catch (error) {
      console.error('Error loading baneri images:', error);
      toast.error('Greška pri učitavanju baneri slika');
      setBaneriImages([]);
    } finally {
      setLoadingBaneri(false);
    }
  };

  const handleDownload = async (image: any) => {
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
      toast.success('Slika je preuzeta');
    } catch (error: any) {
      toast.error(`Greška pri preuzimanju: ${error.message || 'Nepoznata greška'}`);
    }
  };

  const handleSetActiveHero = async (imageId: string) => {
    try {
      await apiClient.updateSetting({
        key: 'hero_image_active',
        value: imageId,
        type: 'text',
        description: 'ID aktivnog hero banera'
      });
      setActiveHeroImageId(imageId);
      toast.success('Aktivni hero baner je postavljen');
      loadHeroImage();
    } catch (error: any) {
      toast.error(`Greška: ${error.message || 'Nepoznata greška'}`);
    }
  };

  const handleSetMobileHero = async (imageId: string) => {
    try {
      const image = baneriImages.find(img => img._id === imageId);
      if (!image) {
        toast.error('Slika nije pronađena');
        return;
      }
      
      await apiClient.updateSetting({
        key: 'hero_image_mobile',
        value: image.url,
        type: 'image',
        description: 'URL mobilnog hero banera'
      });
      setMobileHeroImageId(imageId);
      toast.success('Mobilni hero baner je postavljen');
    } catch (error: any) {
      toast.error(`Greška: ${error.message || 'Nepoznata greška'}`);
    }
  };

  const handleBanerDelete = async (id: string) => {
    if (!confirm('Da li ste sigurni da želite da obrišete ovaj baner?')) return;

    try {
      await apiClient.deleteImage(id);
      toast.success('Baner je uspešno obrisan');
      loadBaneriImages();
      loadHeroImage();
      
      // Ako je obrisan aktivni ili mobilni baner, resetuj settings
      if (activeHeroImageId === id) {
        setActiveHeroImageId(null);
        await apiClient.updateSetting({
          key: 'hero_image_active',
          value: '',
          type: 'text',
          description: 'ID aktivnog hero banera'
        });
      }
      if (mobileHeroImageId === id) {
        setMobileHeroImageId(null);
        await apiClient.updateSetting({
          key: 'hero_image_mobile',
          value: '',
          type: 'image',
          description: 'URL mobilnog hero banera'
        });
      }
    } catch (error: any) {
      toast.error(error.message || 'Greška pri brisanju banera');
    }
  };

  const handleWabaUpdate = async () => {
    try {
      setWabaUpdating(true);
      setWabaStatus('idle');
      
      const response = await fetch('/api/waba/init', {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Greška pri ažuriranju WABA lige');
      }

      const data = await response.json();
      
      setWabaStatus('success');
      setWabaLastUpdate(new Date().toISOString());
      toast.success(`WABA liga uspešno ažurirana! Učitano ${data.standings?.length || 0} timova.`);
      
      setTimeout(() => {
        setWabaStatus('idle');
      }, 3000);
    } catch (error: any) {
      console.error('Error updating WABA:', error);
      setWabaStatus('error');
      toast.error(error.message || 'Greška pri ažuriranju WABA lige');
      
      setTimeout(() => {
        setWabaStatus('idle');
      }, 5000);
    } finally {
      setWabaUpdating(false);
    }
  };

  const statCards = [
    { 
      label: 'Igrači', 
      value: stats.players, 
      icon: Users, 
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      gradient: 'bg-gradient-to-br from-blue-500/20 to-blue-600/10'
    },
    { 
      label: 'Vesti', 
      value: stats.news, 
      icon: Newspaper, 
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      gradient: 'bg-gradient-to-br from-green-500/20 to-green-600/10'
    },
    { 
      label: 'Galerije', 
      value: stats.galleries, 
      icon: ImageIcon, 
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      gradient: 'bg-gradient-to-br from-purple-500/20 to-purple-600/10'
    },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 md:gap-4"
      >
        <div className="w-1 h-8 md:h-12 bg-gradient-to-b from-white to-transparent"></div>
        <div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-playfair mb-1 md:mb-2 tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-gray-400 font-montserrat text-xs md:text-sm uppercase tracking-wider">
            Dobrodošli u kontrolnu tablu
          </p>
        </div>
      </motion.div>

      {loading ? (
        <div className="text-center py-12 md:py-20">
          <div className="inline-block animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-t-2 border-b-2 border-white mb-4"></div>
          <div className="text-gray-400 font-montserrat text-sm md:text-base">Učitavanje podataka...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
                className={`${stat.bgColor} border-2 ${stat.borderColor} rounded-xl p-4 md:p-5 hover:scale-[1.02] hover:shadow-xl hover:shadow-white/5 transition-all duration-300 cursor-pointer group relative overflow-hidden backdrop-blur-sm`}
              >
                {/* Animated gradient background */}
                <div className={`absolute inset-0 ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ring-2 ring-white/10`}>
                      <Icon size={24} className="md:w-7 md:h-7 text-white drop-shadow-lg" />
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Sparkles className="text-white animate-pulse" size={18} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl md:text-4xl lg:text-5xl font-bold font-playfair text-white group-hover:scale-105 transition-transform duration-300 inline-block">
                      {stat.value}
                    </div>
                    <div className="text-gray-300 text-xs md:text-sm font-montserrat uppercase tracking-wider font-semibold">
                      {stat.label}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Hero Banner Sekcija */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-br from-white/5 to-white/[0.02] border-2 border-white/10 rounded-xl backdrop-blur-sm shadow-xl hover:shadow-2xl hover:shadow-white/5 transition-all duration-300 overflow-hidden"
      >
        <button
          onClick={() => setHeroSectionOpen(!heroSectionOpen)}
          className="w-full p-4 md:p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-white to-transparent"></div>
            <h2 className="text-lg sm:text-xl font-bold font-playfair uppercase tracking-wider">
              Hero Banner
            </h2>
          </div>
          {heroSectionOpen ? (
            <ChevronUp className="text-white" size={20} />
          ) : (
            <ChevronDown className="text-white" size={20} />
          )}
        </button>

        {heroSectionOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="px-4 md:px-6 pb-6"
          >
            <p className="text-gray-400 text-sm mb-4 ml-4">
              Upravljajte hero slikama na početnoj stranici. Izaberite aktivni hero baner za desktop verziju i mobilni baner za mobilne uređaje iz postojećih slika u folderu 'baneri'.
            </p>

            {loadingBaneri ? (
              <div className="text-center py-8">
                <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                <div className="text-gray-400 text-sm">Učitavanje baneri slika...</div>
              </div>
            ) : baneriImages.length === 0 ? (
              <div className="text-center py-8 ml-4">
                <div className="text-gray-400 mb-4">Nema baneri slika. Dodajte slike preko Admin/Slike u folder 'baneri'.</div>
                <div className="px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg inline-block">
                  <p className="text-xs text-blue-400 font-medium">
                    💡 Savet: Idite na <strong>Admin/Slike</strong> i filtrirajte po folderu 'baneri' da dodate nove slike.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-4">
                {baneriImages.map((baner) => (
                  <div
                    key={baner._id}
                    className={`bg-white/5 border rounded-lg p-3 hover:bg-white/10 transition-all ${
                      activeHeroImageId === baner._id ? 'border-green-500/50 bg-green-500/5' : 
                      mobileHeroImageId === baner._id ? 'border-blue-500/50 bg-blue-500/5' : 
                      'border-white/10'
                    }`}
                  >
                    <div className="relative aspect-video mb-3 bg-white/10 rounded overflow-hidden">
                      <Image
                        src={baner.url}
                        alt={`Baner ${baner._id}`}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {activeHeroImageId === baner._id && (
                          <div className="bg-green-500 text-white text-xs px-2 py-1 rounded font-semibold flex items-center gap-1">
                            <Star size={12} />
                            AKTIVAN HERO
                          </div>
                        )}
                        {mobileHeroImageId === baner._id && (
                          <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded font-semibold flex items-center gap-1">
                            <Smartphone size={12} />
                            MOBILNI
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mb-3">
                      {baner.width && baner.height && (
                        <p className="text-xs text-gray-400">
                          {baner.width} x {baner.height}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSetActiveHero(baner._id)}
                          className={`flex-1 px-2 py-1.5 transition-all flex items-center justify-center text-xs ${
                            activeHeroImageId === baner._id
                              ? 'bg-green-500/30 text-green-400 border border-green-500/50'
                              : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          }`}
                          title="Postavi kao aktivni hero baner"
                        >
                          <Star size={14} className="mr-1" />
                          {activeHeroImageId === baner._id ? 'Aktivan' : 'Aktiviraj'}
                        </button>
                        <button
                          onClick={() => handleSetMobileHero(baner._id)}
                          className={`flex-1 px-2 py-1.5 transition-all flex items-center justify-center text-xs ${
                            mobileHeroImageId === baner._id
                              ? 'bg-blue-500/30 text-blue-400 border border-blue-500/50'
                              : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                          }`}
                          title="Postavi kao mobilni hero baner"
                        >
                          <Smartphone size={14} className="mr-1" />
                          {mobileHeroImageId === baner._id ? 'Mobilni' : 'Mobilni'}
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownload(baner)}
                          className="flex-1 bg-green-500/20 text-green-400 px-2 py-1.5 hover:bg-green-500/30 transition-all flex items-center justify-center text-xs"
                          title="Preuzmi sliku"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          onClick={() => handleBanerDelete(baner._id)}
                          className="flex-1 bg-red-500/20 text-red-400 px-2 py-1.5 hover:bg-red-500/30 transition-all flex items-center justify-center text-xs"
                          title="Obriši"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

      </motion.div>

      {/* WABA Liga Ažuriranje Sekcija */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-br from-white/5 to-white/[0.02] border-2 border-white/10 rounded-xl backdrop-blur-sm shadow-xl hover:shadow-2xl hover:shadow-white/5 transition-all duration-300 overflow-hidden"
      >
        <button
          onClick={() => setWabaSectionOpen(!wabaSectionOpen)}
          className="w-full p-4 md:p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-white to-transparent"></div>
            <div className="text-left">
              <h2 className="text-lg sm:text-xl font-bold font-playfair uppercase tracking-wider">
                WABA Liga Ažuriranje
              </h2>
              {wabaLastUpdate && !wabaSectionOpen && (
                <p className="text-gray-400 text-xs mt-1">
                  Poslednje: {new Date(wabaLastUpdate).toLocaleString('sr-RS', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>
          {wabaSectionOpen ? (
            <ChevronUp className="text-white" size={20} />
          ) : (
            <ChevronDown className="text-white" size={20} />
          )}
        </button>

        {wabaSectionOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="px-4 md:px-6 pb-6"
          >
            <p className="text-gray-400 text-sm mb-4 ml-4">
              Ažuriraj podatke WABA lige iz baze podataka. Scraping može potrajati 10-30 sekundi.
            </p>
            {wabaLastUpdate && (
              <div className="ml-4 mb-4 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg inline-block">
                <p className="text-gray-400 text-xs font-medium">
                  📅 Poslednje ažuriranje: <span className="text-white">{new Date(wabaLastUpdate).toLocaleString('sr-RS')}</span>
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <button
                onClick={handleWabaUpdate}
                disabled={wabaUpdating}
                className={`px-5 py-2.5 font-semibold uppercase tracking-wider transition-all flex items-center gap-2 rounded-lg shadow-lg text-sm ${
                  wabaStatus === 'success'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                    : wabaStatus === 'error'
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
                    : 'bg-gradient-to-r from-white to-gray-100 text-black hover:from-gray-100 hover:to-white hover:scale-105'
                } disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl`}
              >
                {wabaUpdating ? (
                  <>
                    <RefreshCw className="animate-spin" size={18} />
                    <span>Ažuriranje...</span>
                  </>
                ) : wabaStatus === 'success' ? (
                  <>
                    <CheckCircle2 size={18} />
                    <span>Uspešno Ažurirano</span>
                  </>
                ) : wabaStatus === 'error' ? (
                  <>
                    <AlertCircle size={18} />
                    <span>Greška</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={18} />
                    <span>Ažuriraj WABA Ligu</span>
                  </>
                )}
              </button>
              
              {wabaUpdating && (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-gray-300 text-sm font-medium">
                    Molimo sačekajte, scraping je u toku...
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 md:mt-12 p-6 md:p-8 bg-gradient-to-br from-white/5 to-white/[0.02] border-2 border-white/10 rounded-2xl backdrop-blur-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="text-white" size={24} />
          <h2 className="text-lg md:text-xl font-playfair font-bold uppercase tracking-wider">Brzi pregled</h2>
        </div>
        <p className="text-gray-300 font-montserrat text-sm md:text-base leading-relaxed ml-8">
          Koristite meni sa leve strane za navigaciju kroz različite sekcije admin panela. 
          Možete upravljati igračima, vestima, galerijama i još mnogo toga.
        </p>
      </motion.div>
    </div>
  );
}

