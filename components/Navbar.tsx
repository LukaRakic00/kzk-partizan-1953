'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api-client';
import CloudinaryImage from './CloudinaryImage';

const navItems = [
  { href: '/', label: 'POČETNA' },
  { href: '/klub', label: 'KLUB' },
  { href: '/tim', label: 'TIM' },
  { href: '/o-nama', label: 'O NAMA' },
  { href: '/galerija', label: 'GALERIJA' },
  { href: '/vesti', label: 'VESTI' },
  { href: '/kontakt', label: 'KONTAKT' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [showKlubDropdown, setShowKlubDropdown] = useState(false);
  const [showTimDropdown, setShowTimDropdown] = useState(false);
  const [showONamaDropdown, setShowONamaDropdown] = useState(false);
  const [showIgraciDropdown, setShowIgraciDropdown] = useState(false);
  const [showKontaktDropdown, setShowKontaktDropdown] = useState(false);
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
        setLogoUrl('/kzk_partizan.png');
      }
    } catch (error) {
      // Fallback na default logo
      setLogoUrl('/kzk_partizan.png');
    }
  };

  // Split nav items into left and right
  const leftNavItems = navItems.slice(0, 3); // POČETNA, KLUB, TIM
  const rightNavItems = navItems.slice(3); // O NAMA, GALERIJA, VESTI, KONTAKT

  const renderNavItem = (item: typeof navItems[0]) => {
    if (item.href === '/klub') {
      return (
        <div
          key={item.href}
          className="relative"
          onMouseEnter={() => setShowKlubDropdown(true)}
          onMouseLeave={() => setShowKlubDropdown(false)}
        >
          <Link
            href={item.href}
            className={`text-sm lg:text-base font-bold font-montserrat tracking-wider uppercase transition-colors relative group px-2 py-1 ${
              pathname === item.href || pathname.startsWith('/klub')
                ? 'text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            {item.label}
            {(pathname === item.href || pathname.startsWith('/klub')) && (
              <motion.div
                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white"
                layoutId="underline"
              />
            )}
          </Link>
          {/* Dropdown Menu */}
          <AnimatePresence>
            {showKlubDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 mt-2 bg-black/95 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl min-w-[200px] py-2"
              >
                <Link
                  href="/klub#upravni-odbor"
                  className="block px-4 py-2 text-sm font-montserrat tracking-wider uppercase text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                  onClick={() => setShowKlubDropdown(false)}
                >
                  Upravni Odbor
                </Link>
                <Link
                  href="/klub#menadzment"
                  className="block px-4 py-2 text-sm font-montserrat tracking-wider uppercase text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                  onClick={() => setShowKlubDropdown(false)}
                >
                  Menadžment
                </Link>
                <Link
                  href="/klub#rukovodstvo"
                  className="block px-4 py-2 text-sm font-montserrat tracking-wider uppercase text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                  onClick={() => setShowKlubDropdown(false)}
                >
                  Rukovodstvo
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }
    if (item.href === '/tim') {
      return (
        <div
          key={item.href}
          className="relative"
          onMouseEnter={() => setShowTimDropdown(true)}
          onMouseLeave={() => setShowTimDropdown(false)}
        >
          <Link
            href={item.href}
            className={`text-sm lg:text-base font-bold font-montserrat tracking-wider uppercase transition-colors relative group px-2 py-1 ${
              pathname === item.href || pathname.startsWith('/tim/') || pathname.startsWith('/igraci')
                ? 'text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            {item.label}
            {(pathname === item.href || pathname.startsWith('/tim/') || pathname.startsWith('/igraci')) && (
              <motion.div
                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white"
                layoutId="underline"
              />
            )}
          </Link>
          {/* Dropdown Menu */}
          <AnimatePresence>
            {showTimDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 mt-2 bg-black/95 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl min-w-[200px] py-2"
              >
                <div
                  className="relative"
                  onMouseEnter={() => setShowIgraciDropdown(true)}
                  onMouseLeave={() => setShowIgraciDropdown(false)}
                >
                  <div className="block px-4 py-2 text-sm font-montserrat tracking-wider uppercase text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
                    Igrači
                    <span className="ml-2">›</span>
                  </div>
                  <AnimatePresence>
                    {showIgraciDropdown && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-full top-0 ml-2 bg-black/95 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl min-w-[180px] py-2"
                        onMouseEnter={() => setShowIgraciDropdown(true)}
                        onMouseLeave={() => setShowIgraciDropdown(false)}
                      >
                        <Link
                          href="/igraci#seniori"
                          className="block px-4 py-2 text-sm font-montserrat tracking-wider uppercase text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                          onClick={() => {
                            setShowTimDropdown(false);
                            setShowIgraciDropdown(false);
                          }}
                        >
                          Seniori
                        </Link>
                        <Link
                          href="/igraci#juniori"
                          className="block px-4 py-2 text-sm font-montserrat tracking-wider uppercase text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                          onClick={() => {
                            setShowTimDropdown(false);
                            setShowIgraciDropdown(false);
                          }}
                        >
                          Juniori
                        </Link>
                        <Link
                          href="/igraci#pionirke"
                          className="block px-4 py-2 text-sm font-montserrat tracking-wider uppercase text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                          onClick={() => {
                            setShowTimDropdown(false);
                            setShowIgraciDropdown(false);
                          }}
                        >
                          Pionirke
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }
              if (item.href === '/o-nama') {
                return (
                  <div
                    key={item.href}
                    className="relative"
                    onMouseEnter={() => setShowONamaDropdown(true)}
                    onMouseLeave={() => setShowONamaDropdown(false)}
                  >
                    <Link
                      href={item.href}
                      className={`text-sm lg:text-base font-bold font-montserrat tracking-wider uppercase transition-colors relative group px-2 py-1 ${
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
                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {showONamaDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full left-0 mt-2 bg-black/95 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl min-w-[200px] py-2"
                        >
                          <Link
                            href="/o-nama#istorijat"
                            className="block px-4 py-2 text-sm font-montserrat tracking-wider uppercase text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                            onClick={() => setShowONamaDropdown(false)}
                          >
                            Istorijat
                          </Link>
                          <Link
                            href="/o-nama#statut"
                            className="block px-4 py-2 text-sm font-montserrat tracking-wider uppercase text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                            onClick={() => setShowONamaDropdown(false)}
                          >
                            Statut
                          </Link>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }
              if (item.href === '/kontakt') {
                return (
                  <div
                    key={item.href}
                    className="relative"
                    onMouseEnter={() => setShowKontaktDropdown(true)}
                    onMouseLeave={() => setShowKontaktDropdown(false)}
                  >
                    <Link
                      href={item.href}
                      className={`text-sm lg:text-base font-bold font-montserrat tracking-wider uppercase transition-colors relative group px-2 py-1 ${
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
                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {showKontaktDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full right-0 mt-2 bg-black/95 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl min-w-[200px] py-2"
                        >
                          <Link
                            href="/kontakt#skola-kosarke"
                            className="block px-4 py-2 text-sm font-montserrat tracking-wider uppercase text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                            onClick={() => setShowKontaktDropdown(false)}
                          >
                            Škola Košarke
                          </Link>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }
              return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm lg:text-base font-bold font-montserrat tracking-wider uppercase transition-colors relative group px-2 py-1 ${
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
    );
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 pt-4 ${
        scrolled ? 'bg-black/95 backdrop-blur-sm shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24 md:h-28 relative">
          {/* Desktop Navigation - Left Side */}
          <div className="hidden md:flex items-center space-x-8 lg:space-x-10 flex-1">
            {leftNavItems.map((item) => renderNavItem(item))}
          </div>

          {/* Logo - Centered (Desktop) */}
          <Link 
            href="/" 
            className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center justify-center group z-10"
          >
            {logoUrl && (
              <div className="relative w-28 h-28 md:w-36 md:h-36 lg:w-40 lg:h-40 flex-shrink-0">
                <CloudinaryImage
                  src={logoUrl}
                  alt="KŽK Partizan 1953 Logo"
                  fill
                  className="object-contain transition-transform duration-300 group-hover:scale-110"
                  priority
                  placeholder="blur"
                  objectFit="contain"
                  sizes="(max-width: 768px) 96px, (max-width: 1024px) 144px, 160px"
                />
              </div>
            )}
          </Link>

          {/* Desktop Navigation - Right Side */}
          <div className="hidden md:flex items-center space-x-8 lg:space-x-10 flex-1 justify-end">
            {rightNavItems.map((item) => renderNavItem(item))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-white p-2 z-20"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Logo - Centered */}
      <div className="md:hidden absolute left-1/2 transform -translate-x-1/2 top-4 h-24 flex items-center justify-center z-10">
        <Link href="/" className="flex items-center justify-center group">
          {logoUrl && (
            <div className="relative w-24 h-24 flex-shrink-0">
              <CloudinaryImage
                src={logoUrl}
                alt="KŽK Partizan 1953 Logo"
                fill
                className="object-contain transition-transform duration-300 group-hover:scale-110"
                priority
                placeholder="blur"
                objectFit="contain"
                sizes="96px"
              />
            </div>
          )}
        </Link>
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
              {navItems.map((item) => {
                if (item.href === '/klub') {
                  return (
                    <div key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`w-full text-left text-sm font-bold tracking-wider uppercase transition-colors ${
                          pathname === item.href || pathname.startsWith('/klub')
                            ? 'text-white border-l-2 border-white pl-4'
                            : 'text-gray-300 hover:text-white pl-4'
                        }`}
                      >
                        {item.label}
                      </Link>
                      <div className="pl-6 mt-2 space-y-2">
                        <Link
                          href="/klub#upravni-odbor"
                          onClick={() => {
                            setIsOpen(false);
                          }}
                          className="block text-sm font-montserrat tracking-wider uppercase text-gray-400 hover:text-white transition-colors"
                        >
                          Upravni Odbor
                        </Link>
                        <Link
                          href="/klub#menadzment"
                          onClick={() => {
                            setIsOpen(false);
                          }}
                          className="block text-sm font-montserrat tracking-wider uppercase text-gray-400 hover:text-white transition-colors"
                        >
                          Menadžment
                        </Link>
                        <Link
                          href="/klub#rukovodstvo"
                          onClick={() => {
                            setIsOpen(false);
                          }}
                          className="block text-sm font-montserrat tracking-wider uppercase text-gray-400 hover:text-white transition-colors"
                        >
                          Rukovodstvo
                        </Link>
                      </div>
                    </div>
                  );
                }
                if (item.href === '/o-nama') {
                  return (
                    <div key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`w-full text-left text-sm font-bold tracking-wider uppercase transition-colors ${
                          pathname === item.href
                            ? 'text-white border-l-2 border-white pl-4'
                            : 'text-gray-300 hover:text-white pl-4'
                        }`}
                      >
                        {item.label}
                      </Link>
                      <div className="pl-6 mt-2 space-y-2">
                        <Link
                          href="/o-nama#istorijat"
                          onClick={() => {
                            setIsOpen(false);
                          }}
                          className="block text-sm font-montserrat tracking-wider uppercase text-gray-400 hover:text-white transition-colors"
                        >
                          Istorijat
                        </Link>
                        <Link
                          href="/o-nama#statut"
                          onClick={() => {
                            setIsOpen(false);
                          }}
                          className="block text-sm font-montserrat tracking-wider uppercase text-gray-400 hover:text-white transition-colors"
                        >
                          Statut
                        </Link>
                      </div>
                    </div>
                  );
                }
                if (item.href === '/tim') {
                  return (
                    <div key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`w-full text-left text-sm font-bold tracking-wider uppercase transition-colors ${
                          pathname === item.href || pathname.startsWith('/tim/') || pathname.startsWith('/igraci')
                            ? 'text-white border-l-2 border-white pl-4'
                            : 'text-gray-300 hover:text-white pl-4'
                        }`}
                      >
                        {item.label}
                      </Link>
                      <div className="pl-6 mt-2 space-y-2">
                        <div>
                          <div className="block text-sm font-montserrat tracking-wider uppercase text-gray-400 pl-4 mb-2">
                            Igrači
                          </div>
                          <div className="pl-4 space-y-2">
                            <Link
                              href="/igraci#seniori"
                              onClick={() => {
                                setIsOpen(false);
                              }}
                              className="block text-sm font-montserrat tracking-wider uppercase text-gray-400 hover:text-white transition-colors"
                            >
                              Seniori
                            </Link>
                            <Link
                              href="/igraci#juniori"
                              onClick={() => {
                                setIsOpen(false);
                              }}
                              className="block text-sm font-montserrat tracking-wider uppercase text-gray-400 hover:text-white transition-colors"
                            >
                              Juniori
                            </Link>
                            <Link
                              href="/igraci#pionirke"
                              onClick={() => {
                                setIsOpen(false);
                              }}
                              className="block text-sm font-montserrat tracking-wider uppercase text-gray-400 hover:text-white transition-colors"
                            >
                              Pionirke
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                if (item.href === '/kontakt') {
                  return (
                    <div key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`w-full text-left text-sm font-bold tracking-wider uppercase transition-colors ${
                          pathname === item.href
                            ? 'text-white border-l-2 border-white pl-4'
                            : 'text-gray-300 hover:text-white pl-4'
                        }`}
                      >
                        {item.label}
                      </Link>
                      <div className="pl-6 mt-2 space-y-2">
                        <Link
                          href="/kontakt#skola-kosarke"
                          onClick={() => {
                            setIsOpen(false);
                          }}
                          className="block text-sm font-montserrat tracking-wider uppercase text-gray-400 hover:text-white transition-colors"
                        >
                          Škola Košarke
                        </Link>
                      </div>
                    </div>
                  );
                }
                return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`block text-sm font-bold tracking-wider uppercase transition-colors ${
                    pathname === item.href
                      ? 'text-white border-l-2 border-white pl-4'
                      : 'text-gray-300 hover:text-white pl-4'
                  }`}
                >
                  {item.label}
                </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
