'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface Management {
  _id: string;
  name: string;
  position: string;
  image?: string;
  type: 'upravni_odbor' | 'menadzment';
  subcategory?: 'predsednik' | 'podpredsednik' | 'clanovi_upravnog_odbora' | 'menadzment' | 'direktor' | 'sportski_direktor' | 'direktor_marketinga' | 'pr_marketinga' | 'finansijski_direktor';
  order: number;
}

export default function AdminKlub() {
  const [management, setManagement] = useState<Management[]>([]);
  const [loading, setLoading] = useState(true);
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [editingManagement, setEditingManagement] = useState<Management | null>(null);
  const [managementForm, setManagementForm] = useState({
    name: '',
    image: '',
    type: 'upravni_odbor' as 'upravni_odbor' | 'menadzment',
    subcategory: '' as '' | 'predsednik' | 'podpredsednik' | 'clanovi_upravnog_odbora' | 'menadzment' | 'direktor' | 'sportski_direktor' | 'direktor_marketinga' | 'pr_marketinga' | 'finansijski_direktor',
  });
  const [uploadingManagementImage, setUploadingManagementImage] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const mgmt = await apiClient.getManagement();
      setManagement(mgmt);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Greška pri učitavanju podataka');
    } finally {
      setLoading(false);
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


  const handleSaveManagement = async () => {
    try {
      if (!managementForm.name.trim()) {
        toast.error('Ime i prezime je obavezno');
        return;
      }
      if (!managementForm.subcategory) {
        toast.error('Subkategorija je obavezna');
        return;
      }

      const dataToSave = {
        name: managementForm.name.trim(),
        image: managementForm.image,
        type: managementForm.type,
        subcategory: managementForm.subcategory,
      };

      if (editingManagement) {
        await apiClient.updateManagement(editingManagement._id, dataToSave);
        toast.success('Član je uspešno ažuriran');
      } else {
        await apiClient.createManagement(dataToSave);
        toast.success('Član je uspešno dodat');
      }
      setShowManagementModal(false);
      setEditingManagement(null);
      setManagementForm({ name: '', image: '', type: 'upravni_odbor', subcategory: '' });
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Greška pri čuvanju člana');
    }
  };

  const handleEditManagement = (item: Management) => {
    setEditingManagement(item);
    setManagementForm({
      name: item.name,
      image: item.image || '',
      type: item.type,
      subcategory: item.subcategory || '',
    });
    setShowManagementModal(true);
  };

  const handleDeleteManagement = async (id: string) => {
    if (!confirm('Da li ste sigurni da želite da obrišete ovog člana?')) return;
    try {
      await apiClient.deleteManagement(id);
      toast.success('Član je uspešno obrisan');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Greška pri brisanju');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-playfair uppercase tracking-wider">Klub</h1>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="text-gray-400">Učitavanje...</div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Management Sekcija */}
          <div className="bg-white/5 border border-white/10 p-4 sm:p-6 md:p-8 rounded-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold font-playfair uppercase tracking-wider">
                Upravni Odbor i Menadžment
              </h2>
              <button
                onClick={() => {
                  setEditingManagement(null);
                  setManagementForm({ name: '', image: '', type: 'upravni_odbor', subcategory: '' });
                  setShowManagementModal(true);
                }}
                className="bg-white text-black px-4 sm:px-6 py-2 sm:py-3 font-semibold uppercase tracking-wider hover:bg-gray-200 transition-all flex items-center text-sm sm:text-base w-full sm:w-auto justify-center"
              >
                <Plus className="mr-2" size={18} />
                Dodaj Člana
              </button>
            </div>

            {/* Upravni Odbor - Grouped by Subcategory */}
            <div className="mb-8">
              <h3 className="text-lg sm:text-xl font-bold font-playfair uppercase tracking-wider mb-4">Upravni Odbor</h3>
              {(['predsednik', 'podpredsednik', 'clanovi_upravnog_odbora', 'menadzment'] as const).map((subcat) => {
                const items = management.filter((item) => item.type === 'upravni_odbor' && item.subcategory === subcat);
                
                const subcatLabels: { [key: string]: string } = {
                  predsednik: 'Predsednik',
                  podpredsednik: 'Podpredsednik',
                  clanovi_upravnog_odbora: 'Članovi Upravnog Odbora',
                  menadzment: 'Menadžment',
                };
                
                return (
                  <div key={subcat} className="mb-6">
                    <h4 className="text-base font-bold mb-3 text-gray-300">{subcatLabels[subcat]}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {items.map((item) => (
                        <div
                          key={item._id}
                          className="bg-white/5 border border-white/10 p-4 sm:p-6 rounded-lg hover:bg-white/10 transition-all"
                        >
                          <div className="flex flex-col items-center text-center">
                            <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white/20 mb-4">
                              {item.image ? (
                                <Image src={item.image} alt={item.name} fill sizes="(max-width: 640px) 96px, 128px" className="object-cover" />
                              ) : (
                                <div className="w-full h-full bg-white/10 flex items-center justify-center">
                                  <span className="text-gray-500 text-xs">Slika</span>
                                </div>
                              )}
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold font-playfair mb-4">{item.name}</h3>
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
                );
              })}
            </div>

            {/* Menadžment - Grouped by Subcategory */}
            <div className="mb-8">
              <h3 className="text-lg sm:text-xl font-bold font-playfair uppercase tracking-wider mb-4">Menadžment</h3>
              {(['direktor', 'sportski_direktor', 'direktor_marketinga', 'pr_marketinga', 'finansijski_direktor'] as const).map((subcat) => {
                const items = management.filter((item) => item.type === 'menadzment' && item.subcategory === subcat);
                
                const subcatLabels: { [key: string]: string } = {
                  direktor: 'Direktor',
                  sportski_direktor: 'Sportski Direktor',
                  direktor_marketinga: 'Direktor Marketinga',
                  pr_marketinga: 'PR Marketinga',
                  finansijski_direktor: 'Finansijski Direktor',
                };
                
                return (
                  <div key={subcat} className="mb-6">
                    <h4 className="text-base font-bold mb-3 text-gray-300">{subcatLabels[subcat]}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {items.map((item) => (
                        <div
                          key={item._id}
                          className="bg-white/5 border border-white/10 p-4 sm:p-6 rounded-lg hover:bg-white/10 transition-all"
                        >
                          <div className="flex flex-col items-center text-center">
                            <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white/20 mb-4">
                              {item.image ? (
                                <Image src={item.image} alt={item.name} fill sizes="(max-width: 640px) 96px, 128px" className="object-cover" />
                              ) : (
                                <div className="w-full h-full bg-white/10 flex items-center justify-center">
                                  <span className="text-gray-500 text-xs">Slika</span>
                                </div>
                              )}
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold font-playfair mb-4">{item.name}</h3>
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
                );
              })}
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
                <label className="block text-sm font-medium mb-2">Ime i Prezime *</label>
                <input
                  type="text"
                  required
                  value={managementForm.name}
                  onChange={(e) => setManagementForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 px-3 sm:px-4 py-2 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:border-white"
                  placeholder="Unesite puno ime i prezime"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tip *</label>
                <select
                  value={managementForm.type}
                  onChange={(e) => setManagementForm((prev) => ({ ...prev, type: e.target.value as 'upravni_odbor' | 'menadzment', subcategory: '' }))}
                  className="w-full bg-white/5 border border-white/10 px-3 sm:px-4 py-2 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:border-white"
                >
                  <option value="upravni_odbor">Upravni Odbor</option>
                  <option value="menadzment">Menadžment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Subkategorija *</label>
                <select
                  value={managementForm.subcategory}
                  onChange={(e) => setManagementForm((prev) => ({ ...prev, subcategory: e.target.value as any }))}
                  className="w-full bg-white/5 border border-white/10 px-3 sm:px-4 py-2 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:border-white"
                >
                  <option value="">Izaberi subkategoriju</option>
                  {managementForm.type === 'upravni_odbor' && (
                    <>
                      <option value="predsednik">Predsednik</option>
                      <option value="podpredsednik">Podpredsednik</option>
                      <option value="clanovi_upravnog_odbora">Članovi Upravnog Odbora</option>
                      <option value="menadzment">Menadžment</option>
                    </>
                  )}
                  {managementForm.type === 'menadzment' && (
                    <>
                      <option value="direktor">Direktor</option>
                      <option value="sportski_direktor">Sportski Direktor</option>
                      <option value="direktor_marketinga">Direktor Marketinga</option>
                      <option value="pr_marketinga">PR Marketinga</option>
                      <option value="finansijski_direktor">Finansijski Direktor</option>
                    </>
                  )}
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
                    <Image src={managementForm.image} alt="Član" fill sizes="128px" className="object-cover" />
                  </div>
                )}
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
                    setManagementForm({ name: '', image: '', type: 'upravni_odbor', subcategory: '' });
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
