'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';
import { Save, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // O nama sekcija
  const [aboutTitle, setAboutTitle] = useState('KŽK PARTIZAN 1953');
  const [aboutText, setAboutText] = useState('');
  const [savingAbout, setSavingAbout] = useState(false);
  
  // Istorijat sekcija
  const [historyTitle, setHistoryTitle] = useState('KŽK Partizan 1953 – Tradicija, ponos i vrhunski rezultati');
  const [historyText, setHistoryText] = useState('');
  const [savingHistory, setSavingHistory] = useState(false);
  
  // Škola košarke sekcija
  const [basketballSchoolText, setBasketballSchoolText] = useState('');
  const [basketballSchoolContactName, setBasketballSchoolContactName] = useState('');
  const [basketballSchoolContactPhone, setBasketballSchoolContactPhone] = useState('');
  const [basketballSchoolContactEmail, setBasketballSchoolContactEmail] = useState('');
  const [savingBasketballSchool, setSavingBasketballSchool] = useState(false);

  // Partneri sekcija
  const [partneriImages, setPartneriImages] = useState<any[]>([]);
  const [loadingPartneri, setLoadingPartneri] = useState(false);
  const [partnerUrls, setPartnerUrls] = useState<{ [key: string]: string }>({});
  const [savingPartner, setSavingPartner] = useState<string | null>(null);

  useEffect(() => {
    loadAllSections();
  }, []);

  const loadAllSections = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadAboutSection(),
        loadHistorySection(),
        loadBasketballSchoolSection(),
        loadPartneriImages(),
      ]);
    } catch (error) {
      console.error('Error loading sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPartneriImages = async () => {
    try {
      setLoadingPartneri(true);
      const images = await apiClient.getImages('partneri');
      if (images && Array.isArray(images)) {
        const sortedImages = images.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        setPartneriImages(sortedImages);
        // Inicijalizuj URL-ove iz baze
        const urls: { [key: string]: string } = {};
        sortedImages.forEach((img: any) => {
          urls[img._id] = img.urlSajta || '';
        });
        setPartnerUrls(urls);
      } else {
        setPartneriImages([]);
      }
    } catch (error) {
      console.error('Error loading partneri images:', error);
      toast.error('Greška pri učitavanju partnera');
      setPartneriImages([]);
    } finally {
      setLoadingPartneri(false);
    }
  };

  const handleSavePartnerUrl = async (partnerId: string) => {
    try {
      setSavingPartner(partnerId);
      const url = partnerUrls[partnerId] || '';
      const trimmedUrl = url.trim();
      
      // Validacija URL-a ako je unet
      if (trimmedUrl !== '' && !trimmedUrl.match(/^https?:\/\/.+/)) {
        toast.error('URL mora počinjati sa http:// ili https://');
        return;
      }
      
      // Ažuriraj URL u bazi preko API-ja
      const token = localStorage.getItem('auth-token');
      if (!token) {
        throw new Error('Niste autentifikovani');
      }

      const formData = new FormData();
      // Uvek šalji urlSajta, čak i ako je prazan (postaviće se na null u API-ju)
      formData.append('urlSajta', trimmedUrl);
      
      console.log('Saving partner URL:', { partnerId, url: trimmedUrl });
      
      const response = await fetch(`/api/images/${partnerId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.error || 'Greška pri ažuriranju URL-a');
      }

      const updatedImage = await response.json();
      console.log('Updated image:', updatedImage);
      
      toast.success(trimmedUrl ? 'URL partnera je uspešno sačuvan' : 'URL partnera je uspešno obrisan');
      // Reload partneri da se osveže prikaz
      await loadPartneriImages();
    } catch (error: any) {
      console.error('Error saving partner URL:', error);
      toast.error(error.message || 'Greška pri čuvanju URL-a partnera');
    } finally {
      setSavingPartner(null);
    }
  };

  const loadAboutSection = async () => {
    try {
      const titleSetting = await apiClient.getSettings('about_title');
      if (titleSetting && titleSetting.value) {
        setAboutTitle(titleSetting.value);
      }

      const textSetting = await apiClient.getSettings('about_text');
      if (textSetting && textSetting.value) {
        setAboutText(textSetting.value);
      } else {
        setAboutText('KŽK Partizan 1953 je ženski košarkaški klub sa bogatom tradicijom i velikim uspehom u domaćim i međunarodnim takmičenjima. Osnovan 1953. godine, klub je postao simbol istrajnosti, timskog duha i posvećenosti sportu. Kroz decenije, KŽK Partizan je iznedrio mnoge vrhunske igračice koje su ostavile značajan trag u ženskoj košarci. Klub se ponosi svojim radom na razvoju mladih talenata i promociji ženskog sporta, pružajući inspiraciju i podršku svim generacijama sportistkinja. Sa jasnim ciljevima i jakom zajednicom, KŽK Partizan 1953 nastavlja da gradi uspešnu budućnost i širi ljubav prema košarci.');
      }
    } catch (error) {
      console.error('Error loading about section:', error);
    }
  };

  const loadHistorySection = async () => {
    try {
      const titleSetting = await apiClient.getSettings('history_title');
      if (titleSetting && titleSetting.value) {
        setHistoryTitle(titleSetting.value);
      }

      const textSetting = await apiClient.getSettings('history_text');
      if (textSetting && textSetting.value) {
        setHistoryText(textSetting.value);
      } else {
        setHistoryText(`Od 1953. godine, KŽK Partizan je jedan od najstarijih i najuspešnijih klubova u okviru Jugoslovenskog sportskog društva Partizan. Kroz decenije bogate istorije, naš klub je ostavio neizbrisiv trag na mapi ženske košarke – u Srbiji, regionu, Evropi i svetu.

Zlatnim slovima u istoriju kluba upisala se generacija iz sezone 1984/85, koja je osvojila duplu krunu predvođena legendama poput Jelice Komnenović, Bibe Majstorović i Olje Krivokapić.

Posebno mesto zauzima i slavna generacija iz sezona 2009–2012, pod vođstvom Marine Maljković, u kojoj su nastupale Milica Dabović, Dajana Butulija, Saša Čađo, Tamara Radočaj, Nevena Jovanović i brojne druge reprezentativke. Ova ekipa bila je srce i oslonac ženske košarkaške reprezentacije Srbije, koja je u tom periodu osvojila dve titule prvaka Evrope i bronzanu medalju na Olimpijskim igrama u Riju.

KŽK Partizan 1953 s ponosom ističe da od osnivanja do danas nije imao nijedan dinar poreskog duga prema državi. Za primer poslovne odgovornosti, klub je 3. novembra 2022. godine dobio sertifikat pouzdane organizacije u Srbiji, na osnovu izveštaja Agencije za privredne registre (APR), sa serijskim brojem sertifikata: CWBO-22-42237 (CompanyWall Business).`);
      }
    } catch (error) {
      console.error('Error loading history section:', error);
    }
  };

  const loadBasketballSchoolSection = async () => {
    try {
      const textSetting = await apiClient.getSettings('basketball_school_text');
      if (textSetting && textSetting.value) {
        setBasketballSchoolText(textSetting.value);
      }

      const nameSetting = await apiClient.getSettings('basketball_school_contact_name');
      if (nameSetting && nameSetting.value) {
        setBasketballSchoolContactName(nameSetting.value);
      }

      const phoneSetting = await apiClient.getSettings('basketball_school_contact_phone');
      if (phoneSetting && phoneSetting.value) {
        setBasketballSchoolContactPhone(phoneSetting.value);
      }

      const emailSetting = await apiClient.getSettings('basketball_school_contact_email');
      if (emailSetting && emailSetting.value) {
        setBasketballSchoolContactEmail(emailSetting.value);
      }
    } catch (error) {
      console.error('Error loading basketball school section:', error);
    }
  };

  const handleSaveAbout = async () => {
    try {
      setSavingAbout(true);
      await apiClient.updateSetting({
        key: 'about_title',
        value: aboutTitle,
        type: 'text',
        description: 'Naslov sekcije "O nama" na početnoj stranici',
      });
      await apiClient.updateSetting({
        key: 'about_text',
        value: aboutText,
        type: 'text',
        description: 'Tekst sekcije "O nama" na početnoj stranici',
      });
      toast.success('Sekcija "O nama" je uspešno sačuvana');
    } catch (error) {
      toast.error('Greška pri čuvanju sekcije "O nama"');
    } finally {
      setSavingAbout(false);
    }
  };

  const handleSaveHistory = async () => {
    try {
      setSavingHistory(true);
      await apiClient.updateSetting({
        key: 'history_title',
        value: historyTitle,
        type: 'text',
        description: 'Naslov stranice "Istorijat kluba"',
      });
      await apiClient.updateSetting({
        key: 'history_text',
        value: historyText,
        type: 'text',
        description: 'Tekst stranice "Istorijat kluba"',
      });
      toast.success('Sekcija "Istorijat kluba" je uspešno sačuvana');
    } catch (error) {
      toast.error('Greška pri čuvanju sekcije "Istorijat kluba"');
    } finally {
      setSavingHistory(false);
    }
  };

  const handleSaveBasketballSchool = async () => {
    try {
      setSavingBasketballSchool(true);
      await apiClient.updateSetting({
        key: 'basketball_school_text',
        value: basketballSchoolText,
        type: 'text',
        description: 'Tekst sekcije Škola košarke',
      });
      await apiClient.updateSetting({
        key: 'basketball_school_contact_name',
        value: basketballSchoolContactName,
        type: 'text',
        description: 'Ime kontakta za školu košarke',
      });
      await apiClient.updateSetting({
        key: 'basketball_school_contact_phone',
        value: basketballSchoolContactPhone,
        type: 'text',
        description: 'Telefon za školu košarke',
      });
      await apiClient.updateSetting({
        key: 'basketball_school_contact_email',
        value: basketballSchoolContactEmail,
        type: 'text',
        description: 'Email za školu košarke',
      });
      toast.success('Sekcija "Škola košarke" je uspešno sačuvana');
    } catch (error) {
      toast.error('Greška pri čuvanju sekcije "Škola košarke"');
    } finally {
      setSavingBasketballSchool(false);
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
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-playfair uppercase tracking-wider">
          Podešavanja
        </h1>
        <p className="text-gray-400 mt-2">Upravljajte sadržajem sajta i podešavanjima</p>
      </div>

      <div className="space-y-8">
        {/* O nama Sekcija */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-lg"
        >
          <h2 className="text-xl sm:text-2xl font-bold font-playfair uppercase tracking-wider mb-6">
            O nama Sekcija
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Naslov</label>
              <input
                type="text"
                value={aboutTitle}
                onChange={(e) => setAboutTitle(e.target.value)}
                className="w-full bg-black border border-white/20 px-4 py-3 text-white focus:outline-none focus:border-white"
                placeholder="KŽK PARTIZAN 1953"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tekst</label>
              <textarea
                value={aboutText}
                onChange={(e) => setAboutText(e.target.value)}
                rows={8}
                className="w-full bg-black border border-white/20 px-4 py-3 text-white focus:outline-none focus:border-white resize-none"
                placeholder="Tekst sekcije 'O nama'..."
              />
            </div>
            <button
              onClick={handleSaveAbout}
              disabled={savingAbout}
              className="bg-white text-black px-6 py-3 font-semibold uppercase tracking-wider hover:bg-gray-200 transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="mr-2" size={20} />
              {savingAbout ? 'Čuvanje...' : 'Sačuvaj Sekciju "O nama"'}
            </button>
          </div>
        </motion.div>

        {/* Istorijat Kluba Sekcija */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-lg"
        >
          <h2 className="text-xl sm:text-2xl font-bold font-playfair uppercase tracking-wider mb-6">
            Istorijat Kluba Sekcija
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Naslov</label>
              <input
                type="text"
                value={historyTitle}
                onChange={(e) => setHistoryTitle(e.target.value)}
                className="w-full bg-black border border-white/20 px-4 py-3 text-white focus:outline-none focus:border-white"
                placeholder="KŽK Partizan 1953 – Tradicija, ponos i vrhunski rezultati"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tekst</label>
              <textarea
                value={historyText}
                onChange={(e) => setHistoryText(e.target.value)}
                rows={12}
                className="w-full bg-black border border-white/20 px-4 py-3 text-white focus:outline-none focus:border-white resize-none text-sm"
                placeholder="Tekst stranice 'Istorijat kluba'..."
              />
            </div>
            <button
              onClick={handleSaveHistory}
              disabled={savingHistory}
              className="bg-white text-black px-6 py-3 font-semibold uppercase tracking-wider hover:bg-gray-200 transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="mr-2" size={20} />
              {savingHistory ? 'Čuvanje...' : 'Sačuvaj Sekciju "Istorijat kluba"'}
            </button>
          </div>
        </motion.div>

        {/* Škola Košarke Sekcija */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-lg"
        >
          <h2 className="text-xl sm:text-2xl font-bold font-playfair uppercase tracking-wider mb-6">
            Škola Košarke Sekcija
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Tekst</label>
              <textarea
                value={basketballSchoolText}
                onChange={(e) => setBasketballSchoolText(e.target.value)}
                rows={6}
                className="w-full bg-black border border-white/20 px-4 py-3 text-white focus:outline-none focus:border-white resize-none"
                placeholder="Tekst o školi košarke..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Ime Kontakta</label>
                <input
                  type="text"
                  value={basketballSchoolContactName}
                  onChange={(e) => setBasketballSchoolContactName(e.target.value)}
                  className="w-full bg-black border border-white/20 px-4 py-3 text-white focus:outline-none focus:border-white"
                  placeholder="Sofija Čukić"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Telefon</label>
                <input
                  type="text"
                  value={basketballSchoolContactPhone}
                  onChange={(e) => setBasketballSchoolContactPhone(e.target.value)}
                  className="w-full bg-black border border-white/20 px-4 py-3 text-white focus:outline-none focus:border-white"
                  placeholder="+381 66 8391 992"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={basketballSchoolContactEmail}
                  onChange={(e) => setBasketballSchoolContactEmail(e.target.value)}
                  className="w-full bg-black border border-white/20 px-4 py-3 text-white focus:outline-none focus:border-white"
                  placeholder="sofija.cukic@kzkpartizan1953.rs"
                />
              </div>
            </div>
            <button
              onClick={handleSaveBasketballSchool}
              disabled={savingBasketballSchool}
              className="bg-white text-black px-6 py-3 font-semibold uppercase tracking-wider hover:bg-gray-200 transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="mr-2" size={20} />
              {savingBasketballSchool ? 'Čuvanje...' : 'Sačuvaj Sekciju "Škola košarke"'}
            </button>
          </div>
        </motion.div>

        {/* Partneri Sekcija */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-lg"
        >
          <h2 className="text-xl sm:text-2xl font-bold font-playfair uppercase tracking-wider mb-4">
            Partneri - URL Sajtovi
          </h2>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
            <p className="text-yellow-400 text-sm font-medium mb-2">
              ⚠️ VAŽNO: URL Sajt za Partnere
            </p>
            <p className="text-gray-300 text-xs">
              Unesite URL sajta partnera (npr. https://example.com) da bi partner bio klikabilan na početnoj stranici. 
              Ako ostavite prazno, partner neće biti klikabilan. URL mora počinjati sa <span className="font-semibold">http://</span> ili <span className="font-semibold">https://</span>
            </p>
          </div>
          
          {loadingPartneri ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-sm">Učitavanje partnera...</div>
            </div>
          ) : partneriImages.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-sm mb-4">Nema partnera. Dodajte partnere preko <span className="text-white font-semibold">Admin/Slike</span> u folder <span className="text-white font-semibold">'partneri'</span>.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {partneriImages.map((partner) => {
                const currentUrl = partnerUrls[partner._id] || '';
                const hasUrl = currentUrl.trim() !== '';
                const originalUrl = partner.urlSajta || '';
                const hasChanged = currentUrl.trim() !== originalUrl.trim();
                
                return (
                  <div
                    key={partner._id}
                    className={`bg-white/5 border ${hasUrl ? 'border-yellow-500/30' : 'border-white/10'} rounded-lg p-4 hover:bg-white/10 transition-all`}
                  >
                    <div className="relative aspect-video mb-3 bg-white/10 rounded overflow-hidden">
                      <Image
                        src={partner.url}
                        alt={`Partner ${partner._id}`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-contain"
                      />
                    </div>
                    <div className="mb-3">
                      {partner.width && partner.height && (
                        <p className="text-xs text-gray-400 mb-2">
                          {partner.width} x {partner.height}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <LinkIcon size={14} className={hasUrl ? 'text-yellow-400' : 'text-gray-500'} />
                        <label className={`text-xs font-medium ${hasUrl ? 'text-yellow-400' : 'text-gray-300'}`}>
                          URL Sajta {hasUrl ? '(Klikabilan)' : '(Nije klikabilan)'}:
                        </label>
                      </div>
                      <input
                        type="url"
                        value={currentUrl}
                        onChange={(e) => {
                          setPartnerUrls({
                            ...partnerUrls,
                            [partner._id]: e.target.value,
                          });
                        }}
                        className={`w-full bg-black border ${hasUrl ? 'border-yellow-500/50 focus:border-yellow-500' : 'border-white/20 focus:border-blue-500'} px-3 py-2 text-white text-xs focus:outline-none`}
                        placeholder="https://example.com"
                      />
                      {hasUrl && (
                        <p className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
                          ✓ Partner će biti klikabilan
                        </p>
                      )}
                      {!hasUrl && (
                        <p className="text-xs text-gray-500 mt-1 italic">
                          ⚠️ Partner nije klikabilan
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleSavePartnerUrl(partner._id)}
                      disabled={savingPartner === partner._id || !hasChanged}
                      className={`w-full ${hasChanged ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-gray-600 cursor-not-allowed'} text-white px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <Save className="mr-2" size={14} />
                      {savingPartner === partner._id ? 'Čuvanje...' : hasChanged ? 'Sačuvaj URL' : 'Nema izmena'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
