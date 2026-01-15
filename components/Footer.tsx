'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useEffect, useState } from 'react';

export default function Footer() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    loadLogo();
  }, []);

  const loadLogo = async () => {
    // Primarno koristi logo iz /public foldera
    setLogoUrl('/kzk_partizan.png');
    
    // Opciono: ako želiš da se učitava iz baze kao fallback, otkomentariši kod ispod
    // try {
    //   const setting = await apiClient.getSettings('logo_url');
    //   if (setting && setting.value) {
    //     setLogoUrl(setting.value);
    //   }
    // } catch (error) {
    //   // Koristi default logo iz /public
    // }
  };

  return (
    <footer className="relative bg-black border-t border-white/10 pb-32 md:pb-40 overflow-hidden">
      {/* Pozadinska slika */}
      <div className="absolute inset-0 opacity-20">
        <Image
          src="/0V2A4118-1024x682_nbf7tx.jpg"
          alt="Background"
          fill
          className="object-cover"
        />
      </div>
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-4 mb-4">
              {logoUrl && (
                <div className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0">
                  <Image
                    src={logoUrl}
                    alt="KŽK Partizan 1953 Logo"
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              <h3 className="text-2xl md:text-3xl font-bold font-playfair">KŽK Partizan 1953</h3>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Ženski Košarkaški Klub Partizan - Tradicija, ponos i uspeh od 1953. godine.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://www.instagram.com/kzk_partizan1953/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={24} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 uppercase text-sm tracking-wider">
              Brzi Linkovi
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Početna
                </Link>
              </li>
              <li>
                <Link href="/tim" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Tim
                </Link>
              </li>
              <li>
                <Link href="/o-nama" className="text-gray-400 hover:text-white text-sm transition-colors">
                  O Nama
                </Link>
              </li>
              <li>
                <Link href="/vesti" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Vesti
                </Link>
              </li>
              <li>
                <Link href="/galerija" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Galerija
                </Link>
              </li>
              <li>
                <Link href="/kontakt" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Kontakt
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold mb-4 uppercase text-sm tracking-wider">
              Kontakt
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2 text-gray-400 text-sm">
                <MapPin size={16} className="mt-1 flex-shrink-0" />
                <a 
                  href="https://www.google.com/maps/place/Humska+1,+Beograd+11000/data=!4m2!3m1!1s0x475a7014cebc1e11:0x5a174bda07fc78ac?sa=X&ved=1t:242&ictx=111"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Humska 1,<br />11000 Beograd, Srbija
                </a>
              </li>
              <li className="flex items-center space-x-2 text-gray-400 text-sm">
                <Phone size={16} className="flex-shrink-0" />
                <a href="tel:+381112647658" className="hover:text-white transition-colors">
                  +381 11 264 76 58
                </a>
              </li>
              <li className="flex items-center space-x-2 text-gray-400 text-sm">
                <Mail size={16} className="flex-shrink-0" />
                <a href="mailto:info@kzkpartizan1953.rs" className="hover:text-white transition-colors">
                  info@kzkpartizan1953.rs
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} KŽK Partizan 1953. Sva prava zadržana.</p>
        </div>
      </div>
      </div>
    </footer>
  );
}

