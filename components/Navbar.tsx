'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api-client';
import Image from 'next/image';

const navItems = [
  { href: '/', label: 'POČETNA' },
  { href: '/tim', label: 'TIM' },
  { href: '/status-kluba', label: 'STATUS KLUBA' },
  { href: '/istorijat', label: 'ISTORIJAT' },
  { href: '/galerija', label: 'GALERIJA' },
  { href: '/novosti', label: 'NOVOSTI' },
  { href: '/kontakt', label: 'KONTAKT' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    loadLogo();
  }, []);

  const loadLogo = async () => {
    try {
      const setting = await apiClient.getSettings('logo_url');
      if (setting && setting.value) {
        setLogoUrl(setting.value);
      } else {
        // Fallback na default logo
        setLogoUrl('https://res.cloudinary.com/diy4whjvs/image/upload/v1763032549/logo-zkz-01_lnh8b3.png');
      }
    } catch (error) {
      // Fallback na default logo
      setLogoUrl('https://res.cloudinary.com/diy4whjvs/image/upload/v1763032549/logo-zkz-01_lnh8b3.png');
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-black/95 backdrop-blur-sm shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24 md:h-28">
          <Link href="/" className="flex items-center space-x-4 md:space-x-6 group">
            {logoUrl && (
              <div className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0">
                <Image
                  src={logoUrl}
                  alt="KŽK Partizan 1953 Logo"
                  fill
                  className="object-contain transition-transform duration-300 group-hover:scale-110"
                  priority
                />
              </div>
            )}
            <div className="text-lg md:text-xl lg:text-2xl font-bold font-playfair tracking-wider group-hover:scale-105 transition-transform">
              KŽK Partizan 1953
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8 lg:space-x-10 ml-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm lg:text-base font-medium font-montserrat tracking-wider uppercase transition-colors relative group px-2 py-1 ${
                  pathname === item.href
                    ? 'text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {item.label}
                {pathname === item.href && (
                  <motion.div
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white"
                    layoutId="underline"
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-white p-2"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black border-t border-white/10"
          >
            <div className="px-4 py-4 space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`block text-sm font-medium tracking-wider uppercase transition-colors ${
                    pathname === item.href
                      ? 'text-white border-l-2 border-white pl-4'
                      : 'text-gray-300 hover:text-white pl-4'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
