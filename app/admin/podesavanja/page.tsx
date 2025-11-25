'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';
import { Save, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface Setting {
  _id?: string;
  key: string;
  value: string;
  type: 'text' | 'image' | 'json';
  description?: string;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [wabaUpdating, setWabaUpdating] = useState(false);
  const [wabaLastUpdate, setWabaLastUpdate] = useState<string | null>(null);
  const [wabaStatus, setWabaStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [aboutTitle, setAboutTitle] = useState('KŽK PARTIZAN 1953');
  const [aboutText, setAboutText] = useState('');
  const [savingAbout, setSavingAbout] = useState(false);
  const [historyTitle, setHistoryTitle] = useState('KŽK Partizan 1953 – Tradicija, ponos i vrhunski rezultati');
  const [historyText, setHistoryText] = useState('');
  const [savingHistory, setSavingHistory] = useState(false);
  const [presidentMessage, setPresidentMessage] = useState('');
  const [presidentName, setPresidentName] = useState('Stevica Kujundžić');
  const [presidentTitle, setPresidentTitle] = useState('Predsednik kluba');
  const [presidentImage, setPresidentImage] = useState('');
  const [savingPresident, setSavingPresident] = useState(false);
  const [uploadingPresidentImage, setUploadingPresidentImage] = useState(false);
  const [sectionTexts, setSectionTexts] = useState<any>({});

  useEffect(() => {
    loadSettings();
    loadWabaStatus();
    loadAboutSection();
    loadHistorySection();
    loadPresidentSection();
  }, []);

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
        // Default tekst
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
        // Default tekst
        setHistoryText(`Od 1953. godine, KŽK Partizan je jedan od najstarijih i najuspešnijih klubova u okviru Jugoslovenskog sportskog društva Partizan. Kroz decenije bogate istorije, naš klub je ostavio neizbrisiv trag na mapi ženske košarke – u Srbiji, regionu, Evropi i svetu.

Zlatnim slovima u istoriju kluba upisala se generacija iz sezone 1984/85, koja je osvojila duplu krunu predvođena legendama poput Jelice Komnenović, Bibe Majstorović i Olje Krivokapić.

Posebno mesto zauzima i slavna generacija iz sezona 2009–2012, pod vođstvom Marine Maljković, u kojoj su nastupale Milica Dabović, Dajana Butulija, Saša Čađo, Tamara Radočaj, Nevena Jovanović i brojne druge reprezentativke. Ova ekipa bila je srce i oslonac ženske košarkaške reprezentacije Srbije, koja je u tom periodu osvojila dve titule prvaka Evrope i bronzanu medalju na Olimpijskim igrama u Riju.

KŽK Partizan 1953 s ponosom ističe da od osnivanja do danas nije imao nijedan dinar poreskog duga prema državi. Za primer poslovne odgovornosti, klub je 3. novembra 2022. godine dobio sertifikat pouzdane organizacije u Srbiji, na osnovu izveštaja Agencije za privredne registre (APR), sa serijskim brojem sertifikata: CWBO-22-42237 (CompanyWall Business).`);
      }
    } catch (error) {
      console.error('Error loading history section:', error);
    }
  };

  const loadPresidentSection = async () => {
    try {
      const messageSetting = await apiClient.getSettings('president_message');
      if (messageSetting && messageSetting.value) {
        setPresidentMessage(messageSetting.value);
      } else {
        setPresidentMessage('Kao novi predsednik KŽK Partizan, sa velikim entuzijazmom preuzimam odgovornost i viziju razvoja našeg kluba. Moj glavni cilj je da otvorimo vrata što većem broju mladih – da im pružimo podršku, motivaciju i priliku da rastu, ne samo kao sportisti, već i kao ljudi. Verujem da upravo kroz zajedništvo, posvećenost i strast možemo ispisati nove stranice uspeha i vratiti Partizan tamo gde pripada – u sam vrh ženskog sporta.');
      }

      const nameSetting = await apiClient.getSettings('president_name');
      if (nameSetting && nameSetting.value) {
        setPresidentName(nameSetting.value);
      }

      const titleSetting = await apiClient.getSettings('president_title');
      if (titleSetting && titleSetting.value) {
        setPresidentTitle(titleSetting.value);
      }

      const imageSetting = await apiClient.getSettings('president_image');
      if (imageSetting && imageSetting.value) {
        setPresidentImage(imageSetting.value);
      }
    } catch (error) {
      console.error('Error loading president section:', error);
    }
  };

  const handlePresidentImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPresidentImage(true);
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
      setPresidentImage(data.url);
      toast.success('Slika predsednika je uspešno upload-ovana');
    } catch (error) {
      toast.error('Greška pri upload-u slike');
    } finally {
      setUploadingPresidentImage(false);
    }
  };

  const handleSavePresident = async () => {
    try {
      setSavingPresident(true);
      await apiClient.updateSetting({
        key: 'president_message',
        value: presidentMessage,
        type: 'text',
        description: 'Poruka predsednika kluba',
      });
      await apiClient.updateSetting({
        key: 'president_name',
        value: presidentName,
        type: 'text',
        description: 'Ime predsednika kluba',
      });
      await apiClient.updateSetting({
        key: 'president_title',
        value: presidentTitle,
        type: 'text',
        description: 'Titula predsednika kluba',
      });
      await apiClient.updateSetting({
        key: 'president_image',
        value: presidentImage,
        type: 'image',
        description: 'Slika predsednika kluba',
      });
      toast.success('Sekcija "Predsednik kluba" je uspešno sačuvana');
    } catch (error) {
      toast.error('Greška pri čuvanju sekcije "Predsednik kluba"');
    } finally {
      setSavingPresident(false);
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
      
      // Reset status nakon 3 sekunde
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

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getSettings();
      if (Array.isArray(data)) {
        setSettings(data);
        // Učitaj section texts
        const textsObj: any = {};
        data.forEach((setting: any) => {
          if (setting.key.startsWith('section_') || setting.key.startsWith('president_') || setting.key.startsWith('basketball_school_')) {
            textsObj[setting.key] = setting.value;
          }
        });
        setSectionTexts(textsObj);
      } else {
        setSettings([]);
      }
    } catch (error) {
      toast.error('Greška pri učitavanju podesavanja');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (setting: Setting) => {
    try {
      setSaving(true);
      await apiClient.updateSetting({
        key: setting.key,
        value: setting.value,
        type: setting.type,
        description: setting.description,
      });
      toast.success('Podešavanje je sačuvano');
      loadSettings();
    } catch (error) {
      toast.error('Greška pri čuvanju podešavanja');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value } : s))
    );
  };

  const addNewSetting = () => {
    setSettings([
      ...settings,
      {
        key: '',
        value: '',
        type: 'text',
        description: '',
      },
    ]);
  };

  const predefinedSettings = [
    { key: 'hero_text', description: 'Hero sekcija tekst', type: 'text' as const },
    { key: 'hero_image_mobile', description: 'Hero slika za mobilne uređaje', type: 'image' as const },
    { key: 'logo_url', description: 'Logo URL', type: 'image' as const },
    { key: 'section_trophies', description: 'Trofeji sekcija tekst', type: 'text' as const },
    { key: 'section_team', description: 'Tim sekcija tekst', type: 'text' as const },
    { key: 'section_matches', description: 'Mečevi sekcija tekst', type: 'text' as const },
    { key: 'section_news', description: 'Novosti sekcija tekst', type: 'text' as const },
    { key: 'section_gallery_title', description: 'Galerija naslov', type: 'text' as const },
  ];

  const ensurePredefinedSettings = () => {
    predefinedSettings.forEach((predefined) => {
      const exists = settings.find((s) => s.key === predefined.key);
      if (!exists) {
        setSettings([
          ...settings,
          {
            key: predefined.key,
            value: '',
            type: predefined.type,
            description: predefined.description,
          },
        ]);
      }
    });
  };

  useEffect(() => {
    if (!loading && settings.length === 0) {
      ensurePredefinedSettings();
    }
  }, [loading]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-playfair uppercase tracking-wider">Podešavanja</h1>
        <button
          onClick={addNewSetting}
          className="bg-white text-black px-4 sm:px-6 py-2 sm:py-3 font-semibold uppercase tracking-wider hover:bg-gray-200 transition-all text-sm sm:text-base w-full sm:w-auto justify-center"
        >
          Dodaj Novo
        </button>
      </div>

      {/* O nama Sekcija */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 border border-white/10 p-6 md:p-8 mb-8 rounded-lg"
      >
        <h2 className="text-2xl font-bold font-playfair uppercase tracking-wider mb-6">
          O nama Sekcija
        </h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Naslov</label>
            <input
              type="text"
              value={aboutTitle}
              onChange={(e) => setAboutTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white"
              placeholder="KŽK PARTIZAN 1953"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Tekst</label>
            <textarea
              value={aboutText}
              onChange={(e) => setAboutText(e.target.value)}
              rows={8}
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white resize-none"
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
        className="bg-white/5 border border-white/10 p-6 md:p-8 mb-8 rounded-lg"
      >
        <h2 className="text-2xl font-bold font-playfair uppercase tracking-wider mb-6">
          Istorijat Kluba Sekcija
        </h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Naslov</label>
            <input
              type="text"
              value={historyTitle}
              onChange={(e) => setHistoryTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white"
              placeholder="KŽK Partizan 1953 – Tradicija, ponos i vrhunski rezultati"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Tekst</label>
            <textarea
              value={historyText}
              onChange={(e) => setHistoryText(e.target.value)}
              rows={12}
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white resize-none font-mono text-sm"
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

      {/* Predsednik Kluba Sekcija */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 border border-white/10 p-6 md:p-8 mb-8 rounded-lg"
      >
        <h2 className="text-2xl font-bold font-playfair uppercase tracking-wider mb-6">
          Predsednik Kluba Sekcija
        </h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Poruka</label>
            <textarea
              value={presidentMessage}
              onChange={(e) => setPresidentMessage(e.target.value)}
              rows={6}
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white resize-none"
              placeholder="Poruka predsednika kluba..."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Ime</label>
              <input
                type="text"
                value={presidentName}
                onChange={(e) => setPresidentName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white"
                placeholder="Stevica Kujundžić"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Titula</label>
              <input
                type="text"
                value={presidentTitle}
                onChange={(e) => setPresidentTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white"
                placeholder="Predsednik kluba"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Slika</label>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              {presidentImage && (
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0">
                  <Image
                    src={presidentImage}
                    alt="Predsednik"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePresidentImageUpload}
                  disabled={uploadingPresidentImage}
                  className="hidden"
                  id="president-image-upload"
                />
                <label
                  htmlFor="president-image-upload"
                  className="inline-block bg-white/10 border border-white/20 px-4 py-2 cursor-pointer hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingPresidentImage ? 'Upload...' : presidentImage ? 'Promeni Sliku' : 'Izaberi Sliku'}
                </label>
              </div>
            </div>
          </div>
          <button
            onClick={handleSavePresident}
            disabled={savingPresident}
            className="bg-white text-black px-6 py-3 font-semibold uppercase tracking-wider hover:bg-gray-200 transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="mr-2" size={20} />
            {savingPresident ? 'Čuvanje...' : 'Sačuvaj Sekciju "Predsednik kluba"'}
          </button>
        </div>
      </motion.div>

      {/* Škola Košarke Sekcija */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 border border-white/10 p-6 md:p-8 mb-8 rounded-lg"
      >
        <h2 className="text-2xl font-bold font-playfair uppercase tracking-wider mb-6">
          Škola Košarke Sekcija
        </h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Tekst</label>
            <textarea
              value={sectionTexts.basketball_school_text || ''}
              onChange={(e) => {
                const newTexts = { ...sectionTexts, basketball_school_text: e.target.value };
                setSectionTexts(newTexts);
              }}
              rows={6}
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white resize-none"
              placeholder="Tekst o školi košarke..."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Ime Kontakta</label>
              <input
                type="text"
                value={sectionTexts.basketball_school_contact_name || ''}
                onChange={(e) => {
                  const newTexts = { ...sectionTexts, basketball_school_contact_name: e.target.value };
                  setSectionTexts(newTexts);
                }}
                className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white"
                placeholder="Sofija Čukić"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Telefon</label>
              <input
                type="text"
                value={sectionTexts.basketball_school_contact_phone || ''}
                onChange={(e) => {
                  const newTexts = { ...sectionTexts, basketball_school_contact_phone: e.target.value };
                  setSectionTexts(newTexts);
                }}
                className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white"
                placeholder="+381 66 8391 992"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={sectionTexts.basketball_school_contact_email || ''}
                onChange={(e) => {
                  const newTexts = { ...sectionTexts, basketball_school_contact_email: e.target.value };
                  setSectionTexts(newTexts);
                }}
                className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white"
                placeholder="sofija.cukic@kzkpartizan1953.rs"
              />
            </div>
          </div>
          <button
            onClick={async () => {
              try {
                setSaving(true);
                await apiClient.updateSetting({
                  key: 'basketball_school_text',
                  value: sectionTexts.basketball_school_text || '',
                  type: 'text',
                  description: 'Tekst sekcije Škola košarke',
                });
                await apiClient.updateSetting({
                  key: 'basketball_school_contact_name',
                  value: sectionTexts.basketball_school_contact_name || '',
                  type: 'text',
                  description: 'Ime kontakta za školu košarke',
                });
                await apiClient.updateSetting({
                  key: 'basketball_school_contact_phone',
                  value: sectionTexts.basketball_school_contact_phone || '',
                  type: 'text',
                  description: 'Telefon za školu košarke',
                });
                await apiClient.updateSetting({
                  key: 'basketball_school_contact_email',
                  value: sectionTexts.basketball_school_contact_email || '',
                  type: 'text',
                  description: 'Email za školu košarke',
                });
                toast.success('Sekcija "Škola košarke" je uspešno sačuvana');
              } catch (error) {
                toast.error('Greška pri čuvanju sekcije "Škola košarke"');
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
            className="bg-white text-black px-6 py-3 font-semibold uppercase tracking-wider hover:bg-gray-200 transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="mr-2" size={20} />
            {saving ? 'Čuvanje...' : 'Sačuvaj Sekciju "Škola košarke"'}
          </button>
        </div>
      </motion.div>

      {/* WABA Liga Ažuriranje Sekcija */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 border border-white/10 p-6 md:p-8 mb-8 rounded-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold font-playfair uppercase tracking-wider mb-2">
              WABA Liga Ažuriranje
            </h2>
            <p className="text-gray-400 font-montserrat text-sm">
              Ažuriraj podatke WABA lige iz baze podataka. Scraping može potrajati 10-30 sekundi.
            </p>
            {wabaLastUpdate && (
              <p className="text-gray-500 font-montserrat text-xs mt-2">
                Poslednje ažuriranje: {new Date(wabaLastUpdate).toLocaleString('sr-RS')}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleWabaUpdate}
            disabled={wabaUpdating}
            className={`px-6 py-3 font-semibold uppercase tracking-wider transition-all flex items-center gap-2 ${
              wabaStatus === 'success'
                ? 'bg-green-500 text-white'
                : wabaStatus === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-white text-black hover:bg-gray-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {wabaUpdating ? (
              <>
                <RefreshCw className="animate-spin" size={20} />
                <span>Ažuriranje...</span>
              </>
            ) : wabaStatus === 'success' ? (
              <>
                <CheckCircle2 size={20} />
                <span>Uspešno Ažurirano</span>
              </>
            ) : wabaStatus === 'error' ? (
              <>
                <AlertCircle size={20} />
                <span>Greška</span>
              </>
            ) : (
              <>
                <RefreshCw size={20} />
                <span>Ažuriraj WABA Ligu</span>
              </>
            )}
          </button>
          
          {wabaUpdating && (
            <div className="text-gray-400 font-montserrat text-sm">
              Molimo sačekajte, scraping je u toku...
            </div>
          )}
        </div>
      </motion.div>

      {loading ? (
        <div className="text-center py-20">
          <div className="text-gray-400">Učitavanje...</div>
        </div>
      ) : (
        <div className="space-y-6">
          {settings.map((setting, index) => (
            <div
              key={index}
              className="bg-white/5 border border-white/10 p-6 hover:bg-white/10 transition-all"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Key</label>
                  <input
                    type="text"
                    value={setting.key}
                    onChange={(e) =>
                      setSettings((prev) =>
                        prev.map((s, i) => (i === index ? { ...s, key: e.target.value } : s))
                      )
                    }
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white"
                    placeholder="setting_key"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <select
                    value={setting.type}
                    onChange={(e) =>
                      setSettings((prev) =>
                        prev.map((s, i) =>
                          i === index ? { ...s, type: e.target.value as 'text' | 'image' | 'json' } : s
                        )
                      )
                    }
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white"
                  >
                    <option value="text">Text</option>
                    <option value="image">Image</option>
                    <option value="json">JSON</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <input
                    type="text"
                    value={setting.description || ''}
                    onChange={(e) =>
                      setSettings((prev) =>
                        prev.map((s, i) => (i === index ? { ...s, description: e.target.value } : s))
                      )
                    }
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white"
                    placeholder="Opis"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Value</label>
                {setting.type === 'text' || setting.type === 'image' ? (
                  <input
                    type="text"
                    value={setting.value}
                    onChange={(e) => handleChange(setting.key, e.target.value)}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white"
                    placeholder="Vrednost"
                  />
                ) : (
                  <textarea
                    value={setting.value}
                    onChange={(e) => handleChange(setting.key, e.target.value)}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white resize-none"
                    placeholder="JSON vrednost"
                  />
                )}
              </div>
              <button
                onClick={() => handleSave(setting)}
                disabled={saving || !setting.key}
                className="bg-white text-black px-6 py-3 font-semibold uppercase tracking-wider hover:bg-gray-200 transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="mr-2" size={20} />
                Sačuvaj
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

