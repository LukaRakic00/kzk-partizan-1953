'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LiveMatches from '@/components/LiveMatches';
import InteractiveBackground from '@/components/InteractiveBackground';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function KontaktPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    title: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [sectionTexts, setSectionTexts] = useState<any>({});

  useEffect(() => {
    loadSectionTexts();
  }, []);

  const loadSectionTexts = async () => {
    try {
      const texts = await apiClient.getSettings();
      const textsObj: any = {};
      texts.forEach((setting: any) => {
        if (setting.key.startsWith('basketball_school_')) {
          textsObj[setting.key] = setting.value;
        }
      });
      setSectionTexts(textsObj);
    } catch (error) {
      console.error('Error loading section texts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await apiClient.sendContactMessage({
        name: formData.name,
        email: formData.email,
        title: formData.title,
        message: formData.message,
      });
      
      toast.success('Poruka je uspešno poslata!');
      setFormData({ name: '', email: '', title: '', message: '' });
    } catch (error: any) {
      toast.error(error.message || 'Greška pri slanju poruke');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen relative">
      {/* Interactive Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <InteractiveBackground />
      </div>

      <div className="relative z-10">
        <Navbar />

        <section className="pt-32 md:pt-40 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-16"
            >
              <h1 className="text-[36px] font-bold font-playfair mb-4 uppercase tracking-wider text-white">
                Kontakt
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Za sve dodatne informacije, pitanja ili saradnju, slobodno nas kontaktirajte
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
              {/* Contact Info */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8">
                  <h2 className="text-2xl font-bold font-playfair mb-6 text-white">Kontakt Informacije</h2>
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1 text-white">Adresa</h3>
                        <p className="text-gray-300">Humska 1,</p>
                        <p className="text-gray-300">11000 Beograd, Srbija</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1 text-white">Telefon</h3>
                        <a href="tel:+381112647658" className="text-gray-300 hover:text-white transition-colors">
                          +381 11 264 76 58
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Mail size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1 text-white">Email</h3>
                        <a href="mailto:info@kzkpartizan1953.rs" className="text-gray-300 hover:text-white transition-colors">
                          info@kzkpartizan1953.rs
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8"
              >
                <h2 className="text-2xl font-bold font-playfair mb-6 text-white">Pošaljite Poruku</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-300">
                      Ime i Prezime <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white transition-colors rounded-lg"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-300">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white transition-colors rounded-lg"
                    />
                  </div>

                  <div>
                    <label htmlFor="title" className="block text-sm font-medium mb-2 text-gray-300">
                      Naslov poruke <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white transition-colors rounded-lg"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-2 text-gray-300">
                      Poruka <span className="text-gray-500 text-xs">(opciono)</span>
                    </label>
                    <textarea
                      id="message"
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white transition-colors resize-none rounded-lg"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-white text-black px-6 py-4 font-semibold uppercase tracking-wider hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center rounded-lg"
                  >
                    {submitting ? (
                      'Slanje...'
                    ) : (
                      <>
                        <Send className="mr-2" size={20} />
                        Pošalji Poruku
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            </div>

            {/* Lokacija - Mapa */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-12"
            >
              <h2 className="text-[30px] font-bold font-playfair mb-6 text-white text-center">LOKACIJA</h2>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2830.1234567890123!2d20.456789!3d44.789012!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x475a7014cebc1e11%3A0x5a174bda07fc78ac!2sHumska%201%2C%20Beograd!5e0!3m2!1ssr!2srs!4v1234567890123!5m2!1ssr!2srs"
                  width="100%"
                  height="450"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full"
                  title="Lokacija KŽK Partizan 1953"
                ></iframe>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Predstojeći Mečevi */}
        <div className="pt-12">
          <LiveMatches />
        </div>

        {/* Škola Košarke Sekcija */}
        <section id="skola-kosarke" className="pt-12 py-20 bg-black/50 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-12">
                <h2 className="text-[30px] font-bold font-playfair uppercase tracking-wider mb-4 text-white">
                  Škola Košarke
                </h2>
                <div className="w-24 h-1 bg-white mx-auto mb-8"></div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8 md:p-12">
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-lg md:text-xl text-gray-300 leading-relaxed mb-8 text-center"
                >
                  {sectionTexts.basketball_school_text || 'KŽK Partizan 1953 svake godine otvara vrata novim generacijama mladih košarkašica kroz upis u školu košarke. Naš cilj je da otkrijemo, razvijemo i inspirišemo buduće zvezde ovog sporta. Ako voliš košarku, sanjaš velike snove i želiš da rasteš uz podršku vrhunskih trenera i tradicije duge decenijama – pravo je vreme da postaneš deo crno-bele porodice!'}
                </motion.p>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/5 border border-white/10 rounded-lg p-6 text-center"
                >
                  <h3 className="text-xl md:text-2xl font-bold font-playfair mb-4 text-white">Kontakt</h3>
                  <div className="space-y-3 text-gray-300">
                    <p className="text-lg font-semibold">{sectionTexts.basketball_school_contact_name || 'Sofija Čukić'}</p>
                    <a 
                      href={`tel:${sectionTexts.basketball_school_contact_phone || '+381668391992'}`}
                      className="block text-lg hover:text-white transition-colors"
                    >
                      {sectionTexts.basketball_school_contact_phone || '+381 66 8391 992'}
                    </a>
                    <a 
                      href={`mailto:${sectionTexts.basketball_school_contact_email || 'sofija.cukic@kzkpartizan1953.rs'}`}
                      className="block text-lg hover:text-white transition-colors break-all"
                    >
                      {sectionTexts.basketball_school_contact_email || 'sofija.cukic@kzkpartizan1953.rs'}
                    </a>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}

